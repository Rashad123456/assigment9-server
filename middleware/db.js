const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db('sportnest');
  console.log('Connected to MongoDB');
  return db;
}

module.exports = { connectDB };
