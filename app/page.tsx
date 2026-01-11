'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    setUsername(storedUsername || 'User');

    // Listen for QR code display events from other pages
    const handleQRDisplay = (event: any) => {
      if (event.detail && event.detail.url) {
        setQrUrl(event.detail.url);
        setShowQR(true);
      }
    };

    window.addEventListener('displayQR', handleQRDisplay);

    return () => {
      window.removeEventListener('displayQR', handleQRDisplay);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const handleRefresh = () => {
    setShowQR(false);
    setQrUrl('');
  };

  return (
    <div className="dashboard">
      {/* Welcome Message */}
      {username && (
        <div className="welcome-message">
          <span className="welcome-icon">✓</span>
          Welcome !
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="dashboard-logo"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="dashboard-title">
          <h1>HelpDesk</h1>
          <h2>Dashboard</h2>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          ⊖ Logout
        </button>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <div className="qr-section">
          <h3>Scan to pay</h3>
          <p>Please wait 😂</p>
          <div className="qr-code-container">
            {qrUrl ? (
              <img src={qrUrl} alt="Payment QR Code" style={{ width: 200, height: 200 }} />
            ) : (
              <div style={{ width: 200, height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                QR Code
              </div>
            )}
          </div>
          <button className="refresh-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
