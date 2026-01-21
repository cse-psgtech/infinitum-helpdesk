import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScanSession from '@/models/ScanSession';

// Create a new scan session
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Generate unique session ID
    const sessionId = `SCAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create session that expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const session = await ScanSession.create({
      session_id: sessionId,
      status: 'waiting',
      expires_at: expiresAt,
    });

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      expires_at: expiresAt,
    });

  } catch (error) {
    console.error('Error creating scan session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create scan session' },
      { status: 500 }
    );
  }
}

// Check scan session status
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const sessionId = request.nextUrl.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = await ScanSession.findOne({ session_id: sessionId });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      participant_id: session.participant_id,
      scanned_at: session.scanned_at,
    });

  } catch (error) {
    console.error('Error checking scan session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check session' },
      { status: 500 }
    );
  }
}

// Update scan session with scanned participant ID OR reset status
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { session_id, participant_id, status } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { success: false, message: 'Session ID required' },
        { status: 400 }
      );
    }

    // If just resetting status to 'waiting' for continuous scanning
    if (status === 'waiting' && !participant_id) {
      const session = await ScanSession.findOneAndUpdate(
        { session_id },
        {
          status: 'waiting',
          participant_id: null,
          scanned_at: null,
        },
        { new: true }
      );

      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Session reset for next scan',
      });
    }

    // Otherwise, recording a new scan
    if (!participant_id) {
      return NextResponse.json(
        { success: false, message: 'Participant ID required' },
        { status: 400 }
      );
    }

    const session = await ScanSession.findOneAndUpdate(
      { session_id },
      {
        participant_id,
        status: 'scanned',
        scanned_at: new Date(),
      },
      { new: true }
    );

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found or already used' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Scan recorded successfully',
    });

  } catch (error) {
    console.error('Error updating scan session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update session' },
      { status: 500 }
    );
  }
}
