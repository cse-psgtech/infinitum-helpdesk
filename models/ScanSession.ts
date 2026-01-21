import mongoose, { Schema, Model } from 'mongoose';

export interface IScanSession {
  session_id: string;
  participant_id?: string;
  status: 'waiting' | 'scanned' | 'expired';
  scanned_at?: Date;
  expires_at: Date;
  createdAt?: Date;
}

const ScanSessionSchema = new Schema<IScanSession>(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    participant_id: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['waiting', 'scanned', 'expired'],
      default: 'waiting',
    },
    scanned_at: {
      type: Date,
      default: null,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired sessions after 5 minutes
ScanSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const ScanSession: Model<IScanSession> =
  mongoose.models.ScanSession || mongoose.model<IScanSession>('ScanSession', ScanSessionSchema);

export default ScanSession;
