'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useScanner } from '@/contexts/ScannerContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

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

export default function ProvideKit() {
  const router = useRouter();
  const { scannerMode, deskSession, scannerConnected, socket, enableScannerMode, disableScannerMode, scannedId, setScannedId } = useScanner();
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [kitUpdateLoading, setKitUpdateLoading] = useState<boolean>(false);
  const [kitUpdateSuccess, setKitUpdateSuccess] = useState<boolean>(false);
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

  // Listen for scanned IDs from socket
  useEffect(() => {
    if (scannedId.length === 4) {
      const newDigits = scannedId.split('');
      setDigits(newDigits);
      fetchUserDetails(scannedId);
    }
  }, [scannedId]);

  // Listen for clear-scan event from scanner
  useEffect(() => {
    if (!socket) return;

    const handleClearScan = () => {
      setScannedId('');
      setDigits(['', '', '', '']);
      setUserDetails(null);
      setError('');
      setKitUpdateSuccess(false);
      inputRefs.current[0]?.focus();
      toast.success('Cleared by scanner');
    };

    socket.on('clear-scan', handleClearScan);

    return () => {
      socket.off('clear-scan', handleClearScan);
    };
  }, [socket, setScannedId]);

  // Handle Enter key for kit provision
  useEffect(() => {
    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // If confirmation is showing, confirm the action
        if (showConfirmation) {
          confirmKitProvided();
        }
        // If user details are loaded and kit not provided, show confirmation
        else if (userDetails && !userDetails.kit && !kitUpdateLoading && !kitUpdateSuccess) {
          handleKitProvided();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showConfirmation, userDetails, kitUpdateLoading, kitUpdateSuccess]);

  const handleDigitChange = (index: number, value: string) => {
    // If kit was just updated successfully, reset everything and start fresh
    if (kitUpdateSuccess) {
      setDigits(['', '', '', '']);
      setUserDetails(null);
      setError('');
      setKitUpdateSuccess(false);
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
      console.log(data);
      
      // Backend returns {user: [userDetails]} (array)
      if (data.user && Array.isArray(data.user) && data.user.length > 0) {
        const userData = data.user[0];
        
        // Validate uniqueId is present
        if (!userData.uniqueId) {
          setError('❌ Invalid user data: Missing unique ID');
          setLoading(false);
          return;
        }
        
        setUserDetails(userData);
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

  const handleReset = () => {
    setDigits(['', '', '', '']);
    setUserDetails(null);
    setError('');
    setKitUpdateSuccess(false);
    inputRefs.current[0]?.focus();
  };

  const handleKitProvided = () => {
    setShowConfirmation(true);
  };

  const confirmKitProvided = async () => {
    if (!userDetails) return;

    setKitUpdateLoading(true);
    setError('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiKey) {
        setError('API key not configured');
        setKitUpdateLoading(false);
        setShowConfirmation(false);
        return;
      }
      
      if (!userDetails.uniqueId) {
        setError('❌ Missing unique ID');
        setKitUpdateLoading(false);
        setShowConfirmation(false);
        return;
      }
      
      console.log('Updating kit status for user:', userDetails.uniqueId);
      
      const response = await axios.post(
        `${apiUrl}/inf/api/auth/user/kit/true`,
        { uniqueId: userDetails.uniqueId },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data;
      
      // Update local user details
      if (data.user) {
        setUserDetails(prev => prev ? { ...prev, kit: true } : null);
      }

      setKitUpdateSuccess(true);
      setShowConfirmation(false);
    } catch (err: any) {
      console.error('Kit update error:', err);
      
      if (err.response) {
        setError(`❌ Failed to update kit status: ${err.response.data?.message || 'Unknown error'}`);
      } else {
        setError('❌ Network error. Please try again.');
      }
      
      setShowConfirmation(false);
    } finally {
      setKitUpdateLoading(false);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const clearScan = () => {
    setScannedId('');
    setDigits(['', '', '', '']);
    setUserDetails(null);
    setError('');
    setKitUpdateSuccess(false);
    inputRefs.current[0]?.focus();

    if (socket && scannerMode) {
      socket.emit('clear-scan');
      socket.emit('resume-scanning');
      toast.success('Ready for next scan');
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
        margin: '0 auto 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap'
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

        {/* Scanner Toggle */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={scannerMode ? disableScannerMode : enableScannerMode}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '10px',
              border: 'none',
              background: scannerMode 
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
            }}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {scannerMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              )}
            </svg>
            {scannerMode ? 'Disable' : 'Enable'} Scanner
          </button>
          
          {scannerMode && scannerConnected && (
            <div style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}></div>
              Scanner Connected
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Input Section - Always Visible */}
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

        {/* QR Code Display - Scanner Mode */}
        {scannerMode && deskSession && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '16px'
            }}>
              Scan QR Code on Mobile
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '20px'
            }}>
              Open this QR code on your mobile device to start scanning participant IDs
            </p>
            
            <div style={{
              display: 'inline-block',
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}>
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scanner?deskId=${deskSession.deskId}&signature=${deskSession.signature}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <p style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginTop: '16px'
            }}>
              Status: {scannerConnected ? '✓ Mobile Connected' : '⏳ Waiting for mobile...'}
            </p>

            {userDetails && (
              <button
                onClick={clearScan}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
              >
                Clear & Ready for Next Scan
              </button>
            )}
          </div>
        )}

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
              Id card Distribution
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6B7280',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              Enter a participant ID above to view their details and provide them with a ID card
            </p>
          </div>
        )}

        {/* User Details Section */}
        {userDetails && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 400px',
              gap: '40px'
            }}>
              {/* Left Side - User Details */}
              <div>
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

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      marginBottom: '8px',
                      textTransform: 'uppercase'
                    }}>Year</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#1F2937',
                      fontWeight: '600',
                      margin: 0
                    }}>{userDetails.year || 'N/A'}</p>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      marginBottom: '8px',
                      textTransform: 'uppercase'
                    }}>PSG Student</label>
                    <p style={{
                      fontSize: '16px',
                      color: '#1F2937',
                      fontWeight: '600',
                      margin: 0
                    }}>{userDetails.isPSGStudent ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: userDetails.verified ? '#ECFDF5' : '#FEF2F2',
                    border: `2px solid ${userDetails.verified ? '#10B981' : '#EF4444'}`
                  }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase'
                    }}>Verified</p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      margin: 0,
                      color: userDetails.verified ? '#10B981' : '#EF4444'
                    }}>{userDetails.verified ? '✓ Yes' : '✗ No'}</p>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: userDetails.generalFeePaid ? '#ECFDF5' : '#FEF2F2',
                    border: `2px solid ${userDetails.generalFeePaid ? '#10B981' : '#EF4444'}`
                  }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase'
                    }}>Fee Paid</p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      margin: 0,
                      color: userDetails.generalFeePaid ? '#10B981' : '#EF4444'
                    }}>{userDetails.generalFeePaid ? '✓ Yes' : '✗ No'}</p>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: userDetails.workshopFeePaid ? '#ECFDF5' : '#FEF2F2',
                    border: `2px solid ${userDetails.workshopFeePaid ? '#10B981' : '#EF4444'}`
                  }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase'
                    }}>Workshop Fee</p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      margin: 0,
                      color: userDetails.workshopFeePaid ? '#10B981' : '#EF4444'
                    }}>{userDetails.workshopFeePaid ? '✓ Yes' : '✗ No'}</p>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: userDetails.kit ? '#ECFDF5' : '#FEF3C7',
                    border: `2px solid ${userDetails.kit ? '#10B981' : '#FBBF24'}`
                  }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase'
                    }}>Kit</p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      margin: 0,
                      color: userDetails.kit ? '#10B981' : '#F59E0B'
                    }}>{userDetails.kit ? '✓ Given' : '✗ Pending'}</p>
                  </div>
                </div>

                {/* Kit Provided Button */}
                {!userDetails.kit && (
                  <button
                    onClick={handleKitProvided}
                    disabled={kitUpdateLoading}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '18px',
                      fontWeight: '700',
                      borderRadius: '12px',
                      border: 'none',
                      background: kitUpdateLoading ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      cursor: kitUpdateLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!kitUpdateLoading) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!kitUpdateLoading) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                      }
                    }}
                  >
                    {kitUpdateLoading ? ' Updating...' : 'Id Provided'}
                  </button>
                )}

                {kitUpdateSuccess && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#ECFDF5',
                    border: '2px solid #10B981',
                    textAlign: 'center',
                    fontWeight: '700',
                    color: '#10B981',
                    fontSize: '16px'
                  }}>
                    ✓ Id card status updated! Enter new ID to continue.
                  </div>
                )}
              </div>

              {/* Right Side - Verification Image */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#9CA3AF',
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>Verification Document</label>
                
                {userDetails.verificationUrl ? (
                  <div style={{
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <img 
                      src={`https://backendinfinitum.psgtech.ac.in/inf/api/auth/files/${userDetails.verificationUrl}`} 
                      alt="Verification Document"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<p style="padding: 40px; text-align: center; color: #6B7280;">Failed to load image</p>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6B7280'
                  }}>
                    No verification document
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Confirmation Overlay */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '16px',
              textAlign: 'center'
            }}>Confirm Id Provision</h3>
            
            <p style={{
              fontSize: '16px',
              color: '#6B7280',
              marginBottom: '8px',
              textAlign: 'center'
            }}>Are you sure you want to mark Id as provided for:</p>
            
            <p style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#667eea',
              marginBottom: '32px',
              textAlign: 'center'
            }}>{userDetails?.name} ({userDetails?.uniqueId})?</p>

            <div style={{
              display: 'flex',
              gap: '16px'
            }}>
              <button
                onClick={cancelConfirmation}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: '2px solid #E5E7EB',
                  background: 'white',
                  color: '#6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmKitProvided}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                ✓ Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
