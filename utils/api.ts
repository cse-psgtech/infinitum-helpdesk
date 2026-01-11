// API Base URL - Update this with your actual backend URL
import type {
  APIResponse,
  LoginCredentials,
  LoginResponse,
  RegistrationPayload,
  RegistrationResponse,
  PaymentData,
  PaymentUrlResponse,
  ParticipantDetails,
  KitStatistics,
  ParticipantListResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Generic API request handler
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<APIResponse<LoginResponse>> => {
    return apiRequest<LoginResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
    }
  },
};

/**
 * Registration API
 */
export const registrationAPI = {
  register: async (participantData: RegistrationPayload): Promise<APIResponse<RegistrationResponse>> => {
    return apiRequest<RegistrationResponse>('/api/register', {
      method: 'POST',
      body: JSON.stringify(participantData),
    });
  },
  
  generatePaymentUrl: async (paymentData: PaymentData): Promise<APIResponse<PaymentUrlResponse>> => {
    return apiRequest<PaymentUrlResponse>('/api/payment/generate-url', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
};

/**
 * Participant API
 */
export const participantAPI = {
  getById: async (participantId: string): Promise<APIResponse<ParticipantDetails>> => {
    return apiRequest<ParticipantDetails>(`/api/participant/${participantId}`);
  },
  
  markKitProvided: async (participantId: string): Promise<APIResponse<{ success: boolean }>> => {
    return apiRequest<{ success: boolean }>(`/api/participant/${participantId}/kit`, {
      method: 'PUT',
      body: JSON.stringify({ kit_provided: true }),
    });
  },
};

/**
 * Kit Management API
 */
export const kitAPI = {
  getStatistics: async (): Promise<APIResponse<KitStatistics>> => {
    return apiRequest<KitStatistics>('/api/kits/statistics');
  },
  
  getList: async (): Promise<APIResponse<ParticipantListResponse>> => {
    return apiRequest<ParticipantListResponse>('/api/kits/list');
  },
};

/**
 * Utility Functions
 */
export const utils = {
  // Calculate fee based on college
  calculateFee: (college: string): number => {
    const hostColleges = ['PSG College of Technology']; // Add your host college here
    return hostColleges.includes(college) ? 200 : 250;
  },
  
  // Format participant ID
  formatParticipantId: (id: string): string => {
    if (!id) return '';
    return id.startsWith('INFIN') ? id : `INFIN${id}`;
  },
  
  // Validate phone number
  validatePhone: (phone: string): boolean => {
    return /^[0-9]{10}$/.test(phone);
  },
  
  // Validate email
  validateEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};

export default {
  authAPI,
  registrationAPI,
  participantAPI,
  kitAPI,
  utils,
};
