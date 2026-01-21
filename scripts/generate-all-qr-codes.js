/**
 * Generate QR Codes for All Participants
 * This script generates printable QR codes for all participants in the database
 * 
 * Usage: node scripts/generate-all-qr-codes.js
 */

const mongoose = require('mongoose');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/infinitum';

// Participant Schema
const ParticipantSchema = new mongoose.Schema({
  participant_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  college: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  phone: { type: String, required: true },
  accommodation: { type: String, required: true },
  payment_status: { type: Boolean, default: false },
  kit_type: { type: String, required: true },
  kit_provided: { type: Boolean, default: false },
  registered_via: { type: String, required: true },
}, { timestamps: true });

const Participant = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);

async function generateQRCodes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Create output directory
    const outputDir = path.join(__dirname, '..', 'qr-codes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📝 Fetching all participants...');
    const participants = await Participant.find({}).sort({ participant_id: 1 });
    
    console.log(`Found ${participants.length} participants\n`);
    console.log('📱 Generating QR codes...\n');

    let generated = 0;

    for (const participant of participants) {
      try {
        const qrFileName = `${participant.participant_id}.png`;
        const qrFilePath = path.join(outputDir, qrFileName);

        // Generate QR code
        await QRCode.toFile(qrFilePath, participant.participant_id, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        generated++;
        console.log(`✓ ${participant.participant_id} - ${participant.name}`);
      } catch (err) {
        console.error(`✗ Error generating QR for ${participant.participant_id}:`, err.message);
      }
    }

    console.log(`\n✅ Generated ${generated} QR codes in: ${outputDir}`);
    console.log('\n📋 Next Steps:');
    console.log('  1. Open the qr-codes folder');
    console.log('  2. Print the QR codes');
    console.log('  3. Distribute to participants\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
generateQRCodes();
