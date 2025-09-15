import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"

// Import routes
import authRoutes from "./routes/auth.js"
import notesRoutes from "./routes/notes.js"
import tenantsRoutes from "./routes/tenants.js"

// Import DB connection function
import { ConnetToDB } from "./config/dbconfig.js"
import { seedData } from "./scripts/seed.js"

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*",
        credentials: true,
    }),
)

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10000,
})
app.use(limiter)

// Body parsing middleware
app.use(express.json())

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok" })
})

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/notes", notesRoutes)
app.use("/api/tenants", tenantsRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        error: "Something went wrong!",
        message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    })
})

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, async () => {
    try{
        await ConnetToDB();
        await seedData();
        console.log(`Server running on port http://localhost:${PORT}`)    
    }
    catch(err){
        console.error("Failed to start server:", err);
    }
})
