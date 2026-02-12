import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get ALL registered participants with kit status
    const participants = await Participant.find({})
      .select('participant_id uniqueId name college department year kit_provided kit_provided_at kit_type')
      .sort({ createdAt: -1 });

    // Transform to frontend format with all required fields
    const participantList = participants.map((p) => ({
      made_id: p.participant_id,  // mapped to participant_id
      unique_id: p.uniqueId,
      name: p.name,
      college: p.college,
      department: p.department,
      year: p.year,
      kit_type: p.kit_type,
      kit_provided: p.kit_provided,
      provided_at: p.kit_provided_at?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      participants: participantList,
      total: participantList.length,
      summary: {
        total_registered: participantList.length,
        kits_provided: participantList.filter(p => p.kit_provided).length,
        kits_pending: participantList.filter(p => !p.kit_provided).length,
      }
    });

  } catch (error) {
    console.error('Error fetching kit list:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
