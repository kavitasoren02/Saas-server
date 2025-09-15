import mongoose from "mongoose"

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        content: {
            type: String,
            required: true,
            maxlength: 10000,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
)

// Compound index for tenant isolation and performance
noteSchema.index({ tenantId: 1, userId: 1 })
noteSchema.index({ tenantId: 1, createdAt: -1 })

export default mongoose.model("Note", noteSchema)
