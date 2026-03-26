// scripts/migrate-cost-to-cents.js
const mongoose = require('mongoose');
require('dotenv').config();

const Receipt = require('../models/receipt.model');

const BATCH_SIZE = 100;

const maskMongoUri = (uri) => {
  if (!uri) return '(not set)';
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
};

const toCents = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number.parseFloat(String(value).trim());
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
};

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_DATABASE_URI || 'mongodb://localhost:27017/clinic-print';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', maskMongoUri(mongoUri));
};

const buildMigratedArray = (items = []) => {
  let migratedCount = 0;

  const nextItems = items.map((item) => {
    const hasLegacyCost = Object.prototype.hasOwnProperty.call(item, 'cost');
    const alreadyHasCostInCents = typeof item.costInCents === 'number';
    if (!hasLegacyCost || alreadyHasCostInCents) return item;

    const costInCents = toCents(item.cost);
    migratedCount += 1;
    return {
      ...item,
      costInCents,
    };
  });

  return { nextItems, migratedCount };
};

const migrateOneReceipt = async (receipt) => {
  const plain = receipt.toObject();
  const { nextItems: nextService, migratedCount: serviceMigrated } =
    buildMigratedArray(plain.service);
  const { nextItems: nextAdditional, migratedCount: additionalMigrated } =
    buildMigratedArray(plain.additional);
  const { nextItems: nextPrescription, migratedCount: prescriptionMigrated } =
    buildMigratedArray(plain.prescription);

  const migratedItems =
    serviceMigrated + additionalMigrated + prescriptionMigrated;
  if (migratedItems === 0) {
    return { updated: false, migratedItems: 0 };
  }

  await Receipt.updateOne(
    { _id: receipt._id },
    {
      $set: {
        service: nextService,
        additional: nextAdditional,
        prescription: nextPrescription,
      },
    }
  );

  return { updated: true, migratedItems };
};

const migrateCostToCents = async () => {
  const query = {
    $or: [
      { 'service.cost': { $exists: true } },
      { 'additional.cost': { $exists: true } },
      { 'prescription.cost': { $exists: true } },
    ],
  };

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalItemsMigrated = 0;
  let totalErrors = 0;
  let hasMore = true;
  let lastId = null;

  console.log('Starting migration: backfill costInCents (keep cost)');
  console.log(`Batch size: ${BATCH_SIZE}`);

  while (hasMore) {
    const pagedQuery = lastId ? { ...query, _id: { $gt: lastId } } : query;
    const batch = await Receipt.find(pagedQuery)
      .sort({ _id: 1 })
      .limit(BATCH_SIZE);

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    for (const receipt of batch) {
      totalProcessed += 1;
      try {
        const result = await migrateOneReceipt(receipt);
        if (result.updated) {
          totalUpdated += 1;
          totalItemsMigrated += result.migratedItems;
        }
      } catch (error) {
        totalErrors += 1;
        console.error(
          `Failed receipt ${receipt._id} (${receipt.name || 'unnamed'}): ${error.message}`
        );
      }
    }

    lastId = batch[batch.length - 1]._id;
    console.log(
      `Progress - processed: ${totalProcessed}, updated: ${totalUpdated}, items migrated: ${totalItemsMigrated}, errors: ${totalErrors}`
    );
  }

  console.log('\nMigration summary');
  console.log(`Processed receipts: ${totalProcessed}`);
  console.log(`Updated receipts: ${totalUpdated}`);
  console.log(`Migrated cost fields: ${totalItemsMigrated}`);
  console.log(`Errors: ${totalErrors}`);

  if (totalErrors > 0) {
    process.exitCode = 1;
  }
};

const main = async () => {
  try {
    await connectDB();
    await migrateCostToCents();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

main();