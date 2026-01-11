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
}

export interface RegistrationPayload {
  name: string;
  email: string;
  college: string;
  department: string;
  year: number;
  phone: string;
  accommodation: string;
}

export interface RegistrationResponse {
  participant_id: string;
  name: string;
  email: string;
  fee: number;
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
  name: string;
  college: string;
  payment_status: boolean;
  kit_type: string;
  kit_provided: boolean;
}

export interface KitStatistics {
  workshop_and_general: number;
  workshop_only: number;
  general_only: number;
}

export interface ParticipantListItem {
  participant_id: string;
  name: string;
  college: string;
}

export interface ParticipantListResponse {
  participants: ParticipantListItem[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
