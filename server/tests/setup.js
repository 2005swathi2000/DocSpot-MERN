const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = process.env.JWT_SECRET || "docspot_test_secret_key_2026";
process.env.NODE_ENV = "test";

let mongoServer;

const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const clearDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

module.exports = {
  connectDB,
  closeDB,
  clearDB,
};
