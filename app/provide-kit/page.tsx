'use client';

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import type { ParticipantDetails } from '@/types';

export default function ProvideKit() {
  const router = useRouter();
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [participantData, setParticipantData] = useState<ParticipantDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [scannerMode, setScannerMode] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [scannerUrl, setScannerUrl] = useState<string>('');
  const [scannedCode, setScannedCode] = useState<string>('');
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [sessionDisconnected, setSessionDisconnected] = useState<boolean>(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const scannerInputRef = useRef<HTMLInputElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Define startPolling as useCallback so it can be called from handlers
  const startPolling = useCallback((sessId: string) => {
    // Clear any existing polling first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log('Starting polling for session:', sessId);
    
    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/scan-session?session_id=${sessId}`);
        const data = await response.json();

        console.log('Polling response:', data);

        if (data.success && data.status === 'scanned' && data.participant_id) {
          console.log('Participant scanned:', data.participant_id);
          
          // Got a scan result!
          const now = new Date();
          
          // First scan - phone just connected
          if (!phoneConnected) {
            setPhoneConnected(true);
            setSessionDisconnected(false);
            sessionStorage.setItem('phoneConnected', 'true');
            setSuccess('📱 Phone connected! Ready to scan participants.');
            setTimeout(() => setSuccess(''), 3000);
          }
          
          // Update last scan time
          setLastScanTime(now);
          sessionStorage.setItem('lastScanTime', now.toISOString());
          
          const lastFour = data.participant_id.replace('INF', '');
          const digits = lastFour.split('');
          setOtpDigits(digits);
          await fetchParticipantDetails(lastFour);
          
          // Reset session status for next scan (keep same session)
          await fetch('/api/scan-session', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessId,
              status: 'waiting'
            })
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  }, [phoneConnected]);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }

    // Always auto-start scanner mode
    const savedSessionId = sessionStorage.getItem('scannerSessionId');
    const savedScannerUrl = sessionStorage.getItem('scannerUrl');

    if (savedSessionId && savedScannerUrl) {
      setSessionId(savedSessionId);
      setScannerUrl(savedScannerUrl);
      
      // Restore connection status
      const savedPhoneConnected = sessionStorage.getItem('phoneConnected');
      const savedLastScanTime = sessionStorage.getItem('lastScanTime');
      if (savedPhoneConnected === 'true') {
        setPhoneConnected(true);
      }
      if (savedLastScanTime) {
        setLastScanTime(new Date(savedLastScanTime));
      }
      
      // Restart polling for the existing session
      startPolling(savedSessionId);
      startSessionCheck();
    } else {
      // Auto-create new scanner session on load
      createScanSession();
    }

    // Handle tab visibility change - stop/start polling
    const handleVisibilityChange = () => {
      const sessId = sessionStorage.getItem('scannerSessionId');
      if (!sessId) return;

      if (document.hidden) {
        // Tab is now hidden - stop polling to save resources
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        // Clear phone connected flag if tab is hidden (user likely left)
        sessionStorage.setItem('phoneConnected', 'false');
        setPhoneConnected(false);
      } else {
        // Tab is now visible - restart polling immediately
        if (!pollingIntervalRef.current) {
          startPolling(sessId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup when page unmounts - stop polling and clear scanner state
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
      stopSessionCheck();
      // Clear scanner state from sessionStorage
      sessionStorage.removeItem('phoneConnected');
      sessionStorage.removeItem('lastScanTime');
      sessionStorage.removeItem('scannerMode');
    };
  }, [router]);

  useEffect(() => {
    // Focus scanner input when scanner mode is enabled
    if (scannerMode && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [scannerMode]);

  const handleScannerInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScannedCode(value);

    // Auto-submit when scanned code matches pattern (e.g., INFIN1234 or just last 4 digits)
    if (value.length >= 4) {
      const lastFourDigits = value.slice(-4);
      if (/^\d{4}$/.test(lastFourDigits)) {
        // Extract last 4 digits and fetch
        const digits = lastFourDigits.split('');
        setOtpDigits(digits);
        fetchParticipantDetails(lastFourDigits);
        setScannedCode('');
      }
    }
  };

  const toggleScannerMode = async () => {
    if (!scannerMode) {
      // Enabling scanner mode - create session
      await createScanSession();
    } else {
      // Disabling scanner mode - cleanup
      stopPolling();
      stopSessionCheck();
      setSessionId('');
      setScannerUrl('');
      setPhoneConnected(false);
      setLastScanTime(null);
      setSessionDisconnected(false);
      // Clear from sessionStorage
      sessionStorage.removeItem('scannerMode');
      sessionStorage.removeItem('scannerSessionId');
      sessionStorage.removeItem('scannerUrl');
      sessionStorage.removeItem('phoneConnected');
      sessionStorage.removeItem('lastScanTime');
    }
    setScannerMode(!scannerMode);
    setScannedCode('');
    setOtpDigits(['', '', '', '']);
    setParticipantData(null);
    setError('');
    setSuccess('');
  };

  const createScanSession = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scan-session', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.session_id);
        
        // Use environment variable or auto-detect from browser
        const hostIP = process.env.NEXT_PUBLIC_HOST_IP || '10.155.34.158';
        const baseUrl = hostIP 
          ? `http://${hostIP}:3001` 
          : typeof window !== 'undefined' 
            ? window.location.origin 
            : 'http://10.155.34.158:3001';
        
        const url = `${baseUrl}/mobile-scanner?session=${data.session_id}`;
        setScannerUrl(url);
        
        // Save to sessionStorage to persist across page navigation
        sessionStorage.setItem('scannerMode', 'true');
        sessionStorage.setItem('scannerSessionId', data.session_id);
        sessionStorage.setItem('scannerUrl', url);
        
        // Start polling for scan results
        startPolling(data.session_id);
        startSessionCheck();
      } else {
        setError('Failed to create scanner session');
      }
    } catch (err) {
      setError('Failed to initialize scanner');
    } finally {
      setLoading(false);
    }
  };
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const startSessionCheck = () => {
    // Check every 5 seconds if session is still active
    sessionCheckIntervalRef.current = setInterval(() => {
      if (lastScanTime && phoneConnected) {
        const timeSinceLastScan = Date.now() - lastScanTime.getTime();
        // If no scan in last 30 seconds, consider phone disconnected
        if (timeSinceLastScan > 30000) {
          setSessionDisconnected(true);
          setPhoneConnected(false);
          sessionStorage.setItem('phoneConnected', 'false');
          setError('⚠️ Phone disconnected! Please scan the QR code again to reconnect.');
        }
      }
    }, 5000);
  };

  const stopSessionCheck = () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  };

  // Don't cleanup polling on unmount - keep session alive when navigating
  // Polling will only stop when user clicks "Disable Scanner Mode"

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-fetch when all 4 digits entered
    if (index === 3 && value && newOtpDigits.every(digit => digit !== '')) {
      fetchParticipantDetails(newOtpDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fetchParticipantDetails = async (lastFourDigits: string) => {
    setError('');
    setSuccess('');
    setLoading(true);
    setParticipantData(null);

    try {
      // Try to construct full participant ID (INF + 4 digits)
      const participantId = `INF${lastFourDigits}`;
      
      const response = await fetch(`/api/participant/${participantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle response format from API
        if (data.success && data.participant) {
          setParticipantData(data.participant);
        } else if (data.participant) {
          setParticipantData(data.participant);
        }
      } else if (response.status === 404) {
        setError('❌ Participant Not Found! Please verify the ID.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Participant not found');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch participant error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProvideKit = async () => {
    if (!participantData) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch(`/api/participant/${participantData.participant_id}/kit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          kit_provided: true
        }),
      });

      if (response.ok) {
        setSuccess('Kit provided successfully!');
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setOtpDigits(['', '', '', '']);
          setParticipantData(null);
          setSuccess('');
          inputRefs.current[0]?.focus();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to mark kit as provided');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Provide kit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOtpDigits(['', '', '', '']);
    setParticipantData(null);
    setError('');
    setSuccess('');
    inputRefs.current[0]?.focus();
  };

  const canProvideKit = participantData && 
    participantData.verified && 
    participantData.generalFeePaid && 
    !participantData.kit;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Provide Kit</h1>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <section>
          {/* Combined Input Methods - Single Large Box */}
          {!participantData && (
          <div style={{
            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            borderRadius: '32px',
            padding: '60px',
            marginBottom: '48px',
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
            minHeight: '500px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            alignItems: 'center'
          }}>
            {/* Left Side - Mobile Scanner QR */}
            <div style={{
              textAlign: 'center',
              color: 'white'
            }}>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '32px',
                fontSize: '28px',
                fontWeight: '700'
              }}>
                📱 Mobile Scanner
              </h3>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '32px',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                display: 'inline-block'
              }}>
                <QRCodeSVG 
                  value={scannerUrl || 'Loading...'}
                  size={280}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <p style={{ 
                color: 'rgba(255,255,255,0.95)', 
                fontSize: '16px',
                marginTop: '24px',
                marginBottom: '16px',
                fontWeight: '500'
              }}>
                Scan this QR with your phone
              </p>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '16px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ 
                  color: 'white', 
                  fontSize: '14px',
                  margin: 0,
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {phoneConnected ? (
                    <>
                      <span style={{ fontSize: '20px' }}>●</span>
                      <span>Phone Connected - Ready to scan</span>
                    </>
                  ) : sessionDisconnected ? (
                    <>
                      <span style={{ fontSize: '20px' }}>⚠️</span>
                      <span>Phone Disconnected - Scan QR again</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '20px' }}>○</span>
                      <span>Waiting for phone connection...</span>
                    </>
                  )}
                </p>
                {lastScanTime && phoneConnected && (
                  <p style={{ 
                    color: 'rgba(255,255,255,0.85)', 
                    fontSize: '12px',
                    margin: '8px 0 0',
                    opacity: 0.95
                  }}>
                    Last scan: {lastScanTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Right Side - Manual Entry */}
            <div style={{
              textAlign: 'center',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '40px',
                fontSize: '28px',
                fontWeight: '700'
              }}>
                🔑 Enter 4-digit ID
              </h3>
              
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '40px'
              }}>
                <span style={{
                  fontSize: '40px',
                  fontWeight: '700',
                  color: 'white',
                  fontFamily: "'Playfair Display', serif"
                }}>
                  INF
                </span>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                    autoFocus={index === 0}
                    style={{
                      width: '70px',
                      height: '70px',
                      fontSize: '32px',
                      textAlign: 'center',
                      borderRadius: '14px',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      background: 'rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      fontWeight: '700',
                      transition: 'all 0.3s',
                      backdropFilter: 'blur(10px)',
                      cursor: 'text'
                    }}
                  />
                ))}
              </div>

              {loading && (
                <div style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)'
                }}>
                  🔍 Searching participant...
                </div>
              )}
            </div>
          </div>
          )}


          {/* Participant Details - Full Width */}
          {participantData && (
            <section style={{
              marginTop: '40px',
              animation: 'slideUp 0.3s ease-in-out'
            }}>
              {/* Success Message */}
              <div style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                padding: '20px 28px',
                borderRadius: '16px',
                marginBottom: '24px',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}>
                ✅ Participant Found Successfully!
              </div>

              {/* Details Card */}
              <div style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FF 100%)',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 15px 50px rgba(102, 126, 234, 0.15)',
                marginBottom: '24px',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                {/* Header with ID */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '32px',
                  paddingBottom: '32px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}>
                    {participantData.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1F2937',
                      margin: 0
                    }}>
                      {participantData.name}
                    </h3>
                    <p style={{
                      background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: '600',
                      margin: '6px 0 0 0',
                      fontSize: '14px'
                    }}>
                      ID: {participantData.participant_id}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  marginBottom: '28px'
                }}>
                  {/* Left Column */}
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#9CA3AF',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px'
                      }}>
                        College
                      </label>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1F2937',
                        margin: 0
                      }}>
                        {participantData.college}
                      </p>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6B7280',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Department
                      </label>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1F2937',
                        margin: 0
                      }}>
                        {participantData.department || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6B7280',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Year
                      </label>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1F2937',
                        margin: 0
                      }}>
                        {participantData.year || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6B7280',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Email
                      </label>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1F2937',
                        margin: 0,
                        wordBreak: 'break-all'
                      }}>
                        {participantData.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '28px',
                  paddingBottom: '28px',
                  borderBottom: '2px solid #E5E7EB'
                }}>
                  {/* Payment Status */}
                  <div style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: participantData.payment_status 
                      ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                      : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                    border: `2px solid ${participantData.payment_status ? '#10B981' : '#F87171'}`,
                    boxShadow: `0 4px 12px ${participantData.payment_status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)'}`
                  }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6B7280',
                      margin: '0 0 10px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Payment Status
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      margin: 0,
                      color: participantData.payment_status ? '#10B981' : '#F87171'
                    }}>
                      {participantData.payment_status ? '✓ Paid' : '✗ Not Paid'}
                    </p>
                  </div>

                  {/* Kit Status */}
                  <div style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: participantData.kit_provided 
                      ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                      : 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
                    border: `2px solid ${participantData.kit_provided ? '#10B981' : '#FBBF24'}`,
                    boxShadow: `0 4px 12px ${participantData.kit_provided ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)'}`
                  }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6B7280',
                      margin: '0 0 10px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Kit Status
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      margin: 0,
                      color: participantData.kit_provided ? '#10B981' : '#F59E0B'
                    }}>
                      {participantData.kit_provided ? '✓ Provided' : '⏳ Not Provided'}
                    </p>
                  </div>
                </div>

                {/* Kit Type */}
                <div style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #F0F4FF 0%, #E0E7FF 100%)',
                  border: '2px solid #667EEA',
                  marginBottom: '28px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.1)'
                }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#6B7280',
                    margin: '0 0 10px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Kit Type
                  </p>
                  <p style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    margin: 0,
                    color: '#667EEA'
                  }}>
                    {participantData.kit_type}
                  </p>
                </div>

                {/* Warnings */}
                {participantData.kit_provided && (
                  <div style={{
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                    border: '2px solid #FBBF24',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '24px',
                    color: '#92400E',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)'
                  }}>
                    ⚠️ Kit already provided to this participant
                  </div>
                )}

                {!participantData.payment_status && (
                  <div style={{
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                    border: '2px solid #F87171',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '24px',
                    color: '#991B1B',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(248, 113, 113, 0.1)'
                  }}>
                    ❌ Payment not completed. Cannot provide kit.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                <button
                  onClick={handleProvideKit}
                  disabled={!canProvideKit || loading}
                  style={{
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '16px',
                    border: 'none',
                    background: canProvideKit ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' : '#D1D5DB',
                    color: 'white',
                    cursor: canProvideKit ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s',
                    boxShadow: canProvideKit ? '0 8px 20px rgba(102, 126, 234, 0.4)' : 'none'
                  }}
                >
                  {loading ? '⏳ Processing...' : '✓ Provide Kit'}
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '16px',
                    border: '2px solid #E5E7EB',
                    background: 'white',
                    color: '#1F2937',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  Reset
                </button>
              </div>
            </section>
          )}
        </section>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid #E5E7EB',
              background: 'white',
              color: '#1F2937',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
