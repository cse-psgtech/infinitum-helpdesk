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

    const participantId = params.id.toUpperCase().trim();

    console.log('Searching for participant:', participantId);

    // Find participant by participant_id OR uniqueId
    let participant = await Participant.findOne({ 
      $or: [
        { participant_id: participantId },
        { uniqueId: participantId }
      ]
    });

    console.log('Search result:', participant);

    if (!participant) {
      console.error('Participant not found:', participantId);
      return NextResponse.json(
        { message: 'Participant not found', success: false },
        { status: 404 }
      );
    }

    // Return participant details
    return NextResponse.json({
      success: true,
      participant: {
        participant_id: participant.participant_id,
        uniqueId: participant.uniqueId,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        college: participant.college,
        department: participant.department,
        year: participant.year,
        payment_status: participant.payment_status,
        kit_type: participant.kit_type,
        kit_provided: participant.kit_provided,
      }
    });

  } catch (error) {
    console.error('Error fetching participant:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
