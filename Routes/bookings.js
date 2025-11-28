const express = require("express");
const router = express.Router();
const Booking = require("../Models/Booking");
const multer = require("multer");
const { supabase } = require("../lib/supabaseClient"); // your Supabase client
const authMiddleware = require("../middleware/auth");

// Multer in-memory storage for file upload
const upload = multer({ storage: multer.memoryStorage() });

// ------------------------------
// Create a new booking
// ------------------------------
router.post("/", upload.single("file"), authMiddleware, async (req, res) => {
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

    // -----------------------------
    // 1. Save messages (if any)
    // -----------------------------
    if (req.body.messages) {
      try {
        const parsedMessages = JSON.parse(req.body.messages);

        parsedMessages.forEach((msg) => {
          newBooking.messages.push({
            sender: req.user.id,
            content: msg.content,
            createdAt: new Date(),
          });
        });
      } catch (error) {
        console.error("Failed to parse messages:", error);
      }
    }

    // -----------------------------
    // 2. Save attachment (if file uploaded)
    // -----------------------------
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;

      const { data, error } = await supabase.storage
        .from("pdf_storage")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (error) throw error;

      // Get public URL
      const publicURL = supabase.storage
        .from("pdf_storage")
        .getPublicUrl(fileName).data.publicUrl;

      newBooking.attachments.push({
        filename: req.file.originalname,
        url: publicURL,
        uploadedAt: new Date(),
      });
    }


    // -----------------------------
    // 3. Save Booking
    // -----------------------------
    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});



// ------------------------------
// Get a single booking by ID
// ------------------------------
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "messages.sender",
      "email phone"
    );

    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not authorized" });

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------------------
// Get all bookings for logged-in user
// ------------------------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ date: 1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------------------
// Upload attachment to a booking
// ------------------------------
router.post("/:id/attachments", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not authorized" });
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const fileName = `${Date.now()}_${req.file.originalname}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from("pdf_storage")
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (error) throw error;

    // Get public URL
    const { publicURL } = supabase.storage
      .from("pdf_storage")
      .getPublicUrl(fileName);

    // Save attachment in MongoDB
    const attachment = {
      filename: req.file.originalname,
      url: publicURL,
      uploadedAt: new Date(),
    };

    booking.attachments.push(attachment);
    await booking.save();

    res.json(attachment);
  } catch (err) {
    console.error("Supabase upload error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------------------
// Send a message for a booking
// ------------------------------
router.post("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ msg: "Message content is required" });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not authorized" });

    const message = { sender: req.user.id, content, createdAt: new Date() };
    booking.messages.push(message);
    await booking.save();

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------------------
// Get all messages for a booking
// ------------------------------
router.get("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "messages.sender",
      "email phone"
    );

    if (!booking) return res.status(404).json({ msg: "Booking not found" });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not authorized" });

    res.json(booking.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
