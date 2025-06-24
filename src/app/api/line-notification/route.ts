// /app/api/line-notification/route.ts
import { NextResponse } from 'next/server';
import { Client } from '@line/bot-sdk';

// LINE API configuration
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// LINE client
const client = new Client(lineConfig);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, appointmentDetails } = data;
    
    if (!userId || !appointmentDetails) {
      return NextResponse.json({ success: false, message: 'Missing required data' }, { status: 400 });
    }

    // สร้าง FlexMessage สำหรับใบนัด
    const flexMessage = {
      type: 'flex' as const, // Type assertion to make TypeScript understand this is a literal
      altText: 'ใบนัดหมายของคุณ',
      contents: {
        type: 'bubble' as const, // Type assertion for FlexContainer type
        header: {
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [
            {
              type: 'text' as const,
              text: 'ใบนัดหมาย',
              weight: 'bold' as const,
              size: 'xl' as const,
              color: '#ffffff'
            }
          ],
          backgroundColor: '#1e40af'
        },
        body: {
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [
            {
              type: 'text' as const,
              text: 'รายละเอียดการนัดหมาย',
              weight: 'bold' as const,
              size: 'md' as const
            },
            {
              type: 'box' as const,
              layout: 'vertical' as const,
              margin: 'lg' as const,
              spacing: 'sm' as const,
              contents: [
                {
                  type: 'box' as const,
                  layout: 'baseline' as const,
                  spacing: 'sm' as const,
                  contents: [
                    {
                      type: 'text' as const,
                      text: 'แผนก',
                      color: '#aaaaaa',
                      size: 'sm' as const,
                      flex: 1
                    },
                    {
                      type: 'text' as const,
                      text: appointmentDetails.department,
                      wrap: true,
                      color: '#666666',
                      size: 'sm' as const,
                      flex: 5
                    }
                  ]
                },
                {
                  type: 'box' as const,
                  layout: 'baseline' as const,
                  spacing: 'sm' as const,
                  contents: [
                    {
                      type: 'text' as const,
                      text: 'วันที่',
                      color: '#aaaaaa',
                      size: 'sm' as const,
                      flex: 1
                    },
                    {
                      type: 'text' as const,
                      text: appointmentDetails.date,
                      wrap: true,
                      color: '#666666',
                      size: 'sm' as const,
                      flex: 5
                    }
                  ]
                },
                {
                  type: 'box' as const,
                  layout: 'baseline' as const,
                  spacing: 'sm' as const,
                  contents: [
                    {
                      type: 'text' as const,
                      text: 'เวลา',
                      color: '#aaaaaa',
                      size: 'sm' as const,
                      flex: 1
                    },
                    {
                      type: 'text' as const,
                      text: appointmentDetails.time,
                      wrap: true,
                      color: '#666666',
                      size: 'sm' as const,
                      flex: 5
                    }
                  ]
                },
                {
                  type: 'box' as const,
                  layout: 'baseline' as const,
                  spacing: 'sm' as const,
                  contents: [
                    {
                      type: 'text' as const,
                      text: 'เลขที่',
                      color: '#aaaaaa',
                      size: 'sm' as const,
                      flex: 1
                    },
                    {
                      type: 'text' as const,
                      text: appointmentDetails.referenceNumber,
                      wrap: true,
                      color: '#666666',
                      size: 'sm' as const,
                      flex: 5
                    }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box' as const,
          layout: 'vertical' as const,
          spacing: 'sm' as const,
          contents: [
            {
              type: 'button' as const,
              style: 'primary' as const,
              height: 'sm' as const,
              action: {
                type: 'uri' as const,
                label: 'ดูรายละเอียดเพิ่มเติม',
                uri: `${process.env.NEXT_PUBLIC_BASE_URL}/appointment/${appointmentDetails.referenceNumber}`
              },
              color: '#1e40af'
            }
          ],
          flex: 0
        }
      }
    };

    // ส่งข้อความไปยัง LINE
    await client.pushMessage(userId, flexMessage);

    return NextResponse.json({ success: true, message: 'Notification sent to LINE' });
  } catch (error) {
    console.error('Error sending LINE notification:', error);
    return NextResponse.json({ success: false, message: 'Failed to send notification' }, { status: 500 });
  }
}