'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function ScannerStatusBar() {
  const pathname = usePathname();
  const router = useRouter();
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
      setPhoneConnected(savedPhoneConnected === 'true');
      
      if (savedLastScanTime) {
        const lastTime = new Date(savedLastScanTime);
        setLastScanTime(lastTime);
        
        // Check if disconnected (no scan in last 2 minutes)
        const timeSinceLastScan = Date.now() - lastTime.getTime();
        setSessionDisconnected(timeSinceLastScan > 120000);
      }
    };

    // Check on mount and pathname change
    checkStatus();

    // Poll every 5 seconds to update status
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [pathname]);

  // Don't show on login page or if scanner not active
  if (pathname === '/login' || !scannerMode) {
    return null;
  }

  const handleGoToProvideKit = () => {
    router.push('/provide-kit');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: phoneConnected
          ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
          : sessionDisconnected
          ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)'
          : 'linear-gradient(90deg, rgba(124, 58, 237, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>
          {phoneConnected ? '📱' : sessionDisconnected ? '⚠️' : '📡'}
        </span>
        <div>
          <p style={{ margin: 0, color: 'white', fontWeight: '600', fontSize: '14px' }}>
            {phoneConnected
              ? 'Phone Connected - Scanner Active'
              : sessionDisconnected
              ? 'Phone Disconnected - Reconnect Required'
              : 'Scanner Mode Active - Waiting for phone...'}
          </p>
          {lastScanTime && phoneConnected && (
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
              Last scan: {lastScanTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      {pathname !== '/provide-kit' && (
        <button
          onClick={handleGoToProvideKit}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          View Scanner QR
        </button>
      )}
    </div>
  );
}
