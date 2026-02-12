'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Workshop {
  _id: string;
  workshopId: string;
  workshopName: string;
  hall?: string;
  date?: string;
  time?: string;
  description?: string;
  alteredFee?: number;
  actualFee?: number;
  earlyBirdActive?: boolean;
  closed?: boolean;
}

export default function WorkshopCertificate() {
  const router = useRouter();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('helpdeskauthenticated');
    if (!isAuthenticated) {
      router.push('/');
    } else {
      setAuthChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authChecking) {
      fetchWorkshops();
    }
  }, [authChecking]);

  const fetchWorkshops = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await axios.get(`${apiUrl}/inf/api/events/workshops`);
      
      if (response.data.success && response.data.workshops) {
        setWorkshops(response.data.workshops);
      }
    } catch (err) {
      console.error('Error fetching workshops:', err);
      setError('Failed to load workshops');
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Back Button - Top Left */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 20px'
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '10px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.color = '#667eea';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
        >
          ← Back to Home
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Workshop Certificates
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6B7280',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            Select a workshop to view participants and manage certificates
          </p>

          {loading && (
            <div style={{
              textAlign: 'center',
              color: '#667eea',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Loading workshops...
            </div>
          )}

          {error && (
            <div style={{
              textAlign: 'center',
              color: '#EF4444',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          {!loading && !error && workshops.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '16px',
              fontStyle: 'italic'
            }}>
              No workshops available
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {workshops.map((workshop) => (
              <button
                key={workshop.workshopId}
                onClick={() => router.push(`/workshop-certificate/${workshop.workshopId}`)}
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  border: '2px solid #E5E7EB',
                  background: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    {workshop.workshopId}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1F2937',
                  margin: 0
                }}>
                  {workshop.workshopName}
                </h3>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
