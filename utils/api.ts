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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://10.155.34.158:3001';

/**
 * Generic API request handler with admin API key support
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  useAdminKey: boolean = true
): Promise<APIResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add admin API key if required
  if (useAdminKey && ADMIN_API_KEY) {
    headers['x-api-key'] = ADMIN_API_KEY;
  }

  // Add authorization token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
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
  // Get user details by uniqueId (for helpdesk)
  getById: async (uniqueId: string): Promise<APIResponse<ParticipantDetails>> => {
    const result = await apiRequest<{ user: ParticipantDetails[] }>(
      `/api/auth/admin/user/${uniqueId}`,
      { method: 'GET' },
      true
    );
    
    // Transform response - backend returns array, we return first item
    if (result.success && result.data?.user && result.data.user.length > 0) {
      return { 
        success: true, 
        data: {
          ...result.data.user[0],
          participant_id: result.data.user[0].uniqueId,
          payment_status: result.data.user[0].generalFeePaid,
          kit_provided: result.data.user[0].kit,
        }
      };
    }
    
    return { success: false, error: 'User not found' };
  },
  
  // Update kit status
  markKitProvided: async (uniqueId: string): Promise<APIResponse<{ success: boolean; message: string }>> => {
    return apiRequest<{ success: boolean; message: string }>(
      `/api/auth/user/kit/true`,
      {
        method: 'PUT',
        body: JSON.stringify({ uniqueId }),
      },
      true
    );
  },

  // Spot register a user for an event
  spotRegister: async (userId: string, eventId: string): Promise<APIResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(
      `/api/auth/admin/spot-register`,
      {
        method: 'POST',
        body: JSON.stringify({ userId, eventId }),
      },
      true
    );
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
