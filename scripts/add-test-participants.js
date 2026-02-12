/**
 * Test Data Script - Add Sample Participants to Database
 * Run this script to populate test data for the provide-kit page
 * 
 * Usage: node scripts/add-test-participants.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/infinitum';

// Participant Schema (must match models/Participant.ts)
const ParticipantSchema = new mongoose.Schema({
  participant_id: { type: String, required: true, unique: true, uppercase: true },
  uniqueId: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  college: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  phone: { type: String, required: true },
  accommodation: { type: String, required: true, default: 'No' },
  payment_status: { type: Boolean, default: false },
  kit_type: { type: String, required: true, default: 'General Only' },
  kit_provided: { type: Boolean, default: false },
  registered_via: { type: String, required: true, default: 'form' },
}, { timestamps: true });

const Participant = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);

// Sample test participants
const testParticipants = [
  {
    participant_id: 'INF1234',
    uniqueId: 'UID16790123401234',
    name: 'John Doe',
    email: 'john.doe@example.com',
    college: 'PSG College of Technology',
    department: 'Computer Science and Engineering',
    year: 2,
    phone: '9876543210',
    accommodation: 'No',
    payment_status: true, // ✓ Paid - can receive kit
    kit_type: 'Workshop + General',
    kit_provided: false, // Not yet provided
    registered_via: 'form',
  },
  {
    participant_id: 'INF5678',
    uniqueId: 'UID16790123405678',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    college: 'Anna University',
    department: 'Information Technology',
    year: 3,
    phone: '9876543211',
    accommodation: 'Yes',
    payment_status: true, // ✓ Paid - can receive kit
    kit_type: 'General Only',
    kit_provided: false,
    registered_via: 'form',
  },
  {
    participant_id: 'INF9999',
    uniqueId: 'UID16790123409999',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    college: 'PSG College of Technology',
    department: 'Electronics and Communication Engineering',
    year: 4,
    phone: '9876543212',
    accommodation: 'No',
    payment_status: false, // ✗ Not paid - cannot receive kit
    kit_type: 'Workshop Only',
    kit_provided: false,
    registered_via: 'form',
  },
  {
    participant_id: 'INF1111',
    uniqueId: 'UID16790123401111',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    college: 'Coimbatore Institute of Technology',
    department: 'Mechanical Engineering',
    year: 1,
    phone: '9876543213',
    accommodation: 'No',
    payment_status: true, // ✓ Paid
    kit_type: 'Workshop + General',
    kit_provided: true, // ✓ Already provided - should show warning
    registered_via: 'form',
  },
];

async function addTestParticipants() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    console.log('\n📝 Adding test participants...\n');

    for (const participant of testParticipants) {
      try {
        // Check if participant already exists
        const existing = await Participant.findOne({ 
          participant_id: participant.participant_id 
        });

        if (existing) {
          console.log(`⚠️  ${participant.participant_id} - Already exists (${participant.name})`);
        } else {
          await Participant.create(participant);
          console.log(`✓ ${participant.participant_id} - Added: ${participant.name}`);
          console.log(`  → Payment: ${participant.payment_status ? '✓ Paid' : '✗ Not Paid'}`);
          console.log(`  → Kit: ${participant.kit_provided ? '✓ Provided' : '✗ Not Provided'}`);
        }
      } catch (err) {
        console.error(`✗ Error adding ${participant.participant_id}:`, err.message);
      }
    }

    console.log('\n✅ Test data setup complete!\n');
    console.log('📋 Test Cases:');
    console.log('  • INF1234 - Can provide kit (Paid, not provided yet)');
    console.log('  • INF5678 - Can provide kit (Paid, not provided yet)');
    console.log('  • INF9999 - Cannot provide kit (Not paid)');
    console.log('  • INF1111 - Already provided kit (should show warning)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
addTestParticipants();
