'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';

interface Participant {
  uniqueId: string;
  name: string;
  email: string;
  certificateProvided: boolean;
  attended: boolean;
}

export default function WorkshopParticipants() {
  const router = useRouter();
  const params = useParams();
  const workshopId = params.workshopId as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingCertificate, setUpdatingCertificate] = useState<string | null>(null);
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
    if (workshopId && !authChecking) {
      fetchParticipants();
    }
  }, [workshopId, authChecking]);

  useEffect(() => {
    // Filter participants based on search query
    if (searchQuery.trim() === '') {
      setFilteredParticipants(participants);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = participants.filter(
        (p) =>
          p.uniqueId.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query)
      );
      setFilteredParticipants(filtered);
    }
  }, [searchQuery, participants]);

  const fetchParticipants = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiKey) {
        setError('API key not configured');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${apiUrl}/inf/api/events/helpdesk/workshops/${workshopId}/participants`,
        {
          headers: {
            'x-api-key': apiKey
          }
        }
      );

      if (response.data.success && response.data.participants) {
        setParticipants(response.data.participants);
        setFilteredParticipants(response.data.participants);
      }
    } catch (err: any) {
      console.error('Error fetching participants:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          setError('Workshop not found');
        } else {
          setError('Failed to load participants');
        }
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateProvided = async (uniqueId: string) => {
    setUpdatingCertificate(uniqueId);
    setError('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!apiKey) {
        setError('API key not configured');
        setUpdatingCertificate(null);
        return;
      }

      const response = await axios.patch(
        `${apiUrl}/inf/api/events/helpdesk/workshops/certificate`,
        {
          uniqueId: uniqueId,
          workshopId: workshopId
        },
        {
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update local state
        setParticipants((prev) =>
          prev.map((p) =>
            p.uniqueId === uniqueId ? { ...p, certificateProvided: true } : p
          )
        );
      }
    } catch (err: any) {
      console.error('Error updating certificate status:', err);
      
      if (err.response) {
        setError(`❌ ${err.response.data?.message || 'Failed to update certificate status'}`);
      } else {
        setError('❌ Network error. Please try again.');
      }
    } finally {
      setUpdatingCertificate(null);
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
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto 20px'
      }}>
        <button
          onClick={() => router.push('/workshop-certificate')}
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
          ← Back to Workshops
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: '8px'
          }}>
            Workshop {workshopId} - Participants
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginBottom: '24px'
          }}>
            Manage certificates for workshop participants
          </p>

          {/* Search Bar */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search by ID, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '16px',
                borderRadius: '10px',
                border: '2px solid #E5E7EB',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #EF4444',
              color: '#EF4444',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{
              textAlign: 'center',
              color: '#667eea',
              fontSize: '16px',
              fontWeight: '600',
              padding: '40px'
            }}>
              Loading participants...
            </div>
          )}

          {!loading && filteredParticipants.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '16px',
              fontStyle: 'italic',
              padding: '40px'
            }}>
              {searchQuery ? 'No participants found matching your search' : 'No participants registered for this workshop'}
            </div>
          )}

          {!loading && filteredParticipants.length > 0 && (
            <>
              <div style={{
                marginBottom: '16px',
                fontSize: '14px',
                color: '#6B7280',
                fontWeight: '600'
              }}>
                Showing {filteredParticipants.length} of {participants.length} participants
              </div>

              <div style={{
                overflowX: 'auto'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      background: '#F9FAFB',
                      borderBottom: '2px solid #E5E7EB'
                    }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#6B7280',
                        textTransform: 'uppercase'
                      }}>ID</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#6B7280',
                        textTransform: 'uppercase'
                      }}>Name</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#6B7280',
                        textTransform: 'uppercase'
                      }}>Email</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#6B7280',
                        textTransform: 'uppercase'
                      }}>Attended</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#6B7280',
                        textTransform: 'uppercase'
                      }}>Certificate</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#6B7280',
                        textTransform: 'uppercase'
                      }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((participant) => (
                      <tr
                        key={participant.uniqueId}
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F9FAFB';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <td style={{
                          padding: '16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#667eea'
                        }}>
                          {participant.uniqueId}
                        </td>
                        <td style={{
                          padding: '16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1F2937'
                        }}>
                          {participant.name}
                        </td>
                        <td style={{
                          padding: '16px',
                          fontSize: '14px',
                          color: '#6B7280'
                        }}>
                          {participant.email}
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            background: participant.attended ? '#ECFDF5' : '#FEF2F2',
                            color: participant.attended ? '#10B981' : '#EF4444'
                          }}>
                            {participant.attended ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            background: participant.certificateProvided ? '#ECFDF5' : '#FEF3C7',
                            color: participant.certificateProvided ? '#10B981' : '#F59E0B'
                          }}>
                            {participant.certificateProvided ? '✓ Provided' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <button
                            onClick={() => handleCertificateProvided(participant.uniqueId)}
                            disabled={!participant.attended || updatingCertificate === participant.uniqueId}
                            style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              borderRadius: '6px',
                              border: 'none',
                              background: !participant.attended
                                ? '#E5E7EB'
                                : updatingCertificate === participant.uniqueId
                                ? '#9CA3AF'
                                : participant.certificateProvided
                                ? '#10B981'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              cursor: !participant.attended ? 'not-allowed' : updatingCertificate === participant.uniqueId ? 'wait' : 'pointer',
                              transition: 'all 0.3s',
                              opacity: !participant.attended ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (participant.attended && updatingCertificate !== participant.uniqueId) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (participant.attended && updatingCertificate !== participant.uniqueId) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            {updatingCertificate === participant.uniqueId
                              ? '⏳ Updating...'
                              : participant.certificateProvided
                              ? '✓ Provided'
                              : '📜 Mark Provided'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
