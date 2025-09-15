import jwt from "jsonwebtoken"
import User from "../models/User.js"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    // Get user with tenant info
    const user = await User.findById(decoded.userId).populate("tenantId").select("-password")

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid or inactive user" })
    }

    if (!user.tenantId || !user.tenantId.isActive) {
      return res.status(401).json({ error: "Invalid or inactive tenant" })
    }

    req.user = user
    req.tenant = user.tenantId
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const userRoles = Array.isArray(roles) ? roles : [roles]

    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: userRoles,
        current: req.user.role,
      })
    }

    next()
  }
}

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" })
}
