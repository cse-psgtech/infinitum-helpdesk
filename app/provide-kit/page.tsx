'use client';

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ParticipantDetails } from '@/types';

export default function ProvideKit() {
  const router = useRouter();
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [participantData, setParticipantData] = useState<ParticipantDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [scannerMode, setScannerMode] = useState<boolean>(false);
  const [scannedCode, setScannedCode] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const scannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
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

  const toggleScannerMode = () => {
    setScannerMode(!scannerMode);
    setScannedCode('');
    if (!scannerMode) {
      // Clearing manual input when enabling scanner mode
      setOtpDigits(['', '', '', '']);
      setParticipantData(null);
      setError('');
      setSuccess('');
    }
  };

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
      const participantId = `INF${lastFourDigits}`;
      
      // TODO: Replace with actual API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/participant/${participantId}`, {
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
    participantData.verified && 
    participantData.generalFeePaid && 
    !participantData.kit;

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

        {/* Scanner Mode Input */}
        {scannerMode && (
          <section style={{ marginBottom: '32px' }}>
            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h3m14 0h3M3 12h18M3 17h3m14 0h3"/>
                <rect x="7" y="5" width="10" height="14" rx="1"/>
              </svg>
              <span><strong>Scanner Mode Active</strong> - Scan the barcode now</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <div style={{ 
                display: 'inline-block',
                padding: '32px 48px',
                background: 'linear-gradient(135deg, rgba(228, 88, 88, 0.1) 0%, rgba(255, 107, 157, 0.1) 100%)',
                borderRadius: '20px',
                border: '3px dashed var(--primary)',
                marginBottom: '20px'
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                  <path d="M3 7h3m14 0h3M3 12h18M3 17h3m14 0h3"/>
                  <rect x="7" y="5" width="10" height="14" rx="1"/>
                </svg>
                <p style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: '600', margin: '0' }}>Ready to Scan</p>
              </div>
              <input
                ref={scannerInputRef}
                type="text"
                className="form-input"
                placeholder="Scanning... (cursor auto-focused)"
                value={scannedCode}
                onChange={handleScannerInput}
                autoFocus
                style={{ 
                  maxWidth: '500px', 
                  margin: '0 auto',
                  fontSize: '18px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  border: '3px solid var(--primary)',
                  backgroundColor: 'rgba(228, 88, 88, 0.05)',
                  padding: '20px'
                }}
              />
            </div>
          </section>
        )}

        {/* ID Input Section - Show only when scanner mode is OFF */}
        {!scannerMode && (
          <section>
            <h2 className="section-title">Enter Infinitum ID</h2>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: '500' }}>
                Enter the last 4 digits of participant ID
              </p>
              <div className="otp-input-group">
                <span className="otp-prefix" style={{ 
                  fontSize: '32px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '1px'
                }}>INF</span>
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
                  />
                ))}
              </div>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading participant details...</p>
              </div>
            )}
          </section>
        )}

        {/* Loading indicator for scanner mode */}
        {scannerMode && loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading participant details...</p>
          </div>
        )}

        {/* Participant Details */}
        {participantData && (
          <>
            <hr className="section-divider" />
            <section>
              <h2 className="section-title">Participant Details</h2>
              
              {participantData.kit && (
                <div className="alert alert-warning">
                  ⚠️ Kit already provided to this participant!
                </div>
              )}

              {!participantData.verified && (
                <div className="alert alert-error">
                  ❌ User not verified. Cannot provide kit until verification is complete.
                </div>
              )}

              {!participantData.generalFeePaid && (
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
                  <span className="detail-label">Unique ID:</span>
                  <span className="detail-value">{participantData.uniqueId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{participantData.email}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{participantData.phone}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">College:</span>
                  <span className="detail-value">{participantData.college}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{participantData.department}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Year:</span>
                  <span className="detail-value">{participantData.year}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Verification Status:</span>
                  <span className={participantData.verified ? 'status-paid' : 'status-unpaid'}>
                    {participantData.verified ? 'Verified ✓' : 'Not Verified ✗'}
                  </span>
                </div>

                {participantData.verificationUrl && (
                  <div className="detail-row">
                    <span className="detail-label">Verification Document:</span>
                    <a 
                      href={participantData.verificationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="detail-value"
                      style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
                    >
                      View Document 🔗
                    </a>
                  </div>
                )}

                <div className="detail-row">
                  <span className="detail-label">Payment Status:</span>
                  <span className={participantData.generalFeePaid ? 'status-paid' : 'status-unpaid'}>
                    {participantData.generalFeePaid ? 'Paid ✓' : 'Not Paid ✗'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Workshop Fee:</span>
                  <span className={participantData.workshopFeePaid ? 'status-paid' : 'status-unpaid'}>
                    {participantData.workshopFeePaid ? 'Paid ✓' : 'Not Paid ✗'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Kit Status:</span>
                  <span className={participantData.kit ? 'status-paid' : 'status-unpaid'}>
                    {participantData.kit ? 'Already Provided ✓' : 'Not Provided'}
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
