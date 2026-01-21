'use client';

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
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

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }

    // Restore scanner mode state from sessionStorage if exists
    const savedScannerMode = sessionStorage.getItem('scannerMode');
    const savedSessionId = sessionStorage.getItem('scannerSessionId');
    const savedScannerUrl = sessionStorage.getItem('scannerUrl');

    if (savedScannerMode === 'true' && savedSessionId && savedScannerUrl) {
      setScannerMode(true);
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
    }
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
        const hostIP = process.env.NEXT_PUBLIC_HOST_IP;
        const baseUrl = hostIP 
          ? `http://${hostIP}:3001` 
          : typeof window !== 'undefined' 
            ? window.location.origin 
            : 'http://localhost:3001';
        
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

  const startPolling = (sessId: string) => {
    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/scan-session?session_id=${sessId}`);
        const data = await response.json();

        if (data.success && data.status === 'scanned' && data.participant_id) {
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
          
          const lastFour = data.participant_id.replace('INFIN', '');
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
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const startSessionCheck = () => {
    // Check every 10 seconds if session is still active
    sessionCheckIntervalRef.current = setInterval(() => {
      if (lastScanTime && phoneConnected) {
        const timeSinceLastScan = Date.now() - lastScanTime.getTime();
        // If no scan in last 2 minutes, consider phone disconnected
        if (timeSinceLastScan > 120000) {
          setSessionDisconnected(true);
          setPhoneConnected(false);
          sessionStorage.setItem('phoneConnected', 'false');
          setError('⚠️ Phone disconnected! Please scan the QR code again to reconnect.');
        }
      }
    }, 10000);
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
      const participantId = `INFIN${lastFourDigits}`;
      
      // TODO: Replace with actual API endpoint
      const response = await fetch(`/api/participant/${participantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setParticipantData(data);
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
    participantData.payment_status && 
    !participantData.kit_provided;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '40px' }}>
        <h1>Provide Kit</h1>
        <button 
          className="btn btn-primary" 
          onClick={toggleScannerMode}
          style={{ 
            maxWidth: '250px', 
            fontSize: '14px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h3m14 0h3M3 12h18M3 17h3m14 0h3"/>
            <rect x="7" y="5" width="10" height="14" rx="1"/>
          </svg>
          {scannerMode ? 'Disable Scanner Mode' : 'Enable Scanner Mode'}
        </button>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Default Mode - Simple Search by ID */}
        {!scannerMode && (
          <section>
            <div style={{ 
              maxWidth: '600px', 
              margin: '0 auto',
              textAlign: 'center'
            }}>
              <div style={{
                marginBottom: '48px'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 24px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 style={{ 
                  color: 'var(--text-primary)', 
                  marginBottom: '12px',
                  fontSize: '28px'
                }}>
                  Enter a Unique ID
                </h2>
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '16px'
                }}>
                  Enter the 4-digit unique ID to view accommodation details
                </p>
              </div>

              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '32px'
              }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: 'var(--primary)',
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
                      fontSize: '28px',
                      textAlign: 'center',
                      borderRadius: '16px',
                      border: '2px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      fontWeight: '700',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>

              {loading && (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Loading participant details...</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Scanner Mode Input */}
        {scannerMode && (
          <section style={{ marginBottom: '32px' }}>
            {/* Side by side layout - QR on left, Manual on right */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {/* Left Side - Connection QR Code */}
              <div style={{
                background: 'var(--surface)',
                border: '2px solid var(--border)',
                borderRadius: '20px',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <p>Generating QR code...</p>
                  </div>
                ) : scannerUrl ? (
                  <>
                    <div style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '16px',
                      marginBottom: '24px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                    }}>
                      <QRCodeSVG 
                        value={scannerUrl}
                        size={200}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '14px',
                      textAlign: 'center',
                      marginBottom: '12px'
                    }}>
                      Scan this QR with your phone
                    </p>
                    <div style={{
                      background: phoneConnected 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : sessionDisconnected 
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(124, 58, 237, 0.1)',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: phoneConnected 
                        ? '1px solid rgba(16, 185, 129, 0.3)' 
                        : sessionDisconnected
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(124, 58, 237, 0.3)',
                      textAlign: 'center'
                    }}>
                      <p style={{ 
                        color: phoneConnected 
                          ? 'var(--success)' 
                          : sessionDisconnected
                            ? 'var(--danger)'
                            : 'var(--secondary)', 
                        fontSize: '13px',
                        margin: 0,
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}>
                        {phoneConnected ? (
                          <>
                            <span style={{ fontSize: '18px' }}>●</span>
                            <span>📱 Phone Connected - Ready to scan</span>
                          </>
                        ) : sessionDisconnected ? (
                          <>
                            <span style={{ fontSize: '18px' }}>⚠️</span>
                            <span>Phone Disconnected - Scan QR again</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '18px' }}>○</span>
                            <span>Waiting for phone connection...</span>
                          </>
                        )}
                      </p>
                      {lastScanTime && phoneConnected && (
                        <p style={{ 
                          color: 'var(--text-secondary)', 
                          fontSize: '11px',
                          margin: '4px 0 0',
                          opacity: 0.7
                        }}>
                          Last scan: {lastScanTime.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <p>Failed to generate QR code</p>
                    <button 
                      className="btn btn-primary"
                      onClick={createScanSession}
                      style={{ marginTop: '12px' }}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side - Manual Entry */}
              <div style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border)',
                  borderRadius: '20px',
                  padding: '40px'
                }}>
                  <h3 style={{ 
                    color: 'var(--text-primary)', 
                    marginBottom: '24px',
                    fontSize: '20px',
                    textAlign: 'center'
                  }}>
                    Enter 4-digit Unique ID
                  </h3>
                  
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '32px'
                  }}>
                    <span style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: 'var(--primary)',
                      fontFamily: "'Playfair Display', serif"
                    }}>
                      INF
                    </span>
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        className="otp-input"
                        maxLength={1}
                        value={digit}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
                        autoFocus={index === 0}
                        style={{
                          width: '60px',
                          height: '60px',
                          fontSize: '24px',
                          textAlign: 'center',
                          borderRadius: '12px',
                          border: '2px solid var(--border)',
                          background: 'var(--surface-light)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ 
                    padding: '16px',
                    background: 'rgba(233, 30, 140, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(233, 30, 140, 0.3)',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '14px',
                      margin: 0
                    }}>
                      Or use hardware barcode scanner below
                    </p>
                    <input
                      ref={scannerInputRef}
                      type="text"
                      className="form-input"
                      placeholder="Click here and scan"
                      value={scannedCode}
                      onChange={handleScannerInput}
                      style={{ 
                        width: '100%',
                        marginTop: '12px',
                        fontSize: '16px',
                        textAlign: 'center',
                        border: '2px solid var(--primary)',
                        padding: '12px',
                        background: 'var(--surface-light)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* Participant Details */}
        {participantData && (
          <>
            <hr className="section-divider" />
            <section>
              <h2 className="section-title">Participant Details</h2>
              
              {participantData.kit_provided && (
                <div className="alert alert-warning">
                  ⚠️ Kit already provided to this participant!
                </div>
              )}

              {!participantData.payment_status && (
                <div className="alert alert-error">
                  ❌ Payment not completed. Cannot provide kit.
                </div>
              )}

              <div className="participant-details">
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{participantData.name}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Participant ID:</span>
                  <span className="detail-value">{participantData.participant_id}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">College:</span>
                  <span className="detail-value">{participantData.college}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Payment Status:</span>
                  <span className={participantData.payment_status ? 'status-paid' : 'status-unpaid'}>
                    {participantData.payment_status ? 'Paid ✓' : 'Not Paid ✗'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Kit Type:</span>
                  <span className="detail-value">{participantData.kit_type || 'General'}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Kit Status:</span>
                  <span className={participantData.kit_provided ? 'status-paid' : 'status-unpaid'}>
                    {participantData.kit_provided ? 'Already Provided ✓' : 'Not Provided'}
                  </span>
                </div>
              </div>

              <div className="btn-group">
                <button 
                  className="btn btn-primary" 
                  onClick={handleProvideKit}
                  disabled={!canProvideKit || loading}
                >
                  {loading ? 'Processing...' : 'Provide Kit'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>
            </section>
          </>
        )}

        {/* No Data Message */}
        {!loading && !participantData && otpDigits.every(d => d !== '') && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
            <h3>No Data Available!</h3>
            <p>Please check the ID and try again.</p>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => router.push('/')}
            style={{ maxWidth: '200px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
