// app/api/auth/line/callback/route.ts - Fixed version
import { NextRequest, NextResponse } from "next/server"
import { signSession, verifySession } from "@/lib/auth"
import { getPool } from "@/lib/db"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url)
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || `${reqUrl.protocol}//${reqUrl.host}`

  console.log("🔍 LINE Callback GET called")
  console.log("🔍 Full URL:", request.url)

  try {
    const code = reqUrl.searchParams.get("code")
    const state = reqUrl.searchParams.get("state")
    const error = reqUrl.searchParams.get("error")

    console.log("🔍 URL Parameters:", { code, state, error })

    // 1) error จาก LINE
    if (error) {
      console.error("❌ LINE OAuth Error:", error)
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=access_denied`)
    }

    // 2) param ไม่ครบ
    if (!code || !state) {
      console.error("❌ Missing code or state parameter")
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=invalid_params`)
    }

    // 3) ตรวจ state โดยถอดรหัส Base64
    const cookieState = request.cookies.get("line_login_state")?.value
    let stateData: any = null

    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      console.log("🔍 Decoded state data:", stateData)
    } catch (err) {
      console.error("❌ Cannot decode state parameter:", err)
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=invalid_state`)
    }

    // เปรียบเทียบ random field กับ cookie
    if (!cookieState || cookieState !== stateData.random) {
      console.error("❌ Invalid state", { 
        cookieState, 
        stateRandom: stateData.random,
        fullState: stateData 
      })
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=invalid_state`)
    }

    console.log("✅ State validation passed")

    // 4) ตรวจสอบ session - หากไม่มี ใช้ citizenId จาก state เป็นทางเลือก
    let currentUserCitizenId: string
    const sessionCookie = request.cookies.get("session")?.value

    if (sessionCookie) {
      try {
        const sessionData = verifySession(sessionCookie)
        currentUserCitizenId = String(sessionData.sub)
        console.log("✅ Current user from session (citizenid):", currentUserCitizenId)
      } catch (err) {
        console.error("❌ Invalid session, falling back to state citizenId:", err)
        currentUserCitizenId = stateData.citizenId
      }
    } else {
      console.log("⚠️ No session found, using citizenId from state")
      currentUserCitizenId = stateData.citizenId
    }

    if (!currentUserCitizenId) {
      console.error("❌ Cannot determine current user")
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=session_invalid`)
    }

    // 5) ตรวจสอบว่า user ยังคงมีอยู่ใน database (แก้ไข: query เดียว)
    const pool = getPool()
    const [userRows] = await pool.execute<any[]>(
      "SELECT id, prefix, name, hn, role, citizenid, line_id, line_display_name, line_picture_url FROM user WHERE citizenid = ?",
      [currentUserCitizenId]
    )

    if (!userRows.length) {
      console.error("❌ User not found in database:", currentUserCitizenId)
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=user_not_found`)
    }

    const existingUser = userRows[0]
    console.log("✅ User found in database:", {
      id: existingUser.id,
      name: existingUser.name,
      citizenid: existingUser.citizenid,
      hasLineId: !!existingUser.line_id
    })

    // ✅ ตรวจสอบว่า citizenid มีค่า
    if (!existingUser.citizenid) {
      console.error("❌ User citizenid is null/undefined:", existingUser)
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=invalid_user_data`)
    }

    // 6) แลก code → access_token
    const redirectUri = `${BASE_URL}/api/auth/line/callback`
    const tokenRequestBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    })

    console.log("🔍 Token request data:", {
      redirect_uri: redirectUri,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID ? "SET" : "NOT SET",
    })

    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "LINE-Integration/1.0",
      },
      body: tokenRequestBody,
    })

    console.log("🔍 Token response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token exchange failed:", errorText)
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=token_failed`)
    }

    const tokenData = await tokenResponse.json()
    console.log("✅ Token received successfully")
    const { access_token } = tokenData

    // 7) ขอโปรไฟล์จาก LINE
    console.log("🔍 Making profile request to LINE...")
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "User-Agent": "LINE-Integration/1.0",
      },
    })

    console.log("🔍 Profile response status:", profileResponse.status)

    if (!profileResponse.ok) {
      console.error("❌ Profile fetch failed")
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=profile_failed`)
    }

    const profile = await profileResponse.json()
    console.log("✅ Profile received:", {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl ? "HAS_PICTURE" : "NO_PICTURE",
    })

    // 8) กันซ้ำ: ถ้ามี user อื่นใช้ line_id นี้อยู่
    const [existingLineUsers] = await pool.execute<any[]>(
      "SELECT id, citizenid FROM user WHERE line_id = ?",
      [profile.userId]
    )

    if (existingLineUsers.length > 0) {
      const existingLineUser = existingLineUsers[0]
      if (String(existingLineUser.citizenid) !== currentUserCitizenId) {
        console.error("❌ LINE ID already linked to different user:", existingLineUser)
        return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=already_linked`)
      }
      console.log("✅ LINE already linked to same user")
    }

    // 9) อัปเดต DB
    console.log("🔍 Updating current user with LINE profile")
    const [updateResult] = await pool.execute<any>(
      `UPDATE user SET 
        line_id = ?,
        line_display_name = ?,
        line_picture_url = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE citizenid = ?`,
      [
        profile.userId,
        profile.displayName,
        profile.pictureUrl || null,
        currentUserCitizenId,
      ]
    )

    if (!updateResult?.affectedRows) {
      console.error("❌ User not found for update (citizenid):", currentUserCitizenId)
      return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=user_not_found`)
    }

    console.log("✅ User updated successfully")

    // 10) โหลดผู้ใช้ที่อัปเดตแล้ว (แก้ไข: ใช้ข้อมูลที่มีอยู่แล้ว + อัปเดต LINE fields)
    const user = {
      ...existingUser,
      line_id: profile.userId,
      line_display_name: profile.displayName,
      line_picture_url: profile.pictureUrl || null
    }

    console.log("✅ Updated user data:", {
      id: user.id,
      citizenid: user.citizenid,
      name: user.name,
      line_display_name: user.line_display_name,
    })

    // 11) สร้าง session ใหม่ (หรืออัปเดต session เดิม)
    console.log("🔍 Creating session with user data:", {
      id: user.id,
      citizenid: user.citizenid,
      name: user.name,
      line_display_name: user.line_display_name,
    })

    const sessionToken = signSession({
      sub: String(user.citizenid), // ✅ ตรวจสอบแล้วว่าไม่เป็น undefined
      role: user.role || "user",
      kind: "user",
      name: user.line_display_name || user.name || "User",
      provider: "line",
      line_user_id: profile.userId,
      citizenId: String(user.citizenid), // ✅ เพิ่ม citizenId ในระดับ root
      profile: {
        id: user.id,
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || null,
        statusMessage: profile.statusMessage || null,
        prefix: user.prefix,
        name: user.name,
        citizenId: String(user.citizenid), // ✅ ใช้ user.citizenid
        hn: user.hn,
        lineUserId: user.line_id,
        lineDisplayName: user.line_display_name,
        linePictureUrl: user.line_picture_url,
        isLinkedWithLine: true,
      },
    })

    console.log("✅ Session created successfully with sub:", String(user.citizenid))

    // 12) redirect กลับพร้อมข้อมูล
    const successUrl = new URL("/front/user-dashboard", BASE_URL)
    successUrl.searchParams.set("line_success", "true")
    const profileData = {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || null,
    }
    const profileEncoded = Buffer.from(JSON.stringify(profileData)).toString("base64")
    successUrl.searchParams.set("line_profile", profileEncoded)

    const response = NextResponse.redirect(successUrl.toString())
    
    // ลบ state cookie ที่ใช้แล้ว
    response.cookies.set({
      name: "line_login_state",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    
    // ตั้ง session cookie ใหม่
    response.cookies.set({
      name: "session",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 1 day
    })

    console.log("✅ Redirecting to success URL with updated session:", successUrl.toString())
    return response
  } catch (error: any) {
    console.error("❌ LINE Callback Error:", error)
    return NextResponse.redirect(`${BASE_URL}/front/user-dashboard?line_error=server_error`)
  }
}