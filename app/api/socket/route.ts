import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.IO endpoint. Connect via WebSocket using socket.io-client.' 
  });
}
