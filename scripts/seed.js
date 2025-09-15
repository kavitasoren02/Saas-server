import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../models/User.js"
import Tenant from "../models/Tenant.js"

dotenv.config()

export const seedData = async () => {
    try {

        // Clear existing data
        await User.deleteMany({})
        await Tenant.deleteMany({})
        console.log("Cleared existing data")

        // Create tenants
        const acmeTenant = await Tenant.create({
            name: "Acme Corporation",
            slug: "acme",
            plan: "free",
        })

        const globexTenant = await Tenant.create({
            name: "Globex Corporation",
            slug: "globex",
            plan: "free",
        })

        console.log("Created tenants")

        // Create users
        const users = [
            {
                email: "admin@acme.test",
                password: "password",
                role: "admin",
                tenantId: acmeTenant._id,
            },
            {
                email: "user@acme.test",
                password: "password",
                role: "member",
                tenantId: acmeTenant._id,
            },
            {
                email: "admin@globex.test",
                password: "password",
                role: "admin",
                tenantId: globexTenant._id,
            },
            {
                email: "user@globex.test",
                password: "password",
                role: "member",
                tenantId: globexTenant._id,
            },
        ]

        await User.create(users)
        console.log("Created test users")

        console.log("Seed data created successfully!")
        console.log("Test accounts:")
        console.log("- admin@acme.test (Admin, Acme)")
        console.log("- user@acme.test (Member, Acme)")
        console.log("- admin@globex.test (Admin, Globex)")
        console.log("- user@globex.test (Member, Globex)")
        console.log("All passwords: password")
    } catch (error) {
        console.error("Seed error:", error)
        process.exit(1)
    }
}
