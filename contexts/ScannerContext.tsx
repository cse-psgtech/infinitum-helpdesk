'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

type DeskSession = { deskId: string; signature: string } | null;

interface ScannerContextType {
  scannerMode: boolean;
  deskSession: DeskSession;
  scannerConnected: boolean;
  socket: Socket | null;
  enableScannerMode: () => Promise<void>;
  disableScannerMode: () => void;
  scannedId: string;
  setScannedId: React.Dispatch<React.SetStateAction<string>>;
}

const ScannerContext = createContext<ScannerContextType | null>(null);

export const ScannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scannerMode, setScannerMode] = useState(false);
  const [deskSession, setDeskSession] = useState<DeskSession>(null);
  const [scannerConnected, setScannerConnected] = useState(false);
  const [scannedId, setScannedId] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const connectSocket = (session: { deskId: string; signature: string }) => {
    const socketUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}`
      : 'http://localhost:4000';

    const socket = io(socketUrl, { 
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;
    socket.emit('join-desk', session);

    socket.off('desk-joined').on('desk-joined', () => {
      toast.success('Scanner mode enabled');
    });

    socket.off('scanner-connected').on('scanner-connected', () => {
      setScannerConnected(true);
      toast.success('Mobile scanner connected');
    });

    socket.off('scanner-disconnected').on('scanner-disconnected', () => {
      setScannerConnected(false);
      toast('Mobile scanner disconnected', { icon: '⚠️' });
    });
    
    // Listen for scanned participant IDs
    socket.off('scan-acknowledged').on('scan-acknowledged', ({ uniqueId }: { uniqueId: string }) => {
      const fourDigit = uniqueId.replace('INF', '');
      setScannedId(fourDigit);
      toast.success(`Scanned: ${uniqueId}`);
    });

    socket.off('error').on('error', ({ message }: { message: string }) => {
      toast.error(message);
    });
  };

  const enableScannerMode = async () => {
    try {
      const response = await fetch('/api/desk/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create desk session');
      }

      const data = await response.json();
      const { deskId, signature } = data;

      const session = { deskId, signature };
      setDeskSession(session);
      setScannerMode(true);

      // Persist session in localStorage
      localStorage.setItem('scannerSession', JSON.stringify(session));

      connectSocket(session);
    } catch (error: any) {
      console.error('Error enabling scanner mode:', error);
      toast.error('Failed to enable scanner mode');
    }
  };

  const disableScannerMode = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setScannerMode(false);
    setDeskSession(null);
    setScannerConnected(false);

    // Clear localStorage
    localStorage.removeItem('scannerSession');

    toast.success('Scanner mode disabled');
  };

  // Restore session on refresh
  useEffect(() => {
    const saved = localStorage.getItem('scannerSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDeskSession(parsed);
        setScannerMode(true);
        connectSocket(parsed);
      } catch (error) {
        console.error('Error restoring scanner session:', error);
        localStorage.removeItem('scannerSession');
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <ScannerContext.Provider
      value={{
        scannerMode,
        deskSession,
        scannerConnected,
        socket: socketRef.current,
        enableScannerMode,
        disableScannerMode,
        scannedId,
        setScannedId
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const ctx = useContext(ScannerContext);
  if (!ctx) {
    throw new Error('useScanner must be used within ScannerProvider');
  }
  return ctx;
};

export default ScannerContext;
