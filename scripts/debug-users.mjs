import { db } from "../db/index.js"
import { users } from "../db/schema.js"
import { eq } from "drizzle-orm"

async function main() {
    const [, , email] = process.argv
    if (!email) {
        console.error("Usage: node scripts/debug-users.mjs <email>")
        process.exit(1)
    }

    const normalizedEmail = email.toLowerCase().trim()
    const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)

    if (result.length === 0) {
        console.log(`No user found for email: ${normalizedEmail}`)
    } else {
        const user = result[0]
        console.log(JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            password: user.password,
        }, null, 2))
    }

    process.exit(0)
}

main().catch((error) => {
    console.error("Error inspecting user:", error)
    process.exit(1)
})
