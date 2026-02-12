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
          
          // Extract participant ID (last 4 digits)
          const match = decodedText.match(/\d{4}$/);
          if (match) {
            const participantId = `INFIN${match[0]}`;
            await sendToLaptop(participantId);
            // STOP camera after successful scan
            await qrCode.stop();
            setScanning(false);
            setSuccess(`✓ Sent ${participantId}! Check your laptop.`);
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
        setSuccess(`Scanned ${participantId}! Check your laptop.`);
      } else {
        setError(data.message || 'Failed to send scan data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          color: '#1a1a1a',
          marginBottom: '24px',
          fontSize: '28px',
          textAlign: 'center',
          fontFamily: "'Playfair Display', serif"
        }}>
          Infinitum Scanner
        </h1>

        {error && (
          <div style={{
            background: '#FEE',
            color: '#C00',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#E7F7EF',
            color: '#0A6',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            ✓ {success}
          </div>
        )}

        {scanning && !success && (
          <>
            <p style={{
              color: '#666',
              marginBottom: '20px',
              textAlign: 'center',
              fontSize: '16px'
            }}>
              Point camera at participant's QR code
            </p>
            <div id="mobile-qr-reader" style={{
              border: '3px solid #667eea',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '20px'
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
              cursor: 'pointer'
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
              cursor: 'pointer'
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
