import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all participants who have received their kits
    const participants = await Participant.find({
      kit_provided: true,
    })
      .select('participant_id name college kit_type kit_provided_at')
      .sort({ kit_provided_at: -1 }) // Most recent first
      .limit(200); // Limit to last 200 for performance

    // Transform to frontend format
    const participantList = participants.map((p) => ({
      participant_id: p.participant_id,
      name: p.name,
      college: p.college,
      kit_type: p.kit_type,
      provided_at: p.kit_provided_at?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      participants: participantList,
      total: participantList.length,
    });

  } catch (error) {
    console.error('Error fetching kit list:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
