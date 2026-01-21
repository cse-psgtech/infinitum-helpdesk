import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Count kits provided by type
    const workshopAndGeneral = await Participant.countDocuments({
      kit_provided: true,
      kit_type: 'Workshop + General',
    });

    const workshopOnly = await Participant.countDocuments({
      kit_provided: true,
      kit_type: 'Workshop Only',
    });

    const generalOnly = await Participant.countDocuments({
      kit_provided: true,
      kit_type: 'General Only',
    });

    // Also get totals for reference
    const totalRegistered = await Participant.countDocuments();
    const totalKitsProvided = await Participant.countDocuments({
      kit_provided: true,
    });

    return NextResponse.json({
      workshop_and_general: workshopAndGeneral,
      workshop_only: workshopOnly,
      general_only: generalOnly,
      total_registered: totalRegistered,
      total_kits_provided: totalKitsProvided,
    });

  } catch (error) {
    console.error('Error fetching kit statistics:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
