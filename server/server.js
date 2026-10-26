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

if (!dbURI) {
  console.error("❌ CRITICAL: DATABASE environment variable is not defined in server/.env.");
  console.error("ℹ️  Please copy server/.env.example to server/.env and provide a valid MongoDB connection URI.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  WARNING: JWT_SECRET environment variable is missing. Using development fallback secret.");
  process.env.JWT_SECRET = "docspot_temporary_jwt_secret_dev_2026";
}

mongoose.connect(dbURI);

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("❌ MongoDB connection failed:", error);
});

db.once("open", () => {
  console.log("✅ Successfully connected to MongoDB".cyan.underline.bold);
  console.log(`🌍 Running in ${process.env.NODE_ENV || "development"} environment`.yellow);
});

const port = process.env.PORT || 5000;
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
