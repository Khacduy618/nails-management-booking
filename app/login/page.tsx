import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

export default async function LoginPage() {
    const session = await getServerSession(authOptions)

    if (session?.user) {
        if (session.user.role === "staff") {
            redirect("/admin/appointments")
        }
        redirect("/admin")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background px-4">
            <AdminLoginForm />
        </div>
    )
}
