import express from "express"
import User from "../models/User.js"
import { generateToken, authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Login endpoint
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" })
        }

        // Find user with tenant info
        const user = await User.findOne({ email, isActive: true }).populate("tenantId")

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        // Check password
        const isValidPassword = await user.comparePassword(password)
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        // Check if tenant is active
        if (!user.tenantId || !user.tenantId.isActive) {
            return res.status(401).json({ error: "Tenant is inactive" })
        }

        // Generate token
        const token = generateToken(user._id)

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                tenant: {
                    id: user.tenantId._id,
                    name: user.tenantId.name,
                    slug: user.tenantId.slug,
                    plan: user.tenantId.plan,
                    maxNotes: user.tenantId.maxNotes,
                },
            },
        })
    } catch (error) {
        console.error("Login error:", error)
        res.status(500).json({ error: "Login failed" })
    }
})

// Get current user info
router.get("/me", authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            tenant: {
                id: req.tenant._id,
                name: req.tenant.name,
                slug: req.tenant.slug,
                plan: req.tenant.plan,
                maxNotes: req.tenant.maxNotes,
            },
        },
    })
})

export default router
