import { type NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { uid, role } = await request.json()

    if (!uid || !role) {
      return NextResponse.json({ error: "Missing uid or role" }, { status: 400 })
    }

    if (!["user", "company", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const auth = getAdminAuth()
    await auth.setCustomUserClaims(uid, { role })

    // Persist role in Firestore so it reflects in server-side data
    const db = getAdminFirestore()
    await db.collection("users").doc(uid).set(
      {
        role,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting custom claims:", error)
    return NextResponse.json({ error: "Failed to set role" }, { status: 500 })
  }
}
