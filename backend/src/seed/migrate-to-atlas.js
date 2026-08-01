import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const localUri = process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/gest_ecommerce";
const atlasUri = process.env.ATLAS_MONGODB_URI;
const collections = ["products", "looks"];

if (!atlasUri) {
  console.error("Ajoutez ATLAS_MONGODB_URI avec votre URL MongoDB Atlas.");
  process.exit(1);
}

async function copyCollection(sourceDb, targetDb, collectionName) {
  const documents = await sourceDb.collection(collectionName).find({}).toArray();

  await targetDb.collection(collectionName).deleteMany({});

  if (documents.length > 0) {
    await targetDb.collection(collectionName).insertMany(documents);
  }

  console.log(`${documents.length} documents copies dans ${collectionName}.`);
}

const localConnection = await mongoose.createConnection(localUri).asPromise();
const atlasConnection = await mongoose.createConnection(atlasUri).asPromise();

try {
  for (const collection of collections) {
    await copyCollection(localConnection.db, atlasConnection.db, collection);
  }

  console.log("Migration terminee.");
} finally {
  await localConnection.close();
  await atlasConnection.close();
}
