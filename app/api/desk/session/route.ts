import { NextRequest, NextResponse } from 'next/server';

// Access the global createDeskSession function from server.js
declare global {
  var createDeskSession: () => { deskId: string; signature: string };
}

export async function POST(req: NextRequest) {
  try {
    if (!global.createDeskSession) {
      return NextResponse.json(
        { success: false, message: 'Desk session service not available. Make sure the server is running with Socket.IO.' },
        { status: 503 }
      );
    }

    const { deskId, signature } = global.createDeskSession();
    
    return NextResponse.json({
      success: true,
      deskId,
      signature
    });
  } catch (error) {
    console.error('Error creating desk session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create desk session' },
      { status: 500 }
    );
  }
}
