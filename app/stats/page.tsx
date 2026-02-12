'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  uniqueId: string;
  email: string;
  name: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: number;
  kit: boolean;
}

interface StatsResponse {
  count: number;
  users: User[];
}

export default function Stats() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<StatsResponse | null>(null);
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

  // Fetch stats
  useEffect(() => {
    if (!authChecking) {
      fetchStats();
    }
  }, [authChecking]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiKey) {
        setError('API key not configured');
        setLoading(false);
        return;
      }

      const response = await axios.get<StatsResponse>(
        `${apiUrl}/inf/api/auth/admin/users/kit`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      
      if (err.response) {
        setError(`Error: ${err.response.data?.message || 'Failed to fetch stats'}`);
      } else {
        setError('Network error. Please try again.');
      }
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
      {/* Header with Back Button */}
      <div style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
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

        <button
          onClick={fetchStats}
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '10px',
            border: 'none',
            background: loading ? '#9CA3AF' : 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = 'white';
            }
          }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Stats Summary Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          marginBottom: '20px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: '8px'
          }}>
            ID card Distribution Statistics
          </h1>
          
          {loading && (
            <div style={{
              color: '#667eea',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Loading statistics...
            </div>
          )}

          {error && (
            <div style={{
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: '600',
              padding: '12px',
              background: '#FEF2F2',
              borderRadius: '8px',
              border: '1px solid #EF4444'
            }}>
              {error}
            </div>
          )}

          {stats && !loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '20px 40px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: 'white'
                }}>
                  {stats.count}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  ID card's Distributed
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users List */}
        {stats && stats.users.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '20px'
            }}>
              Users with ID cards
            </h2>

            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '2px solid #E5E7EB'
                  }}>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>ID</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Name</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Email</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Phone</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>College</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Department</th>
                    <th style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map((user, index) => (
                    <tr key={user.uniqueId} style={{
                      borderBottom: '1px solid #E5E7EB',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}>
                      <td style={{
                        padding: '16px 12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#667eea'
                      }}>{user.uniqueId}</td>
                      <td style={{
                        padding: '16px 12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1F2937'
                      }}>{user.name}</td>
                      <td style={{
                        padding: '16px 12px',
                        fontSize: '14px',
                        color: '#6B7280',
                        wordBreak: 'break-word',
                        maxWidth: '200px'
                      }}>{user.email}</td>
                      <td style={{
                        padding: '16px 12px',
                        fontSize: '14px',
                        color: '#6B7280'
                      }}>{user.phone || 'N/A'}</td>
                      <td style={{
                        padding: '16px 12px',
                        fontSize: '14px',
                        color: '#6B7280',
                        maxWidth: '200px'
                      }}>{user.college || 'N/A'}</td>
                      <td style={{
                        padding: '16px 12px',
                        fontSize: '14px',
                        color: '#6B7280'
                      }}>{user.department || 'N/A'}</td>
                      <td style={{
                        padding: '16px 12px',
                        fontSize: '14px',
                        color: '#6B7280'
                      }}>{user.year || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stats && stats.users.length === 0 && !loading && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '80px 40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '12px'
            }}>
              No ID cards Distributed Yet
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#6B7280'
            }}>
              ID card distribution records will appear here once ID cards are provided to participants.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
