import express from "express"
import Tenant from "../models/Tenant.js"
import User from "../models/User.js"
import { authenticateToken, requireRole } from "../middleware/auth.js"

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateToken)

// POST /tenants/:slug/upgrade - Upgrade tenant subscription (Admin only)
router.post("/:slug/upgrade", requireRole("admin"), async (req, res) => {
  try {
    const { slug } = req.params

    // Verify the slug matches the current user's tenant
    if (slug !== req.tenant.slug) {
      return res.status(403).json({
        error: "Not authorized to upgrade this tenant",
        message: "You can only upgrade your own tenant",
      })
    }

    // Check if already on pro plan
    if (req.tenant.plan === "pro") {
      return res.status(400).json({
        error: "Already on Pro plan",
        message: "Tenant is already on the Pro plan",
      })
    }

    // Update tenant to pro plan
    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.tenant._id,
      {
        plan: "pro",
        maxNotes: -1, // -1 means unlimited
      },
      { new: true },
    )

    res.json({
      message: "Successfully upgraded to Pro plan",
      tenant: {
        id: updatedTenant._id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        plan: updatedTenant.plan,
        maxNotes: updatedTenant.maxNotes,
      },
    })
  } catch (error) {
    console.error("Upgrade tenant error:", error)
    res.status(500).json({ error: "Failed to upgrade tenant" })
  }
})

// GET /tenants/:slug/stats - Get tenant statistics (Admin only)
router.get("/:slug/stats", requireRole("admin"), async (req, res) => {
  try {
    const { slug } = req.params

    // Verify the slug matches the current user's tenant
    if (slug !== req.tenant.slug) {
      return res.status(403).json({
        error: "Not authorized to view this tenant's stats",
      })
    }

    // Get user count
    const userCount = await User.countDocuments({
      tenantId: req.tenant._id,
      isActive: true,
    })

    // Get note count (import Note model)
    const Note = (await import("../models/Note.js")).default
    const noteCount = await Note.countDocuments({
      tenantId: req.tenant._id,
      isActive: true,
    })

    res.json({
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        plan: req.tenant.plan,
        maxNotes: req.tenant.maxNotes,
      },
      stats: {
        users: userCount,
        notes: noteCount,
        notesRemaining: req.tenant.maxNotes === -1 ? "unlimited" : Math.max(0, req.tenant.maxNotes - noteCount),
      },
    })
  } catch (error) {
    console.error("Get tenant stats error:", error)
    res.status(500).json({ error: "Failed to get tenant statistics" })
  }
})

// POST /tenants/:slug/invite - Invite user to tenant (Admin only)
router.post("/:slug/invite", requireRole("admin"), async (req, res) => {
  try {
    const { slug } = req.params
    const { email, role = "member" } = req.body

    // Verify the slug matches the current user's tenant
    if (slug !== req.tenant.slug) {
      return res.status(403).json({
        error: "Not authorized to invite users to this tenant",
      })
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
        message: "A user with this email already exists",
      })
    }

    // For this demo, we'll just return a success message
    // In a real app, you'd send an invitation email
    res.json({
      message: "Invitation sent successfully",
      email,
      role,
      tenant: req.tenant.slug,
      note: "In a real application, an invitation email would be sent to the user",
    })
  } catch (error) {
    console.error("Invite user error:", error)
    res.status(500).json({ error: "Failed to send invitation" })
  }
})

export default router
