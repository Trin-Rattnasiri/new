// app/api/auth/line/callback/route.ts - เพิ่ม debug logs

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("🔍 LINE Callback GET called")
  console.log("🔍 Full URL:", request.url)
  
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log("🔍 URL Parameters:", { code, state, error })
    console.log("🔍 Environment variables:", {
      LINE_CHANNEL_ID: process.env.LINE_LOGIN_CHANNEL_ID ? 'SET' : 'NOT SET',
      LINE_CHANNEL_SECRET: process.env.LINE_LOGIN_CHANNEL_SECRET ? 'SET' : 'NOT SET',
      APP_URL: process.env.NEXT_PUBLIC_APP_URL
    })

    // Handle error cases
    if (error) {
      console.error('❌ LINE OAuth Error:', error)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7d6f3a1d290d.ngrok-free.app'
      const errorUrl = `${baseUrl}/front/user-dashboard?line_error=access_denied`
      console.log("🔍 Redirecting to error URL:", errorUrl)
      return NextResponse.redirect(errorUrl)
    }

    if (!code || !state) {
      console.error('❌ Missing code or state parameter')
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7d6f3a1d290d.ngrok-free.app'
      const errorUrl = `${baseUrl}/front/user-dashboard?line_error=invalid_params`
      console.log("🔍 Redirecting to error URL:", errorUrl)
      return NextResponse.redirect(errorUrl)
    }

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    })

    console.log("🔍 Token request data:", {
      redirect_uri: redirectUri,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID,
      code: code.substring(0, 10) + '...'
    })

    console.log("🔍 Making token request to LINE...")
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LINE-Integration/1.0'
      },
      body: tokenRequestBody,
    })

    console.log("🔍 Token response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Token exchange failed:', errorText)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7d6f3a1d290d.ngrok-free.app'
      const errorUrl = `${baseUrl}/front/user-dashboard?line_error=token_failed`
      console.log("🔍 Redirecting to error URL:", errorUrl)
      return NextResponse.redirect(errorUrl)
    }

    const tokenData = await tokenResponse.json()
    console.log("✅ Token received successfully")
    const { access_token } = tokenData

    // Get user profile from LINE
    console.log("🔍 Making profile request to LINE...")
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': 'LINE-Integration/1.0'
      },
    })

    console.log("🔍 Profile response status:", profileResponse.status)

    if (!profileResponse.ok) {
      console.error('❌ Profile fetch failed')
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7d6f3a1d290d.ngrok-free.app'
      const errorUrl = `${baseUrl}/front/user-dashboard?line_error=profile_failed`
      console.log("🔍 Redirecting to error URL:", errorUrl)
      return NextResponse.redirect(errorUrl)
    }

    const profile = await profileResponse.json()
    console.log("✅ Profile received:", {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl ? 'HAS_PICTURE' : 'NO_PICTURE'
    })

    // Encode user data to pass back to frontend
    const lineProfileData = {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || null,
      statusMessage: profile.statusMessage || null
    }

    const userDataEncoded = Buffer.from(JSON.stringify(lineProfileData)).toString('base64')
    
    // Redirect back to user-dashboard with LINE profile data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7d6f3a1d290d.ngrok-free.app'
    const successUrl = new URL('/front/user-dashboard', baseUrl)
    successUrl.searchParams.set('line_success', 'true')
    successUrl.searchParams.set('line_profile', userDataEncoded)
    
    console.log("✅ Redirecting to success URL:", successUrl.toString())
    return NextResponse.redirect(successUrl.toString())

  } catch (error: any) {
    console.error('❌ LINE Callback Error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7d6f3a1d290d.ngrok-free.app'
    const errorUrl = `${baseUrl}/front/user-dashboard?line_error=server_error`
    console.log("🔍 Redirecting to error URL:", errorUrl)
    return NextResponse.redirect(errorUrl)
  }
}