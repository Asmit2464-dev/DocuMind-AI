import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT || 8081;
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from .env");
}

const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(express.json());
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (e.g. mobile apps or curl) or if origin is in allowedOrigins
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            return callback(null, true);
        }
        // Also allow any vercel preview domains if deployed on Vercel
        if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive fallback for smooth deployment
    },
    credentials: true
}));

const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        error: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
});


app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    connectDB();
});

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with Db", err);
    }
}




