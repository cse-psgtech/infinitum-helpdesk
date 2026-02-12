'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';

function MobileScannerContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [participantData, setParticipantData] = useState<any>(null);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session. Please scan the QR code again.');
      return;
    }

    // Prevent double initialization (React Strict Mode calls useEffect twice)
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Auto-start camera when page loads (only once)
    startScanner();

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []); // Empty dependency - run only once on mount

  const startScanner = async () => {
    try {
      setError('');
      setScanning(true);

      // Request camera permission explicitly before starting scanner
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch (permErr: any) {
        if (permErr.name === 'NotAllowedError') {
          setError('⚠️ Camera access denied. Please grant camera permission and try again.');
        } else if (permErr.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Cannot access camera. Check your browser settings.');
        }
        setScanning(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const qrCode = new Html5Qrcode('mobile-qr-reader');
      setHtml5QrCode(qrCode);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await qrCode.start(
        { facingMode: 'environment' }, // Back camera
        config,
        async (decodedText) => {
          console.log('Scanned:', decodedText);
          
          // Extract participant ID from QR code
          const participantId = decodedText.trim();
          
          if (participantId) {
            // Fetch participant details from API
            await fetchParticipantDetails(participantId);
            // STOP camera after successful scan
            await qrCode.stop();
            setScanning(false);
          } else {
            setError('Invalid QR code format');
            setTimeout(() => setError(''), 2000);
          }
        },
        (errorMessage) => {
          // Scanning but no QR detected yet
        }
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      
      // Check if it's a permission or security error
      if (err.name === 'NotAllowedError' || err.message?.includes('secure')) {
        setError('Camera blocked: Enable in chrome://flags - Add this site to "Insecure origins treated as secure"');
      } else {
        setError('Failed to start camera. Please allow camera permissions.');
      }
      setScanning(false);
    }
  };

  const fetchParticipantDetails = async (participantId: string) => {
    try {
      setError('');
      const response = await fetch(`/api/participant/${participantId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success && data.participant) {
        // Participant found - display details
        setParticipantData(data.participant);
        setSuccess(`✓ Participant Found!`);

        // Send scan data to the portal's session using participant_id
        if (sessionId) {
          try {
            await fetch('/api/scan-session', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: sessionId,
                participant_id: data.participant.participant_id, // Send the full participant_id (e.g., "INF1001")
              }),
            });
            console.log('Sent scan data to portal:', data.participant.participant_id);
          } catch (err) {
            console.error('Error sending to session:', err);
          }
        }
      } else {
        // Participant not found
        setError('❌ Participant Not Found! Please verify the QR code.');
        setParticipantData(null);
      }
    } catch (err) {
      console.error('Error fetching participant:', err);
      setError('Network error. Please try again.');
      setParticipantData(null);
    }
  };

  const sendToLaptop = async (participantId: string) => {
    try {
      const response = await fetch('/api/scan-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          participant_id: participantId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`✓ Sent to laptop! Check your device.`);
      } else {
        setError(data.message || 'Failed to send scan data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu"
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '28px',
        padding: '40px 28px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{
          color: '#1F2937',
          marginBottom: '28px',
          fontSize: '32px',
          textAlign: 'center',
          fontWeight: '700',
          fontFamily: "'Playfair Display', serif"
        }}>
          📱 Scanner
        </h1>

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            color: '#991B1B',
            padding: '16px',
            borderRadius: '14px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: '600',
            border: '1px solid #FCA5A5'
          }}>
            {error}
          </div>
        )}

        {success && participantData && (
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            color: '#065F46',
            padding: '24px',
            borderRadius: '16px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: '600',
            border: '1px solid #6EE7B7'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '16px', fontWeight: '700' }}>✓ Participant Found!</div>
            
            {/* Participant Details Card */}
            <div style={{
              background: 'white',
              border: '2px solid #10B981',
              borderRadius: '14px',
              padding: '18px',
              marginTop: '16px',
              textAlign: 'left',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ marginBottom: '14px' }}>
                <strong style={{ color: '#1F2937' }}>Name:</strong> 
                <span style={{ color: '#4B5563', marginLeft: '8px', fontWeight: '500' }}>{participantData.name}</span>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <strong style={{ color: '#1F2937' }}>Email:</strong> 
                <span style={{ color: '#4B5563', marginLeft: '8px', wordBreak: 'break-all', fontWeight: '500' }}>{participantData.email}</span>
              </div>
              {participantData.phone && (
                <div style={{ marginBottom: '14px' }}>
                  <strong style={{ color: '#1F2937' }}>Phone:</strong> 
                  <span style={{ color: '#4B5563', marginLeft: '8px', fontWeight: '500' }}>{participantData.phone}</span>
                </div>
              )}
              {participantData.college && (
                <div style={{ marginBottom: '14px' }}>
                  <strong style={{ color: '#1F2937' }}>College:</strong> 
                  <span style={{ color: '#4B5563', marginLeft: '8px', fontWeight: '500' }}>{participantData.college}</span>
                </div>
              )}
              {participantData.department && (
                <div style={{ marginBottom: '14px' }}>
                  <strong style={{ color: '#1F2937' }}>Department:</strong> 
                  <span style={{ color: '#4B5563', marginLeft: '8px', fontWeight: '500' }}>{participantData.department}</span>
                </div>
              )}
              {participantData.uniqueId && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #F0F4FF 0%, #E0E7FF 100%)',
                  padding: '12px',
                  borderRadius: '10px',
                  marginTop: '14px'
                }}>
                  <strong style={{ color: '#667EEA' }}>Participant ID:</strong> 
                  <span style={{ color: '#667EEA', marginLeft: '8px', fontWeight: '700', fontSize: '18px' }}>{participantData.uniqueId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {success && !participantData && (
          <div style={{
            background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            color: '#991B1B',
            padding: '16px',
            borderRadius: '14px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '600',
            border: '1px solid #FCA5A5'
          }}>
            ❌ Participant Not Found!
          </div>
        )}

        {scanning && !success && (
          <>
            <p style={{
              color: '#4B5563',
              marginBottom: '24px',
              textAlign: 'center',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              📷 Point camera at QR code
            </p>
            <div id="mobile-qr-reader" style={{
              border: '3px solid #667eea',
              borderRadius: '20px',
              overflow: 'hidden',
              marginBottom: '20px',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)'
            }}></div>
          </>
        )}

        {!scanning && !success && (
          <button
            onClick={startScanner}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            Start Scanner
          </button>
        )}

        {success && (
          <button
            onClick={async () => {
              setSuccess('');
              setParticipantData(null);
              // Reset session status for next scan
              await fetch('/api/scan-session', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session_id: sessionId,
                  status: 'waiting'
                })
              });
              startScanner();
            }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            Scan Another
          </button>
        )}
      </div>
    </div>
  );
}

export default function MobileScanner() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileScannerContent />
    </Suspense>
  );
}
