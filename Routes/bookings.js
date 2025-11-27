const express = require("express");
const router = express.Router();
const Booking = require("../Models/Booking");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/auth");

// Create a new booking
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { service, date } = req.body;

    if (!service || !date) {
      return res.status(400).json({ msg: "Please provide all fields" });
    }

    const newBooking = new Booking({
      user: req.user.id,
      service,
      date,
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    res.json(booking);
  } catch (err) {
    console.error(err);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid booking ID" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/:id/attachments", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.user.toString() !== req.user.id) return res.status(403).json({ msg: "Not authorized" });

    const attachment = {
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`
    };

    booking.attachments.push(attachment);
    await booking.save();

    res.json(attachment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Send message for a booking
router.post("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.user.toString() !== req.user.id) return res.status(403).json({ msg: "Not authorized" });

    const message = { sender: req.user.id, content };
    booking.messages.push(message);
    await booking.save();

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get all messages for a booking
router.get("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("messages.sender", "email phone");

    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.user.toString() !== req.user.id) return res.status(403).json({ msg: "Not authorized" });

    res.json(booking.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
