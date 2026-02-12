import mongoose, { Schema, Model } from 'mongoose';

export interface IParticipant {
  participant_id: string;
  uniqueId: string;
  name: string;
  email: string;
  college: string;
  department: string;
  year: number;
  phone: string;
  accommodation: string;
  payment_status?: boolean;
  kit_type?: string;
  kit_provided?: boolean;
  kit_provided_at?: Date;
  registered_via?: 'form';
  createdAt?: Date;
  updatedAt?: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    participant_id: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    accommodation: {
      type: String,
      required: true,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    payment_status: {
      type: Boolean,
      default: false,
      index: true,
    },
    kit_type: {
      type: String,
      required: true,
      enum: ['Workshop + General', 'Workshop Only', 'General Only'],
      default: 'General Only',
    },
    kit_provided: {
      type: Boolean,
      default: false,
      index: true,
    },
    kit_provided_at: {
      type: Date,
      default: null,
    },
    registered_via: {
      type: String,
      required: true,
      enum: ['form'],
      default: 'form',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Prevent model recompilation in development
const Participant: Model<IParticipant> =
  mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema);

export default Participant;
