require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const authRoutes = require('./Routes/auth');
const bookingRoutes = require('./Routes/bookings');

const app = express();


app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
