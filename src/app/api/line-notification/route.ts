// /app/api/line-notification/route.ts
import { NextResponse } from 'next/server';
import { Client } from '@line/bot-sdk';

// ตรวจสอบ ENV และแจ้งเตือนหากขาดค่า
function getEnvOrThrow(key: string) {
  const value = process.env[key];
  console.log(`Environment variable ${key}:`, value ? 'SET' : 'NOT SET');
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

// ฟังก์ชันแปลงสถานะเป็นภาษาไทย
function getStatusText(status: string) {
  const statusMap = {
    'pending': 'รอการยืนยัน',
    'confirmed': 'ยืนยันแล้ว',
    'approved': 'อนุมัติแล้ว',
    'rejected': 'ปฏิเสธ',
    'cancelled': 'ยกเลิกแล้ว',
    'completed': 'เสร็จสิ้น',
    'no-show': 'ไม่มาตามนัด'
  };
  return statusMap[status] || status;
}

// ฟังก์ชันกำหนดสีตามสถานะ
function getStatusColor(status: string) {
  const colorMap = {
    'pending': '#ff9500',     // orange
    'confirmed': '#34c759',   // green
    'approved': '#34c759',    // green
    'rejected': '#ff3b30',    // red
    'cancelled': '#ff3b30',   // red
    'completed': '#007aff',   // blue
    'no-show': '#ff6b6b'      // light red
  };
  return colorMap[status] || '#8e8e93';
}

export async function POST(request: Request) {
  console.log('🚀 LINE Notification API called');
  
  try {
    // ตรวจสอบ environment variables
    console.log('📋 Checking environment variables...');
    const lineConfig = {
      channelAccessToken: getEnvOrThrow('LINE_CHANNEL_ACCESS_TOKEN'),
      channelSecret: getEnvOrThrow('LINE_CHANNEL_SECRET'),
    };
    console.log('✅ Environment variables OK');

    // สร้าง LINE client
    console.log('🔧 Creating LINE client...');
    const client = new Client(lineConfig);
    console.log('✅ LINE client created');

    // รับข้อมูลจาก request
    console.log('📥 Parsing request data...');
    const data = await request.json();
    console.log('📥 Request data:', JSON.stringify(data, null, 2));
    
    const { userId, appointmentDetails, statusUpdateDetails } = data;
    
    if (!userId || (!appointmentDetails && !statusUpdateDetails)) {
      console.log('❌ Missing required data');
      return NextResponse.json({ success: false, message: 'Missing required data' }, { status: 400 });
    }

    // ตรวจสอบ BASE_URL
    console.log('🌐 Checking BASE_URL...');
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    console.log('🌐 BASE_URL:', baseUrl);
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // กำหนดข้อมูลสำหรับใช้งาน (รองรับทั้งสองแบบ)
    let messageData;
    let messageType = 'appointment'; // default

    if (statusUpdateDetails) {
      // กรณีส่งมาจาก status update
      messageType = 'status_update';
      messageData = {
        referenceNumber: statusUpdateDetails.referenceNumber,
        department: statusUpdateDetails.department,
        date: statusUpdateDetails.date,
        time: statusUpdateDetails.time,
        status: statusUpdateDetails.newStatus,
        oldStatus: statusUpdateDetails.oldStatus,
        statusMessage: statusUpdateDetails.statusMessage,
        adminNote: statusUpdateDetails.adminNote
      };
    } else {
      // กรณีส่งมาจากการจองปกติ
      messageData = appointmentDetails;
    }

    const bookingStatus = messageData.status || 'pending';
    const statusText = getStatusText(bookingStatus);
    const statusColor = getStatusColor(bookingStatus);

    // สร้าง Flex Message
    console.log('📝 Creating flex message...');
    
    let flexMessage;

    if (messageType === 'status_update') {
      // ข้อความสำหรับการอัปเดตสถานะ
      flexMessage = {
        type: 'flex',
        altText: `🔄 อัปเดตสถานะ: ${messageData.referenceNumber} - ${statusText}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '🔄 อัปเดตสถานะการนัดหมาย',
                weight: 'bold',
                size: 'lg',
                color: '#ffffff'
              },
              {
                type: 'text',
                text: 'สถานะการจองของคุณได้รับการอัปเดต',
                size: 'sm',
                color: '#ffffff',
                margin: 'sm'
              }
            ],
            backgroundColor: statusColor,
            paddingAll: '20px'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              // Status Change
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'การเปลี่ยนแปลงสถานะ',
                    weight: 'bold',
                    size: 'sm',
                    color: '#666666'
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: getStatusText(messageData.oldStatus),
                        size: 'sm',
                        color: '#999999',
                        decoration: 'line-through',
                        flex: 1
                      },
                      {
                        type: 'text',
                        text: '➜',
                        size: 'sm',
                        color: '#666666',
                        align: 'center'
                      },
                      {
                        type: 'text',
                        text: statusText,
                        size: 'sm',
                        weight: 'bold',
                        color: statusColor,
                        flex: 1,
                        align: 'end'
                      }
                    ],
                    margin: 'sm'
                  }
                ],
                backgroundColor: '#f8fafc',
                paddingAll: '15px',
                cornerRadius: '8px',
                margin: 'lg'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              // Reference Number
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'เลขอ้างอิง',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.referenceNumber,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    color: '#f59e0b'
                  }
                ],
                margin: 'lg'
              },
              // Department
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'แผนก',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.department,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true
                  }
                ],
                margin: 'md'
              },
              // Date
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'วันที่',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.date,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true
                  }
                ],
                margin: 'md'
              },
              // Time
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'เวลา',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.time,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end'
                  }
                ],
                margin: 'md'
              }
            ],
            paddingAll: '20px'
          }
        }
      };

      // เพิ่มหมายเหตุถ้ามี
      if (messageData.adminNote) {
        flexMessage.contents.body.contents.push(
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '📝 หมายเหตุจากเจ้าหน้าที่',
                weight: 'bold',
                size: 'sm',
                color: '#6366f1'
              },
              {
                type: 'text',
                text: messageData.adminNote,
                size: 'sm',
                color: '#475569',
                wrap: true,
                margin: 'sm'
              }
            ],
            backgroundColor: '#eff6ff',
            paddingAll: '15px',
            cornerRadius: '8px',
            margin: 'lg'
          }
        );
      }

    } else {
      // ข้อความสำหรับการจองปกติ (เหมือนเดิม)
      flexMessage = {
        type: 'flex',
        altText: `ใบนัดหมาย ${messageData.department} - ${messageData.date}`,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ใบนัดหมาย',
                weight: 'bold',
                size: 'xl',
                color: '#ffffff'
              },
              {
                type: 'text',
                text: 'รายละเอียดการจองคิวของคุณ',
                size: 'sm',
                color: '#ffffff',
                margin: 'sm'
              }
            ],
            backgroundColor: '#2563eb',
            paddingAll: '20px'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              // Status
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'สถานะ',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: statusText,
                    weight: 'bold',
                    color: statusColor,
                    size: 'sm',
                    flex: 3,
                    align: 'end'
                  }
                ],
                margin: 'lg'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              // Department
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'แผนก',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.department,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true
                  }
                ],
                margin: 'lg'
              },
              // Date
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'วันที่',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.date,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    wrap: true
                  }
                ],
                margin: 'md'
              },
              // Time
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'เวลา',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.time,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end'
                  }
                ],
                margin: 'md'
              },
              // Reference Number
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'หมายเลข',
                    color: '#666666',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: messageData.referenceNumber,
                    weight: 'bold',
                    size: 'sm',
                    flex: 3,
                    align: 'end',
                    color: '#f59e0b'
                  }
                ],
                margin: 'md'
              },
              {
                type: 'separator',
                margin: 'lg'
              },
              // Note
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'หมายเหตุสำคัญ',
                    weight: 'bold',
                    size: 'sm',
                    color: '#6366f1'
                  },
                  {
                    type: 'text',
                    text: 'กรุณามาก่อนเวลานัด 15-30 นาที และนำบัตรประชาชนมาด้วย',
                    size: 'xs',
                    color: '#64748b',
                    wrap: true,
                    margin: 'sm'
                  }
                ],
                backgroundColor: '#f8fafc',
                paddingAll: '15px',
                cornerRadius: '8px',
                margin: 'lg'
              }
            ],
            paddingAll: '20px'
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                height: 'sm',
                action: {
                  type: 'uri',
                  label: 'ดูรายละเอียดเพิ่มเติม',
                  uri: `${baseUrl}/appointment/${messageData.referenceNumber}`
                },
                color: '#2563eb'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'button',
                    style: 'secondary',
                    height: 'sm',
                    action: {
                      type: 'uri',
                      label: 'ติดต่อเจ้าหน้าที่',
                      uri: 'tel:053771056'
                    },
                    color: '#64748b',
                    flex: 1
                  },
                  {
                    type: 'button',
                    style: 'secondary',
                    height: 'sm',
                    action: {
                      type: 'uri',
                      label: 'แผนที่',
                      uri: 'https://maps.app.goo.gl/p1Zr7jQ8ziWZxNvv9?g_st=ipc'
                    },
                    color: '#64748b',
                    flex: 1
                  }
                ],
                spacing: 'sm'
              }
            ],
            paddingAll: '20px'
          }
        }
      };
    }

    console.log('✅ Flex message created');

    // ส่งข้อความไปยัง LINE
    console.log('📤 Sending message to LINE...');
    console.log('👤 User ID:', userId);
    
    await client.pushMessage(userId, flexMessage);
    console.log('✅ Message sent successfully');

    return NextResponse.json({ success: true, message: 'Notification sent to LINE' });
    
  } catch (error) {
    console.error('💥 Error details:', {
      message: error.message,  
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to send notification',
      error: error.message 
    }, { status: 500 });
  }
}