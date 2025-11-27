const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  service: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["pending","confirmed","completed","cancelled"], default: "pending" },
  attachments: [
    {
      filename: String,
      url: String, 
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
    messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", BookingSchema);
