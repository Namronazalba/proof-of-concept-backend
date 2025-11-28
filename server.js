require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./Routes/auth');
const bookingRoutes = require('./Routes/bookings');

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "🚀 Server is running",
    timestamp: new Date().toISOString(),
  });
});

connectDB()
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

console.log("📌 Loading routes...");
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/uploads", express.static("uploads"));
console.log("📌 Routes registered: /api/auth, /api/bookings, /uploads");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
