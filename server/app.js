const express = require("express");
const morgan = require("morgan");
const colors = require("colors");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Custom Imports
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const doctorRouter = require("./routes/doctorRoutes");

const corsOptions = {
  origin: "*",
  methods: "*",
  allowedHeaders: "*",
};

const app = express();
app.use(cors(corsOptions));

// Logging in development mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log("🛠️ Development mode logging enabled (morgan)".cyan);
}

// Parse incoming JSON
app.use(express.json({ limit: "10kb" }));

// Add request timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/doctors", doctorRouter);

// PRODUCTION SETUP
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static("../client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
  console.log("⚙️ Production static file serving is enabled".green);
} else {
  app.get("/", (req, res) => {
    res.send("🌐 Doctor Appointment API is live and ready!");
  });
}

// Handle unknown routes
app.all("*", (req, res, next) => {
  next(new AppError(`❌ Oops! Can't find ${req.originalUrl} on this server.`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
