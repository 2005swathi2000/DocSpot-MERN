const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "Please provide User Id"],
    },
    doctorId: {
      type: String,
      required: [true, "Please provide Doctor Id"],
    },
    userInfo: {
      type: Object,
      required: [true, "Please provide User details"],
    },
    doctorInfo: {
      type: Object,
      required: [true, "Please provide Doctor details"],
    },
    date: {
      type: String,
      required: [true, "Please provide date"],
    },
    time: {
      type: String,
      required: [true, "Please provide time"],
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound partial unique index: enforces slot uniqueness only for active (pending/approved) bookings.
// Rejected appointments automatically release the slot for re-booking while preserving audit history.
appointmentSchema.index(
  { doctorId: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "approved"] } },
  }
);

const Appointment = new mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
