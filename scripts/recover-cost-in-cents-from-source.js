const mongoose = require('mongoose');
require('dotenv').config();

const BATCH_SIZE = Number(process.env.RECOVER_BATCH_SIZE || 200);
const DRY_RUN = String(process.env.RECOVER_DRY_RUN || 'true').toLowerCase() !== 'false';

const SOURCE_URI = process.env.SOURCE_MONGO_URI;
const TARGET_URI = process.env.TARGET_MONGO_URI || process.env.MONGO_DATABASE_URI;
const SOURCE_DB_NAME = process.env.SOURCE_DB_NAME;
const TARGET_DB_NAME = process.env.TARGET_DB_NAME;

const maskMongoUri = (uri) => {
  if (!uri) return '(not set)';
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
};

const normalizeCents = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
};

const normalizeQuantity = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return num;
};

const keyByItemId = (items = []) => {
  const map = new Map();
  for (const item of items) {
    if (item && item.id) map.set(item.id, item);
  }
  return map;
};

const mergeItemsFromSource = (targetItems = [], sourceItems = [], options = { withQuantity: false }) => {
  const sourceById = keyByItemId(sourceItems);
  let changed = 0;

  const nextItems = targetItems.map((targetItem) => {
    const sourceItem = sourceById.get(targetItem.id);
    if (!sourceItem) return targetItem;

    const next = { ...targetItem };
    const nextCents = normalizeCents(sourceItem.costInCents);
    if (next.costInCents !== nextCents) {
      next.costInCents = nextCents;
      changed += 1;
    }

    if (options.withQuantity) {
      const nextQty = normalizeQuantity(sourceItem.quantity);
      if (next.quantity !== nextQty) {
        next.quantity = nextQty;
        changed += 1;
      }
    }

    return next;
  });

  return { nextItems, changed };
};

const run = async () => {
  if (!SOURCE_URI) {
    throw new Error('Missing SOURCE_MONGO_URI in environment.');
  }
  if (!TARGET_URI) {
    throw new Error('Missing TARGET_MONGO_URI (or MONGO_DATABASE_URI) in environment.');
  }

  const sourceConn = await mongoose.createConnection(SOURCE_URI, { dbName: SOURCE_DB_NAME }).asPromise();
  const targetConn = await mongoose.createConnection(TARGET_URI, { dbName: TARGET_DB_NAME }).asPromise();

  try {
    const sourceCollection = sourceConn.db.collection('receipts');
    const targetCollection = targetConn.db.collection('receipts');

    console.log('Source:', maskMongoUri(SOURCE_URI), SOURCE_DB_NAME ? `db=${SOURCE_DB_NAME}` : '');
    console.log('Target:', maskMongoUri(TARGET_URI), TARGET_DB_NAME ? `db=${TARGET_DB_NAME}` : '');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'WRITE'}`);
    console.log(`Batch size: ${BATCH_SIZE}`);

    let lastId = null;
    let processed = 0;
    let foundInSource = 0;
    let changedDocs = 0;
    let changedFields = 0;
    let skippedMissingSource = 0;

    while (true) {
      const query = lastId ? { _id: { $gt: lastId } } : {};
      const targetBatch = await targetCollection.find(query).sort({ _id: 1 }).limit(BATCH_SIZE).toArray();
      if (targetBatch.length === 0) break;

      const sourceIds = targetBatch.map((doc) => doc._id);
      const sourceDocs = await sourceCollection.find({ _id: { $in: sourceIds } }).toArray();
      const sourceById = new Map(sourceDocs.map((doc) => [String(doc._id), doc]));

      for (const targetDoc of targetBatch) {
        processed += 1;
        const sourceDoc = sourceById.get(String(targetDoc._id));
        if (!sourceDoc) {
          skippedMissingSource += 1;
          continue;
        }
        foundInSource += 1;

        const serviceMerged = mergeItemsFromSource(targetDoc.service || [], sourceDoc.service || []);
        const additionalMerged = mergeItemsFromSource(targetDoc.additional || [], sourceDoc.additional || [], {
          withQuantity: true,
        });
        const prescriptionMerged = mergeItemsFromSource(targetDoc.prescription || [], sourceDoc.prescription || [], {
          withQuantity: true,
        });

        const totalChanged =
          serviceMerged.changed + additionalMerged.changed + prescriptionMerged.changed;
        if (totalChanged === 0) continue;

        changedDocs += 1;
        changedFields += totalChanged;

        if (!DRY_RUN) {
          await targetCollection.updateOne(
            { _id: targetDoc._id },
            {
              $set: {
                service: serviceMerged.nextItems,
                additional: additionalMerged.nextItems,
                prescription: prescriptionMerged.nextItems,
              },
            }
          );
        }
      }

      lastId = targetBatch[targetBatch.length - 1]._id;
      console.log(
        `Progress - processed: ${processed}, matchedSource: ${foundInSource}, changedDocs: ${changedDocs}, changedFields: ${changedFields}, missingSource: ${skippedMissingSource}`
      );
    }

    console.log('\nRecovery summary');
    console.log(`Processed target receipts: ${processed}`);
    console.log(`Receipts matched in source: ${foundInSource}`);
    console.log(`Receipts changed: ${changedDocs}`);
    console.log(`Total changed item fields: ${changedFields}`);
    console.log(`Missing in source: ${skippedMissingSource}`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE (updates applied)'}`);
  } finally {
    await sourceConn.close();
    await targetConn.close();
    console.log('Connections closed');
  }
};

run().catch((error) => {
  console.error('Recovery failed:', error);
  process.exitCode = 1;
});

