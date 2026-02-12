import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.college || !data.department || !data.phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique participant ID
    const timestamp = Date.now();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const participantId = `INF${randomNum}`;
    
    // Generate unique ID (for QR codes)
    const uniqueId = `UID${Date.now()}${Math.floor(Math.random() * 1000)}`.toUpperCase();

    // Check if ID already exists (rare collision)
    const exists = await Participant.findOne({ participant_id: participantId });
    if (exists) {
      // Retry with new random number
      const newRandomNum = Math.floor(1000 + Math.random() * 9000);
      const newParticipantId = `INF${newRandomNum}`;
      
      // Create participant
      const participant = await Participant.create({
        participant_id: newParticipantId,
        uniqueId: uniqueId,
        name: data.name,
        email: data.email.toLowerCase(),
        college: data.college,
        department: data.department,
        year: parseInt(data.year) || 1,
        phone: data.phone,
        accommodation: data.accommodation || 'No',
        payment_status: false, // Needs to pay
        kit_type: data.kit_type || 'General Only',
        kit_provided: false,
        registered_via: 'form',
      });

      return NextResponse.json({
        success: true,
        participant_id: participant.participant_id,
        name: participant.name,
        email: participant.email,
        fee: data.accommodation === 'Yes' ? 250 : 200,
        message: 'Registration successful',
      });
    }

    // Create participant
    const participant = await Participant.create({
      participant_id: participantId,
      uniqueId: uniqueId,
      name: data.name,
      email: data.email.toLowerCase(),
      college: data.college,
      department: data.department,
      year: parseInt(data.year) || 1,
      phone: data.phone,
      accommodation: data.accommodation || 'No',
      payment_status: false, // Needs to pay
      kit_type: data.kit_type || 'General Only',
      kit_provided: false,
      registered_via: 'form',
    });

    return NextResponse.json({
      success: true,
      participant_id: participant.participant_id,
      name: participant.name,
      email: participant.email,
      fee: data.accommodation === 'Yes' ? 250 : 200,
      message: 'Registration successful',
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle duplicate email
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
