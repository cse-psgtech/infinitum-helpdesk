// Type definitions for the application

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  college: string;
  customCollege?: string;
  collegeNotListed: boolean;
  department: string;
  customDepartment?: string;
  departmentNotListed: boolean;
  year: string;
  phone: string;
  accommodation: string;
  kit_type: 'general_workshop' | 'workshop_only' | 'general_only';
}

export interface RegistrationPayload {
  name: string;
  email: string;
  college: string;
  department: string;
  year: number;
  phone: string;
  accommodation: string;
  kit_type: 'general_workshop' | 'workshop_only' | 'general_only';
}

export interface RegistrationResponse {
  participant_id: string;
  name: string;
  email: string;
  fee: number;
  qr_code: string;
}

export interface PaymentData {
  participantId: string;
  email: string;
  name: string;
  fee: number;
}

export interface PaymentUrlResponse {
  payment_url: string;
}

export interface ParticipantDetails {
  participant_id: string;
  uniqueId: string;
  name: string;
  email?: string;
  phone?: string;
  college: string;
  department?: string;
  year?: number;
  payment_status: boolean;
  kit_type: string;
  kit_provided: boolean;
  qr_code?: string;
}

export interface KitStatistics {
  success?: boolean;
  data?: {
    kits_provided: {
      workshop_and_general: number;
      workshop_only: number;
      general_only: number;
      total: number;
    };
    registered: {
      workshop_and_general: number;
      workshop_only: number;
      general_only: number;
      total: number;
    };
    summary: {
      total_registered: number;
      total_kits_provided: number;
      pending_kits: number;
      percentage_provided: string | number;
    };
  };
}

export interface ParticipantListItem {
  made_id: string;
  unique_id: string;
  name: string;
  college: string;
  department?: string;
  year: number;
  kit_type?: string;
  kit_provided?: boolean;
  provided_at?: string | null;
}

export interface ParticipantListResponse {
  participants: ParticipantListItem[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
