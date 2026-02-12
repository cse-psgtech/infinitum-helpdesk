'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { KitStatistics, ParticipantListItem } from '@/types';

export default function KitList() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<KitStatistics | null>(null);
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'provided' | 'pending'>('all');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch data on mount only once
    fetchKitData();
  }, [router]);

  const fetchKitData = async () => {
    setLoading(true);
    setError('');

    try {
      let statsData = null;
      let listData = null;

      // Fetch statistics with timeout
      try {
        const statsResponse = await Promise.race([
          fetch('/api/kits/statistics', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Statistics request timeout')), 10000)
          )
        ]) as Response;

        if (statsResponse && statsResponse.ok) {
          statsData = await statsResponse.json();
          setStatistics(statsData);
        } else if (statsResponse) {
          console.error('Statistics response error:', statsResponse.status);
          setError(`Failed to load statistics (${statsResponse.status})`);
        }
      } catch (statsErr) {
        console.error('Statistics fetch error:', statsErr);
        // Don't fail completely, continue to fetch list
      }

      // Fetch participants list with timeout
      try {
        const listResponse = await Promise.race([
          fetch('/api/kits/list', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('List request timeout')), 10000)
          )
        ]) as Response;

        if (listResponse && listResponse.ok) {
          listData = await listResponse.json();
          setParticipants(listData.participants || []);
        } else if (listResponse) {
          console.error('List response error:', listResponse.status);
          setError(`Failed to load participants (${listResponse.status})`);
        }
      } catch (listErr) {
        console.error('List fetch error:', listErr);
        setError('Failed to load participants list. Please refresh.');
      }

      // If both failed, show error
      if (!statsData && (!listData || listData.participants?.length === 0)) {
        if (!error) {
          setError('Unable to load kit data. Please check your connection and try again.');
        }
      }

    } catch (err) {
      setError('Failed to load kit data. Please try again.');
      console.error('Fetch kit data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchKitData();
  };

  // Filter participants based on selection
  const filteredParticipants = participants.filter((p) => {
    if (filter === 'provided') return p.kit_provided === true;
    if (filter === 'pending') return p.kit_provided === false;
    return true;
  });

  const stats = statistics?.data;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Kit Tracking & Statistics</h1>
      </div>

      <div className="page-content">
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
            color: '#991B1B',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #FCA5A5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <span style={{ fontWeight: '600', fontSize: '16px' }}>⚠️ {error}</span>
            <button 
              onClick={handleRefresh}
              style={{
                background: '#DC2626',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '24px'
          }}>
            <div className="spinner" style={{
              width: '50px',
              height: '50px',
              border: '4px solid #667eea',
              borderTop: '4px solid #764ba2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>Loading kit data...</p>
              <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>This may take a few moments</p>
            </div>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (!error && participants.length === 0 && !statistics) ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#F9FAFB',
            borderRadius: '12px'
          }}>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>No data available</p>
            <button 
              onClick={handleRefresh}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              🔄 Load Data
            </button>
          </div>
        ) : (
          <>
            {stats && (
              <section style={{ marginBottom: '32px' }}>
                <h2 className="section-title">Distribution Summary</h2>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="stat-card" style={{ background: '#E3F2FD', padding: '20px', borderRadius: '12px' }}>
                    <div className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976D2' }}>{stats.summary.total_registered}</div>
                    <div className="stat-label" style={{ fontSize: '14px', color: '#1976D2', marginTop: '8px' }}>Total Registered</div>
                  </div>

                  <div className="stat-card" style={{ background: '#C8E6C9', padding: '20px', borderRadius: '12px' }}>
                    <div className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#388E3C' }}>{stats.summary.total_kits_provided}</div>
                    <div className="stat-label" style={{ fontSize: '14px', color: '#388E3C', marginTop: '8px' }}>Kits Provided</div>
                  </div>

                  <div className="stat-card" style={{ background: '#FFF3CD', padding: '20px', borderRadius: '12px' }}>
                    <div className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#F57F17' }}>{stats.summary.pending_kits}</div>
                    <div className="stat-label" style={{ fontSize: '14px', color: '#F57F17', marginTop: '8px' }}>Pending Kits</div>
                  </div>

                  <div className="stat-card" style={{ background: '#F3E5F5', padding: '20px', borderRadius: '12px' }}>
                    <div className="stat-value" style={{ fontSize: '32px', fontWeight: 'bold', color: '#7B1FA2' }}>{stats.summary.percentage_provided}%</div>
                    <div className="stat-label" style={{ fontSize: '14px', color: '#7B1FA2', marginTop: '8px' }}>Completion Rate</div>
                  </div>
                </div>
              </section>
            )}

            {/* Kit Type Statistics */}
            {stats && (
              <section style={{ marginBottom: '32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '32px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)' }}>
                <h2 className="section-title" style={{ color: 'white', marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>📦 Kit Types - Distribution Status</h2>
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '24px', borderRadius: '14px', border: '2px solid #667EEA', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#667EEA', marginBottom: '16px', borderBottom: '2px solid #667EEA', paddingBottom: '12px' }}>Workshop + General</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555', fontWeight: '600' }}>Registered:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '22px', color: '#667EEA' }}>{stats.registered.workshop_and_general}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555', fontWeight: '600' }}>Provided:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '22px', color: '#10B981', background: '#D1FAE5', padding: '4px 12px', borderRadius: '8px' }}>{stats.kits_provided.workshop_and_general}</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '24px', borderRadius: '14px', border: '2px solid #667EEA', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#667EEA', marginBottom: '16px', borderBottom: '2px solid #667EEA', paddingBottom: '12px' }}>Workshop Only</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555', fontWeight: '600' }}>Registered:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '22px', color: '#667EEA' }}>{stats.registered.workshop_only}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555', fontWeight: '600' }}>Provided:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '22px', color: '#10B981', background: '#D1FAE5', padding: '4px 12px', borderRadius: '8px' }}>{stats.kits_provided.workshop_only}</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '24px', borderRadius: '14px', border: '2px solid #667EEA', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#667EEA', marginBottom: '16px', borderBottom: '2px solid #667EEA', paddingBottom: '12px' }}>General Only</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555', fontWeight: '600' }}>Registered:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '22px', color: '#667EEA' }}>{stats.registered.general_only}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', color: '#555', fontWeight: '600' }}>Provided:</span>
                      <span style={{ fontWeight: 'bold', fontSize: '22px', color: '#10B981', background: '#D1FAE5', padding: '4px 12px', borderRadius: '8px' }}>{stats.kits_provided.general_only}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Participants Table Section */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>All Registered Participants</h2>
                <button className="btn btn-secondary" onClick={handleRefresh} style={{ width: 'auto', padding: '8px 16px' }}>
                  🔄 Refresh
                </button>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilter('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: filter === 'all' ? '#1976D2' : '#E0E0E0',
                    color: filter === 'all' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontWeight: filter === 'all' ? '600' : '400',
                    fontSize: '14px'
                  }}
                >
                  All ({participants.length})
                </button>
                <button
                  onClick={() => setFilter('provided')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: filter === 'provided' ? '#388E3C' : '#E0E0E0',
                    color: filter === 'provided' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontWeight: filter === 'provided' ? '600' : '400',
                    fontSize: '14px'
                  }}
                >
                  Kits Provided ({participants.filter(p => p.kit_provided).length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: filter === 'pending' ? '#F57F17' : '#E0E0E0',
                    color: filter === 'pending' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontWeight: filter === 'pending' ? '600' : '400',
                    fontSize: '14px'
                  }}
                >
                  Pending ({participants.filter(p => !p.kit_provided).length})
                </button>
              </div>

              {filteredParticipants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)', background: '#F5F5F5', borderRadius: '12px' }}>
                  <p>No participants found for this filter.</p>
                </div>
              ) : (
                <div className="table-container" style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F5F5F5', borderBottom: '2px solid #E0E0E0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Sr. No.</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Made ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>College</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Kit Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.map((participant, index) => (
                        <tr key={`${participant.made_id}-${index}`} style={{ borderBottom: '1px solid #E0E0E0', transition: 'background 0.2s' }}>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{index + 1}</td>
                          <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#1976D2' }}>{participant.made_id}</td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{participant.name}</td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{participant.college}</td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            <span style={{
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: participant.kit_type === 'Workshop + General' ? '#E3F2FD' :
                                           participant.kit_type === 'Workshop Only' ? '#F3E5F5' : '#FFF3CD',
                              color: participant.kit_type === 'Workshop + General' ? '#1976D2' :
                                     participant.kit_type === 'Workshop Only' ? '#7B1FA2' : '#F57F17',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                              textAlign: 'center',
                            }}>
                              {participant.kit_type}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            <div style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '700',
                              textAlign: 'center',
                              background: participant.kit_provided ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                              color: 'white',
                              boxShadow: participant.kit_provided ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(245, 158, 11, 0.3)',
                              border: 'none',
                              cursor: 'default'
                            }}>
                              {participant.kit_provided ? '✓ DISTRIBUTED' : '⏳ PENDING'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => router.push('/')}
            style={{ maxWidth: '200px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
