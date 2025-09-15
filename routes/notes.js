import express from "express"
import Note from "../models/Note.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateToken)

// GET /notes - List all notes for the current tenant
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query
        const skip = (page - 1) * limit

        // Build query with tenant isolation
        const query = {
            tenantId: req.tenant._id,
            isActive: true,
        }

        // Add search functionality
        if (search) {
            query.$or = [{ title: { $regex: search, $options: "i" } }, { content: { $regex: search, $options: "i" } }]
        }

        const notes = await Note.find(query)
            .populate("userId", "email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number.parseInt(limit))

        const total = await Note.countDocuments(query)

        res.json({
            notes,
            pagination: {
                page: Number.parseInt(page),
                limit: Number.parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error("Get notes error:", error)
        res.status(500).json({ error: "Failed to fetch notes" })
    }
})

// GET /notes/:id - Retrieve a specific note
router.get("/:id", async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            tenantId: req.tenant._id,
            isActive: true,
        }).populate("userId", "email")

        if (!note) {
            return res.status(404).json({ error: "Note not found" })
        }

        res.json({ note })
    } catch (error) {
        console.error("Get note error:", error)
        res.status(500).json({ error: "Failed to fetch note" })
    }
})

// POST /notes - Create a note
router.post("/", async (req, res) => {
    try {
        const { title, content } = req.body

        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" })
        }

        // Check subscription limits for free plan
        if (req.tenant.plan === "free" && req.tenant.maxNotes > 0) {
            const noteCount = await Note.countDocuments({
                tenantId: req.tenant._id,
                isActive: true,
            })

            if (noteCount >= req.tenant.maxNotes) {
                return res.status(403).json({
                    error: "Note limit reached",
                    message: `Free plan is limited to ${req.tenant.maxNotes} notes. Upgrade to Pro for unlimited notes.`,
                    limit: req.tenant.maxNotes,
                    current: noteCount,
                })
            }
        }

        const note = new Note({
            title: title.trim(),
            content: content.trim(),
            userId: req.user._id,
            tenantId: req.tenant._id,
        })

        await note.save()
        await note.populate("userId", "email")

        res.status(201).json({ note })
    } catch (error) {
        console.error("Create note error:", error)
        res.status(500).json({ error: "Failed to create note" })
    }
})

// PUT /notes/:id - Update a note
router.put("/:id", async (req, res) => {
    try {
        const { title, content } = req.body

        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" })
        }

        // Find note with tenant isolation
        const note = await Note.findOne({
            _id: req.params.id,
            tenantId: req.tenant._id,
            isActive: true,
        })

        if (!note) {
            return res.status(404).json({ error: "Note not found" })
        }

        // Check if user owns the note or is admin
        if (note.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ error: "Not authorized to update this note" })
        }

        note.title = title.trim()
        note.content = content.trim()
        await note.save()
        await note.populate("userId", "email")

        res.json({ note })
    } catch (error) {
        console.error("Update note error:", error)
        res.status(500).json({ error: "Failed to update note" })
    }
})

// DELETE /notes/:id - Delete a note
router.delete("/:id", async (req, res) => {
    try {
        // Find note with tenant isolation
        const note = await Note.findOne({
            _id: req.params.id,
            tenantId: req.tenant._id,
            isActive: true,
        })

        if (!note) {
            return res.status(404).json({ error: "Note not found" })
        }

        // Check if user owns the note or is admin
        if (note.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ error: "Not authorized to delete this note" })
        }

        // Soft delete
        note.isActive = false
        await note.save()

        res.json({ message: "Note deleted successfully" })
    } catch (error) {
        console.error("Delete note error:", error)
        res.status(500).json({ error: "Failed to delete note" })
    }
})

export default router
