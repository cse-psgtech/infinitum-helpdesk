import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await connectDB();

    const participantId = params.id.toUpperCase();

    // Find participant by ID
    const participant = await Participant.findOne({ 
      participant_id: participantId 
    }).select('-_id -__v'); // Exclude MongoDB internal fields

    if (!participant) {
      return NextResponse.json(
        { message: 'Participant not found', success: false },
        { status: 404 }
      );
    }

    // Return participant details
    return NextResponse.json({
      participant_id: participant.participant_id,
      name: participant.name,
      college: participant.college,
      payment_status: participant.payment_status,
      kit_type: participant.kit_type,
      kit_provided: participant.kit_provided,
    });

  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
