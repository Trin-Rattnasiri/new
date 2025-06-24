// app/api/line-auth/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import querystring from 'querystring';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ success: false, message: 'Authorization code is required' }, { status: 400 });
    }
    
    // ตรวจสอบว่ามีค่า environment variables
    const clientId = process.env.LINE_LOGIN_CHANNEL_ID;
    const clientSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!clientId || !clientSecret || !baseUrl) {
      console.error('Missing environment variables:', { 
        clientId: !!clientId, 
        clientSecret: !!clientSecret, 
        baseUrl: !!baseUrl 
      });
      return NextResponse.json({ 
        success: false, 
        message: 'Configuration error: Missing environment variables' 
      }, { status: 500 });
    }
    
    // แลกเปลี่ยน code เพื่อรับ access token ใช้ querystring
    const tokenParams = querystring.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${baseUrl}/line-login`,
      client_id: clientId,
      client_secret: clientSecret
    });
    
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', 
      tokenParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, id_token } = tokenResponse.data;
    
    // ดึงข้อมูลผู้ใช้จาก LINE Profile API
    const userInfo = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      userId: userInfo.data.userId,
      displayName: userInfo.data.displayName,
      pictureUrl: userInfo.data.pictureUrl
    });
    
  } catch (error: any) {
    console.error('LINE authentication error:', error.response?.data || error.message);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to authenticate with LINE',
      details: error.response?.data || error.message
    }, { status: 500 });
  }
}