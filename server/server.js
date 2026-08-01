const mongoose = require("mongoose");
require("dotenv").config();
// Custom Imports
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log("🚨 Oops! An unexpected error occurred. Shutting down...");
  console.log(`Error: ${err.name} - ${err.message}`);
  process.exit(1);
});

const dbURI = process.env.DATABASE;

mongoose.connect(dbURI);

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("❌ MongoDB connection failed:", error);
});

db.once("open", () => {
  console.log("✅ Successfully connected to MongoDB".cyan.underline.bold);
  console.log(`🌍 Running in ${process.env.NODE_ENV} environment`.yellow);
});

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`🚀 Server is live at http://localhost:${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("⚠️ Unhandled promise rejection. Shutting down gracefully...");
  console.log(`Error: ${err.name} - ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
