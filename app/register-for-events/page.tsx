'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { eventMaxCounts } from '@/data/eventMaxCounts';

interface UserDetails {
  uniqueId: string;
  email: string;
  name: string;
  profilePhoto?: string;
  source?: string;
  isPSGStudent?: boolean;
  college?: string;
  department?: string;
  year?: number;
  phone?: string;
  accomodation?: boolean;
  verified?: boolean;
  generalFeePaid?: boolean;
  kit?: boolean;
  workshopFeePaid?: boolean;
  verificationUrl?: string;
}

interface Event {
  _id: string;
  eventId: string;
  eventName: string;
  category: string;
  oneLineDescription?: string;
  hall?: string;
  teamSize?: number;
  date?: string;
  closed?: boolean;
  timing?: string;
}

interface RegisteredEvent {
  eventId: string;
  eventName: string;
}

export default function RegisterForEvents() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registering, setRegistering] = useState<boolean>(false);
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('helpdeskauthenticated');
    if (!isAuthenticated) {
      router.push('/');
    } else {
      setAuthChecking(false);
    }
  }, [router]);

  // Fetch events and counts on mount
  useEffect(() => {
    fetchEvents();
    fetchEventCounts();
  }, []);

  // Handle Enter key for registration
  useEffect(() => {
    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Enter' && userDetails && selectedEventId && !registering && !registerSuccess) {
        handleRegister();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [userDetails, selectedEventId, registering, registerSuccess]);

  const fetchEvents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await axios.get(`${apiUrl}/inf/api/events`);
      
      if (response.data.success && response.data.events) {
        setEvents(response.data.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchEventCounts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await axios.get(`${apiUrl}/inf/api/events/counts`);
      
      if (response.data.counts) {
        setEventCounts(response.data.counts);
      }
    } catch (err) {
      console.error('Error fetching event counts:', err);
    }
  };

  const isEventFull = (eventId: string): boolean => {
    const currentCount = eventCounts[eventId] || 0;
    const maxCount = eventMaxCounts[eventId];
    
    if (!maxCount) return false;
    
    return (currentCount + 1) > maxCount;
  };

  const getEventDisplayText = (event: Event): string => {
    const currentCount = eventCounts[event.eventId] || 0;
    const maxCount = eventMaxCounts[event.eventId];
    const isFull = isEventFull(event.eventId);
    
    if (isFull) {
      return `${event.eventName} (${event.eventId}) - Registration Full (${currentCount}/${maxCount})`;
    }
    
    if (maxCount) {
      return `${event.eventName} (${event.eventId}) - ${currentCount}/${maxCount}`;
    }
    
    return `${event.eventName} (${event.eventId}) - ${currentCount} registered`;
  };

  const handleDigitChange = (index: number, value: string) => {
    // If registration was successful, reset everything and start fresh
    if (registerSuccess) {
      setDigits(['', '', '', '']);
      setUserDetails(null);
      setError('');
      setRegisterSuccess(false);
      setRegisteredEvents([]);
      setSelectedEventId('');
      const newDigits = ['', '', '', ''];
      newDigits[0] = value;
      setDigits(newDigits);
      inputRefs.current[0]?.focus();
      return;
    }

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-fetch when 4th digit entered
    if (index === 3 && value && newDigits.every(digit => digit !== '')) {
      fetchUserDetails(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fetchUserDetails = async (fourDigits: string) => {
    setError('');
    setLoading(true);
    setUserDetails(null);

    try {
      const userId = `INF${fourDigits}`;
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiKey) {
        setError('API key not configured');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${apiUrl}/inf/api/auth/admin/user/${userId}`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      if (data.user && Array.isArray(data.user) && data.user.length > 0) {
        const userData = data.user[0];
        
        if (!userData.uniqueId) {
          setError('❌ Invalid user data: Missing unique ID');
          setLoading(false);
          return;
        }
        
        setUserDetails(userData);
        // Fetch user's registered events
        fetchUserRegistrations(userData.uniqueId);
      } else {
        setError('❌ User not found');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('❌ User not found');
        } else if (err.response.status === 401) {
          setError('❌ Unauthorized access');
        } else {
          setError('❌ Failed to fetch user details');
        }
      } else {
        setError('❌ Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async (uniqueId: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiKey) return;

      const response = await axios.get(
        `${apiUrl}/inf/api/events/helpdesk/registrations/${uniqueId}`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      if (response.data.success && response.data.events) {
        setRegisteredEvents(response.data.events);
      }
    } catch (err) {
      console.error('Error fetching user registrations:', err);
      setRegisteredEvents([]);
    }
  };

  const isUserRegistered = (eventId: string): boolean => {
    return registeredEvents.some(event => event.eventId === eventId);
  };

  const handleRegister = async () => {
    if (!userDetails || !selectedEventId) return;

    // Check if event is full before registering
    if (isEventFull(selectedEventId)) {
      setError('❌ Registration full for this event');
      return;
    }

    setRegistering(true);
    setError('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiKey) {
        setError('API key not configured');
        setRegistering(false);
        return;
      }

      const response = await axios.post(
        `${apiUrl}/inf/api/events/helpdesk/on-spot`,
        {
          uniqueId: userDetails.uniqueId,
          eventId: selectedEventId
        },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      setRegisterSuccess(true);
      // Refresh event counts and user registrations after successful registration
      fetchEventCounts();
      fetchUserRegistrations(userDetails.uniqueId);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.response) {
        if (err.response.status === 400) {
          setError('❌ User already registered for this event');
        } else {
          setError(`❌ ${err.response.data?.message || 'Registration failed'}`);
        }
      } else {
        setError('❌ Network error. Please try again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  if (authChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Back Button - Top Left */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 20px'
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '10px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
        >
          ← Back to Home
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Input Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: loading || error ? '16px' : '0'
          }}>
            <span style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#667eea'
            }}>
              INF
            </span>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                autoFocus={index === 0}
                style={{
                  width: '50px',
                  height: '50px',
                  fontSize: '24px',
                  textAlign: 'center',
                  borderRadius: '8px',
                  border: '2px solid #E5E7EB',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            ))}
          </div>

          {loading && (
            <div style={{
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              🔍 Searching user...
            </div>
          )}

          {error && (
            <div style={{
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Placeholder when no user is selected */}
        {!userDetails && !loading && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '80px 40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '12px'
            }}>
              Event Registration
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6B7280',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              Enter a participant ID above to view their details and register them for events
            </p>
          </div>
        )}

        {/* User Details and Registration Section */}
        {userDetails && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '8px'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#1F2937',
                margin: 0
              }}>
                {userDetails.name}
              </h2>
              {userDetails.isPSGStudent && (
                <span style={{
                  padding: '8px 16px',
                  fontSize: '18px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}>
                  PSG
                </span>
              )}
            </div>
            <p style={{
              fontSize: '18px',
              color: '#667eea',
              fontWeight: '600',
              marginBottom: '32px'
            }}>
              ID: {userDetails.uniqueId}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Email</label>
                <p style={{
                  fontSize: '16px',
                  color: '#1F2937',
                  fontWeight: '600',
                  margin: 0,
                  wordBreak: 'break-all'
                }}>{userDetails.email}</p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Phone</label>
                <p style={{
                  fontSize: '16px',
                  color: '#1F2937',
                  fontWeight: '600',
                  margin: 0
                }}>{userDetails.phone || 'N/A'}</p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>College</label>
                <p style={{
                  fontSize: '16px',
                  color: '#1F2937',
                  fontWeight: '600',
                  margin: 0
                }}>{userDetails.college || 'N/A'}</p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#9CA3AF',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>Department</label>
                <p style={{
                  fontSize: '16px',
                  color: '#1F2937',
                  fontWeight: '600',
                  margin: 0
                }}>{userDetails.department || 'N/A'}</p>
              </div>
            </div>

            {/* Registered Events */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '12px',
              background: '#F0F9FF',
              border: '2px solid #3B82F6'
            }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                color: '#1E40AF',
                marginBottom: '12px'
              }}>Already Registered Events</label>
              {registeredEvents.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {registeredEvents.map((event) => (
                    <span
                      key={event.eventId}
                      style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        background: '#3B82F6',
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {event.eventName} ({event.eventId})
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  No events registered
                </p>
              )}
            </div>

            {/* Event Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: '12px'
              }}>Select Event</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  borderRadius: '10px',
                  border: '2px solid #E5E7EB',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                }}
              >
                <option value="">-- Select an Event --</option>
                {events
                  .filter(event => event.eventId !== 'EVNT07') // Exclude EVNT07
                  .map((event) => {
                    const isFull = isEventFull(event.eventId);
                    const isRegistered = isUserRegistered(event.eventId);
                    const displayText = isRegistered 
                      ? `${getEventDisplayText(event)} - Already Registered ✓`
                      : getEventDisplayText(event);
                    
                    return (
                      <option 
                        key={event.eventId} 
                        value={event.eventId}
                        disabled={isFull || isRegistered}
                      >
                        {displayText}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={!selectedEventId || registering}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                fontWeight: '700',
                borderRadius: '12px',
                border: 'none',
                background: (!selectedEventId || registering) ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: (!selectedEventId || registering) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (selectedEventId && !registering) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedEventId && !registering) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {registering ? '⏳ Registering...' : '📝 Register for Event'}
            </button>

            {registerSuccess && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '12px',
                background: '#ECFDF5',
                border: '2px solid #10B981',
                textAlign: 'center',
                fontWeight: '700',
                color: '#10B981',
                fontSize: '16px'
              }}>
                ✓ Registration successful! Enter new ID to continue.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
