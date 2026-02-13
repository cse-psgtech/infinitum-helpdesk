'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Html5Qrcode } from 'html5-qrcode';
import toast, { Toaster } from 'react-hot-toast';

function ScannerContent() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Initializing...');

  const socketRef = useRef<Socket | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const connectedRef = useRef(false);
  const pausedRef = useRef(false);

  const deskId = searchParams.get('deskId');
  const signature = searchParams.get('signature');

  useEffect(() => {
    if (!deskId || !signature) {
      setStatusMessage('Invalid scanner link');
      toast.error('Invalid scanner link');
      return;
    }

    setStatusMessage('Connecting to desk...');

    const socketUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}`
      : 'http://localhost:4000';

    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;

    socket.emit('join-scanner', { deskId, signature });

    socket.on('scanner-joined', () => {
      setConnected(true);
      connectedRef.current = true;
      setStatusMessage('Connected! Ready to scan');
      toast.success('Connected to desk');
      setTimeout(() => {
        startScanner();
      }, 500);
    });

    socket.on('desk-disconnected', () => {
      setStatusMessage('Desk disconnected');
      toast.error('Desk disconnected');
    });

    socket.on('scan-acknowledged', ({ uniqueId }: { uniqueId: string }) => {
      setLastScanned(uniqueId);
      setPaused(true);
      pausedRef.current = true;
      stopScanner();
      setStatusMessage('Scan successful! Waiting...');
      toast.success(`Scanned: ${uniqueId}`);
    });

    socket.on('resume-scanning', () => {
      setPaused(false);
      pausedRef.current = false;
      setStatusMessage('Ready for next scan');
      startScanner();
    });

    const handleClearScan = () => {
      setLastScanned(null);
      setPaused(false);
      pausedRef.current = false;
      startScanner();
      toast.success('Cleared by desk');
      setStatusMessage('Ready for next scan');
    };
    socket.on('clear-scan', handleClearScan);

    socket.on('error', ({ message }: { message: string }) => {
      setStatusMessage(`Error: ${message}`);
      toast.error(message);
    });

    return () => {
      stopScanner();
      socket.off('clear-scan', handleClearScan);
      socket.disconnect();
    };
  }, [deskId, signature]);

  const startScanner = async () => {
    if (scannerRef.current) return;

    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permission.state === 'denied') {
          setStatusMessage('Camera permission denied');
          toast.error('Please allow camera access');
          return;
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        (decodedText) => {
          if (pausedRef.current || !socketRef.current || !connectedRef.current) return;

          try {
            const parsedData = JSON.parse(decodedText);
            if (parsedData.type === 'PARTICIPANT' && parsedData.uniqueId) {
              socketRef.current.emit('scan-participant', { uniqueId: parsedData.uniqueId });
              stopScanner();
            }
          } catch (error) {
            socketRef.current.emit('scan-participant', { uniqueId: decodedText.trim() });
            stopScanner();
          }
        },
        () => {}
      );

      setScanning(true);
      setStatusMessage('Camera active - scan QR code');
    } catch (error: any) {
      setStatusMessage('Camera failed to start');
      toast.error('Camera access denied or unavailable');

      // Try front camera fallback
      if (error.message?.includes('environment')) {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 280, height: 280 } },
            (decodedText) => {
              if (pausedRef.current || !socketRef.current || !connectedRef.current) return;

              try {
                const parsedData = JSON.parse(decodedText);
                if (parsedData.type === 'PARTICIPANT' && parsedData.uniqueId) {
                  socketRef.current.emit('scan-participant', { uniqueId: parsedData.uniqueId });
                }
              } catch (error) {
                socketRef.current.emit('scan-participant', { uniqueId: decodedText.trim() });
              }
            },
            () => {}
          );

          setScanning(true);
          setStatusMessage('Front camera active');
        } catch (fallbackError) {
          toast.error('Camera access denied');
        }
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      } finally {
        scannerRef.current = null;
      }
    }
    setScanning(false);
  };

  const clearScan = () => {
    setLastScanned(null);
    setPaused(false);
    pausedRef.current = false;

    if (socketRef.current) {
      socketRef.current.emit('clear-scan');
      setStatusMessage('Ready for next scan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <Toaster position="top-center" />

      <div className="max-w-lg mx-auto relative z-10 space-y-4">
        {/* Header Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-500/30">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 mb-4 text-center">
            QR Scanner
          </h1>

          {/* Connection Status */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className={`w-4 h-4 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-white font-medium">
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          {/* Status Message */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-center">
            <p className="text-purple-200 text-sm">{statusMessage}</p>
          </div>

          {/* Last Scanned */}
          {lastScanned && (
            <div className="space-y-3 mt-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
                <p className="text-orange-200 text-sm">Last scanned: {lastScanned}</p>
              </div>

              <button
                onClick={clearScan}
                className="w-full relative px-4 py-3 overflow-hidden rounded-xl text-white font-semibold tracking-wide shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 transition-all duration-300 group-hover:scale-105"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
                <div className="relative flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-sm">Clear & Scan Next</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Scanner Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-500/30">
          <div id="qr-reader" className="rounded-xl overflow-hidden mb-4 min-h-[280px] bg-gray-800/50"></div>

          {/* Scanner Controls */}
          {scanning && (
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-green-300">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Scanner Active</span>
                </div>
                <p className="text-green-200 text-sm mt-1">Point camera at QR code</p>
              </div>

              <button
                onClick={stopScanner}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all duration-200 active:scale-95"
              >
                Stop Scanner
              </button>
            </div>
          )}

          {/* Paused state controls */}
          {paused && !scanning && (
            <div className="space-y-3">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-orange-300 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold">Paused</span>
                </div>
                <p className="text-orange-200 text-sm">Waiting for desk to process...</p>
                <p className="text-orange-300 text-xs mt-1">Camera will restart automatically</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Instructions */}
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-purple-500/20">
          <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Use
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">1.</span>
              <span>Ensure good lighting for best results</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">2.</span>
              <span>Hold phone steady and point at QR code</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">3.</span>
              <span>Scanner pauses after each successful scan</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">4.</span>
              <span>Will auto-resume when desk is ready</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Scanner() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black flex items-center justify-center">
        <div className="text-white text-xl font-semibold">Loading scanner...</div>
      </div>
    }>
      <ScannerContent />
    </Suspense>
  );
}
