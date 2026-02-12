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

  const handleRefresh = () => {
    setShowQR(false);
    setQrUrl('');
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0E1E 0%, #1A1829 50%, #2D1B3D 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float1 6s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.12) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float2 8s ease-in-out infinite'
      }}></div>

      {/* Background Logo */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.08,
        zIndex: 0
      }}>
        <img 
          src="/logo.png" 
          alt="Background" 
          style={{
            height: '600px',
            width: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))'
          }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Main Content Container */}
      <div style={{
        textAlign: 'center',
        zIndex: 1,
        maxWidth: '900px',
        animation: 'slideIn 0.8s ease-out'
      }}>
        {/* Portal Name */}
        <div style={{
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '88px',
            fontWeight: '900',
            color: '#FFFFFF',
            margin: '0 0 20px 0',
            letterSpacing: '3px',
            textShadow: `
              0 0 30px rgba(139, 92, 246, 0.4),
              0 0 60px rgba(139, 92, 246, 0.2),
              0 4px 20px rgba(0, 0, 0, 0.5)
            `,
            animation: 'glow 3s ease-in-out infinite',
            fontFamily: 'Georgia, serif'
          }}>
            HelpDesk
          </h1>
          
          {/* Decorative Line */}
          <div style={{
            height: '3px',
            width: '140px',
            background: 'linear-gradient(90deg, transparent, #8B5CF6, #A78BFA, transparent)',
            margin: '20px auto 30px',
            borderRadius: '2px',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)'
          }}></div>

          <h2 style={{
            fontSize: '52px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #B8A8D8 0%, #A78BFA 50%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0',
            letterSpacing: '2px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.8s ease-out 0.2s both'
          }}>
            INFINITUM '25
          </h2>
        </div>

        {/* Welcome Message */}
        <div style={{
          marginTop: '50px',
          animation: 'fadeIn 1s ease-out 0.4s both'
        }}>
          <p style={{
            fontSize: '28px',
            color: '#E0E0E0',
            fontWeight: '500',
            margin: '0',
            letterSpacing: '1px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}>
            Welcome <span style={{
              color: '#A78BFA',
              fontWeight: '700',
              textShadow: `
                0 0 15px rgba(139, 92, 246, 0.3),
                0 0 30px rgba(139, 92, 246, 0.2)
              `
            }}>👋 {username}</span>!
          </p>
        </div>
      </div>

      {/* QR Code Section */}
      {showQR && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1A1829 0%, #2D1B3D 100%)',
            padding: '50px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: `
              0 25px 50px rgba(0, 0, 0, 0.5),
              0 0 40px rgba(139, 92, 246, 0.2)
            `,
            maxWidth: '450px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            animation: 'slideUp 0.4s ease-out'
          }}>
            <h3 style={{
              fontSize: '32px',
              color: '#FFFFFF',
              marginBottom: '10px',
              fontWeight: '700'
            }}>
              Scan to Pay
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#B0B0B0',
              marginBottom: '30px',
              fontWeight: '500'
            }}>
              Please wait 😂
            </p>
            <div style={{
              marginBottom: '30px',
              display: 'flex',
              justifyContent: 'center',
              padding: '20px',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              {qrUrl ? (
                <img src={qrUrl} alt="Payment QR Code" style={{ width: 200, height: 200, borderRadius: '8px' }} />
              ) : (
                <div style={{ width: 200, height: 200, background: '#2A2839', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: '#666' }}>
                  QR Code
                </div>
              )}
            </div>
            <button 
              onClick={handleRefresh}
              style={{
                padding: '14px 40px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
                letterSpacing: '1px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 30px rgba(139, 92, 246, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3)';
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes glow {
          0%, 100% {
            text-shadow: 
              0 0 20px rgba(139, 92, 246, 0.4),
              0 0 40px rgba(139, 92, 246, 0.2),
              0 4px 20px rgba(0, 0, 0, 0.5);
          }
          50% {
            text-shadow: 
              0 0 30px rgba(139, 92, 246, 0.6),
              0 0 60px rgba(139, 92, 246, 0.3),
              0 4px 20px rgba(0, 0, 0, 0.5);
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);
          }
          50% {
            box-shadow: 0 0 25px rgba(16, 185, 129, 1);
          }
        }

        @keyframes float1 {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(30px);
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
}
