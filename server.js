require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const authRoutes = require('./Routes/auth');
const bookingRoutes = require('./Routes/bookings');

const app = express();

// Body parser
app.use(express.json());

// Root Indicator Route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "🚀 Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Connect to Database
connectDB()
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

// Load Routes
console.log("📌 Loading routes...");
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/uploads", express.static("uploads"));
console.log("📌 Routes registered: /api/auth, /api/bookings, /uploads");

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
