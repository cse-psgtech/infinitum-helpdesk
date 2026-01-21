import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to database
    await connectDB();

    const participantId = params.id.toUpperCase();
    const body = await request.json();

    // Find participant
    const participant = await Participant.findOne({ 
      participant_id: participantId 
    });

    if (!participant) {
      return NextResponse.json(
        { message: 'Participant not found', success: false },
        { status: 404 }
      );
    }

    // Validation: Check payment status
    if (!participant.payment_status) {
      return NextResponse.json(
        { 
          message: 'Cannot provide kit. Payment not completed.', 
          success: false 
        },
        { status: 400 }
      );
    }

    // Validation: Check if kit already provided
    if (participant.kit_provided) {
      return NextResponse.json(
        { 
          message: 'Kit already provided to this participant', 
          success: false 
        },
        { status: 400 }
      );
    }

    // Update kit_provided status
    participant.kit_provided = body.kit_provided ?? true;
    participant.kit_provided_at = new Date();
    await participant.save();

    return NextResponse.json({
      success: true,
      message: 'Kit provided successfully',
      participant_id: participant.participant_id,
      name: participant.name,
      kit_provided: participant.kit_provided,
    });

  } catch (error) {
    console.error('Error updating kit status:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
