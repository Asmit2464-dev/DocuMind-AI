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

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
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




