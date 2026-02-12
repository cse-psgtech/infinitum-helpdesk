import { NextRequest, NextResponse } from 'next/server';

// Simple authentication for organizers
// In production, use proper auth with hashed passwords and JWT tokens
const ORGANIZERS = [
  { username: 'admin', password: 'infinitum2026', name: 'Admin' },
  { username: 'organizer1', password: 'infin123', name: 'Organizer 1' },
  { username: 'organizer2', password: 'infin123', name: 'Organizer 2' },
  { username: 'organizer3', password: 'infin123', name: 'Organizer 3' },
];

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password required' },
        { status: 400 }
      );
    }

    // Find organizer
    const organizer = ORGANIZERS.find(
      (org) => org.username === username && org.password === password
    );

    if (!organizer) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate simple token (in production, use proper JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      username: organizer.username,
      name: organizer.name,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
