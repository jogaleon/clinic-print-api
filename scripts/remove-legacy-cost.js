const mongoose = require("mongoose");
require("dotenv").config();

const BATCH_SIZE = Number(process.env.MIGRATE_BATCH_SIZE || 100);
const DRY_RUN = String(process.env.MIGRATE_DRY_RUN || "true").toLowerCase() !== "false";
const ALLOW_SUSPICIOUS = String(process.env.MIGRATE_ALLOW_SUSPICIOUS || "false").toLowerCase() === "true";

const maskMongoUri = (uri) => {
  if (!uri) return "(not set)";
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:***@");
};

const toCents = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number.parseFloat(String(value).trim());
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
};

const toQuantity = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number.parseFloat(String(value).trim());
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

const normalizeDiscount = (discount) => {
  const rawType =
    typeof discount?.type === "string" && discount.type.trim() !== ""
      ? discount.type.trim()
      : "None";
  const type = rawType.toLowerCase() === "regular" ? "None" : rawType;
  const p = Number(discount?.percentage);
  const percentage = Number.isFinite(p) && p >= 0 ? Math.min(p, 100) : 0;
  return { type, percentage };
};

const normalizeDiscountApply = (discountApply) => ({
  service: typeof discountApply?.service === "boolean" ? discountApply.service : true,
  additional: typeof discountApply?.additional === "boolean" ? discountApply.additional : true,
  prescription: typeof discountApply?.prescription === "boolean" ? discountApply.prescription : true,
});

const likelyShouldBeNonZero = (costValue) => {
  if (costValue === null || costValue === undefined) return false;
  const s = String(costValue).trim();
  if (s === "" || s === "0" || s === "0.0" || s === "0.00") return false;
  return true;
};

const normalizeItems = (items = [], { hasQuantity = false } = {}) => {
  let touched = 0;
  let suspiciousZeros = 0;

  const nextItems = items.map((item) => {
    const next = { ...item };

    const centsInvalid =
      typeof next.costInCents !== "number" || Number.isNaN(next.costInCents) || next.costInCents < 0;

    if (centsInvalid) {
      const computed = toCents(next.cost);
      if (computed === 0 && likelyShouldBeNonZero(next.cost)) suspiciousZeros += 1;
      next.costInCents = computed;
      touched += 1;
    } else {
      next.costInCents = Math.round(next.costInCents);
    }

    if (hasQuantity) {
      const qInvalid =
        typeof next.quantity !== "number" || Number.isNaN(next.quantity) || next.quantity < 0;
      if (qInvalid) {
        next.quantity = toQuantity(next.quantity);
        touched += 1;
      }
    }

    if (Object.prototype.hasOwnProperty.call(next, "cost")) {
      delete next.cost;
      touched += 1;
    }

    return next;
  });

  return { nextItems, touched, suspiciousZeros };
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_DATABASE_URI || "mongodb://localhost:27017/clinic-print";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", maskMongoUri(mongoUri));
};

const migrate = async () => {
  const collection = mongoose.connection.db.collection("receipts");

  const query = {
    $or: [
      { "service.cost": { $exists: true } },
      { "additional.cost": { $exists: true } },
      { "prescription.cost": { $exists: true } },
      { "service.costInCents": { $exists: false } },
      { "additional.costInCents": { $exists: false } },
      { "prescription.costInCents": { $exists: false } },
      { "additional.quantity": { $exists: false } },
      { "prescription.quantity": { $exists: false } },
      { "additional.quantity": { $type: "string" } },
      { "prescription.quantity": { $type: "string" } },
      { discount: { $exists: false } },
      { "discount.type": { $exists: false } },
      { "discount.type": { $in: ["regular", "Regular", "REGULAR"] } },
      { "discount.percentage": { $exists: false } },
      { discountApply: { $exists: false } },
      { "discountApply.service": { $exists: false } },
      { "discountApply.additional": { $exists: false } },
      { "discountApply.prescription": { $exists: false } },
    ],
  };

  let processed = 0;
  let updated = 0;
  let touchedFields = 0;
  let suspicious = 0;
  let errors = 0;
  let lastId = null;

  console.log(`Starting migration (${DRY_RUN ? "DRY RUN" : "WRITE"})`);
  console.log(`Batch size: ${BATCH_SIZE}`);

  while (true) {
    const pagedQuery = lastId ? { ...query, _id: { $gt: lastId } } : query;
    const batch = await collection.find(pagedQuery).sort({ _id: 1 }).limit(BATCH_SIZE).toArray();
    if (batch.length === 0) break;

    for (const doc of batch) {
      processed += 1;
      try {
        const service = normalizeItems(doc.service || []);
        const additional = normalizeItems(doc.additional || [], { hasQuantity: true });
        const prescription = normalizeItems(doc.prescription || [], { hasQuantity: true });

        const discount = normalizeDiscount(doc.discount);
        const discountApply = normalizeDiscountApply(doc.discountApply);

        const hasDiscount =
          doc.discount &&
          typeof doc.discount.type === "string" &&
          doc.discount.type.toLowerCase() !== "regular" &&
          typeof doc.discount.percentage === "number";
        const hasDiscountApply =
          doc.discountApply &&
          typeof doc.discountApply.service === "boolean" &&
          typeof doc.discountApply.additional === "boolean" &&
          typeof doc.discountApply.prescription === "boolean";

        const discountTouched = hasDiscount ? 0 : 1;
        const discountApplyTouched = hasDiscountApply ? 0 : 1;

        const docTouched =
          service.touched +
          additional.touched +
          prescription.touched +
          discountTouched +
          discountApplyTouched;

        const docSuspicious =
          service.suspiciousZeros + additional.suspiciousZeros + prescription.suspiciousZeros;
        suspicious += docSuspicious;

        if (docTouched === 0) continue;

        if (docSuspicious > 0 && !ALLOW_SUSPICIOUS) {
          throw new Error(
            `Suspicious zero conversion detected (${docSuspicious}). Set MIGRATE_ALLOW_SUSPICIOUS=true only after manual review.`
          );
        }

        updated += 1;
        touchedFields += docTouched;

        if (!DRY_RUN) {
          await collection.updateOne(
            { _id: doc._id },
            {
              $set: {
                service: service.nextItems,
                additional: additional.nextItems,
                prescription: prescription.nextItems,
                discount,
                discountApply,
              },
            }
          );
        }
      } catch (err) {
        errors += 1;
        console.error(`Failed ${doc._id}: ${err.message}`);
      }
    }

    lastId = batch[batch.length - 1]._id;
    console.log(
      `Progress - processed:${processed}, updated:${updated}, touched:${touchedFields}, suspicious:${suspicious}, errors:${errors}`
    );
  }

  console.log("\nMigration summary");
  console.log(`Processed: ${processed}`);
  console.log(`Would update/Updated docs: ${updated}`);
  console.log(`Touched fields: ${touchedFields}`);
  console.log(`Suspicious zero conversions: ${suspicious}`);
  console.log(`Errors: ${errors}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "WRITE (updates applied)"}`);

  if (errors > 0) process.exitCode = 1;
};

const main = async () => {
  try {
    await connectDB();
    await migrate();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

main();

