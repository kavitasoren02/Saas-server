import mongoose from "mongoose"

const tenantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        plan: {
            type: String,
            enum: ["free", "pro"],
            default: "free",
        },
        maxNotes: {
            type: Number,
            default: 3,
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

// Update maxNotes based on plan
tenantSchema.pre("save", function (next) {
    if (this.plan === "pro") {
        this.maxNotes = -1 // -1 means unlimited
    } else if (this.plan === "free") {
        this.maxNotes = 3
    }
    next()
})

export default mongoose.model("Tenant", tenantSchema)
