'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function GenerateQR() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(false);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (participantId.length >= 4) {
      setShowQR(true);
    }
  };

  const handleReset = () => {
    setParticipantId('');
    setParticipantName('');
    setShowQR(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const fullId = participantId.startsWith('INFIN') 
    ? participantId.toUpperCase() 
    : `INFIN${participantId}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Generate QR Code</h1>
      </div>

      <div className="page-content">
        {!showQR ? (
          <section>
            <h2 className="section-title">Enter Participant Details</h2>
            
            <form onSubmit={handleGenerate} style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="form-group">
                <label className="form-label">Participant ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter last 4 digits or full ID (e.g., 1234 or INFIN1234)"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Participant Name (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter participant name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                />
              </div>

              <div className="btn-group">
                <button type="submit" className="btn btn-primary">
                  Generate QR Code
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => router.push('/')}
                >
                  Back to Dashboard
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section>
            <div className="qr-display" style={{ textAlign: 'center' }}>
              <div style={{ 
                background: 'white', 
                padding: '40px', 
                borderRadius: '20px',
                maxWidth: '400px',
                margin: '0 auto',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ 
                  color: '#1a1a1a', 
                  marginBottom: '20px',
                  fontFamily: "'Playfair Display', serif"
                }}>
                  Infinitum 2026
                </h2>
                
                {participantName && (
                  <p style={{ 
                    color: '#666', 
                    fontSize: '18px',
                    marginBottom: '20px',
                    fontWeight: '600'
                  }}>
                    {participantName}
                  </p>
                )}

                <div style={{ 
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <QRCodeSVG 
                    value={fullId}
                    size={250}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#1a1a1a"
                  />
                </div>

                <p style={{ 
                  color: '#1a1a1a', 
                  fontSize: '24px',
                  fontWeight: '700',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '2px'
                }}>
                  {fullId}
                </p>

                <p style={{ 
                  color: '#666', 
                  fontSize: '14px',
                  marginTop: '20px'
                }}>
                  Scan this QR code at the entrance
                </p>
              </div>

              <div className="btn-group" style={{ marginTop: '32px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={handlePrint}
                >
                  Print QR Code
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={handleReset}
                >
                  Generate Another
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => router.push('/')}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .page-header,
          .btn-group,
          .page-content > :not(.qr-display) {
            display: none !important;
          }
          
          .qr-display {
            margin: 0;
            padding: 20px;
          }

          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
