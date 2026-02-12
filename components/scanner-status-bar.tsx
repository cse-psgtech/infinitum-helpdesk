'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function ScannerStatusBar() {
  const pathname = usePathname();
  const [scannerMode, setScannerMode] = useState(false);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [sessionDisconnected, setSessionDisconnected] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      const savedScannerMode = sessionStorage.getItem('scannerMode');
      const savedPhoneConnected = sessionStorage.getItem('phoneConnected');
      const savedLastScanTime = sessionStorage.getItem('lastScanTime');

      setScannerMode(savedScannerMode === 'true');
      
      // If no scanner mode active, all offline
      if (savedScannerMode !== 'true') {
        setPhoneConnected(false);
        setSessionDisconnected(false);
        return;
      }

      // Check for explicit disconnect flag - show disconnected immediately
      if (savedPhoneConnected === 'false') {
        setPhoneConnected(false);
        setSessionDisconnected(true);
        return;
      }
      
      // Must have lastScanTime to be considered connected
      if (!savedLastScanTime) {
        setPhoneConnected(false);
        setSessionDisconnected(false);
        return;
      }

      const lastTime = new Date(savedLastScanTime);
      setLastScanTime(lastTime);
      
      // Check if disconnected (no scan in last 30 seconds = 30000ms)
      const timeSinceLastScan = Date.now() - lastTime.getTime();
      const isDisconnected = timeSinceLastScan > 30000;
      
      // Show connected status when phoneConnected is true
      if (savedPhoneConnected === 'true') {
        setPhoneConnected(true);
        setSessionDisconnected(false);
      } else if (isDisconnected) {
        // Show disconnected when no recent activity
        setPhoneConnected(false);
        setSessionDisconnected(true);
      }
    };

    // Check on mount
    checkStatus();

    // Listen for storage changes (real-time updates) - respond immediately
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'phoneConnected' || e.key === 'lastScanTime' || e.key === 'scannerMode') {
        checkStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll every 500ms for faster disconnection detection
    const interval = setInterval(checkStatus, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Don't show on login page or if scanner not active
  const shouldShowScanner = pathname && pathname !== '/login';
  
  if (!shouldShowScanner || !scannerMode) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        background: phoneConnected
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
          : sessionDisconnected
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '320px'
      }}
    >
      <span style={{ fontSize: '18px', minWidth: '24px' }}>
        {phoneConnected ? '📱' : sessionDisconnected ? '⚠️' : '📡'}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, color: 'white', fontWeight: '600', fontSize: '13px' }}>
          {phoneConnected
            ? 'Phone Connected'
            : sessionDisconnected
            ? 'Disconnected'
            : 'Waiting...'}
        </p>
        {lastScanTime && phoneConnected && (
          <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
            {lastScanTime.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
