import { NextRequest, NextResponse } from 'next/server';

// In-memory store for scan sessions (simple implementation)
// In production, use Redis or a proper database
const sessions = new Map<string, {
  session_id: string;
  status: 'waiting' | 'scanned';
  participant_id?: string;
  timestamp: number;
}>();

// Cleanup old sessions (older than 1 hour)
function cleanupOldSessions() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const keysToDelete: string[] = [];
  
  sessions.forEach((value, key) => {
    if (value.timestamp < oneHourAgo) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => sessions.delete(key));
}

// POST - Create new scan session
export async function POST(request: NextRequest) {
  try {
    cleanupOldSessions();

    const session_id = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    sessions.set(session_id, {
      session_id,
      status: 'waiting',
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      session_id,
    });
  } catch (error) {
    console.error('Error creating scan session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// GET - Get scan session status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json(
        { success: false, message: 'session_id required' },
        { status: 400 }
      );
    }

    const session = sessions.get(session_id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session_id: session.session_id,
      status: session.status,
      participant_id: session.participant_id,
    });
  } catch (error) {
    console.error('Error getting scan session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get session' },
      { status: 500 }
    );
  }
}

// PUT - Update scan session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, status, participant_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, message: 'session_id required' },
        { status: 400 }
      );
    }

    const session = sessions.get(session_id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    // Update session
    if (status) {
      session.status = status;
    }
    if (participant_id) {
      session.participant_id = participant_id;
      session.status = 'scanned';
    }
    session.timestamp = Date.now();

    sessions.set(session_id, session);

    return NextResponse.json({
      success: true,
      session_id: session.session_id,
      status: session.status,
      participant_id: session.participant_id,
    });
  } catch (error) {
    console.error('Error updating scan session:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update session' },
      { status: 500 }
    );
  }
}
