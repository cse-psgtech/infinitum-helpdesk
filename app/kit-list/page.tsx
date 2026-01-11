'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { KitStatistics, ParticipantListItem } from '@/types';

export default function KitList() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<KitStatistics>({
    workshop_and_general: 0,
    workshop_only: 0,
    general_only: 0
  });
  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch data on mount
    fetchKitData();
  }, [router]);

  const fetchKitData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch statistics
      // TODO: Replace with actual API endpoint
      const statsResponse = await fetch('/api/kits/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData);
      }

      // Fetch participants list
      // TODO: Replace with actual API endpoint
      const listResponse = await fetch('/api/kits/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        setParticipants(listData.participants || []);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Kit Tracking & Statistics</h1>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading kit data...</p>
          </div>
        ) : (
          <>
            {/* Statistics Section */}
            <section style={{ marginBottom: '32px' }}>
              <h2 className="section-title">Kit Distribution Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{statistics.workshop_and_general}</div>
                  <div className="stat-label">Workshop + General</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{statistics.workshop_only}</div>
                  <div className="stat-label">Workshop Only</div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{statistics.general_only}</div>
                  <div className="stat-label">General Only</div>
                </div>
              </div>
            </section>

            {/* Participants Table Section */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Participants Who Received Kits</h2>
                <button className="btn btn-secondary" onClick={handleRefresh} style={{ width: 'auto', padding: '8px 16px' }}>
                  🔄 Refresh
                </button>
              </div>

              {participants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                  <p>No kits have been distributed yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Serial Number</th>
                        <th>Participant ID</th>
                        <th>Name</th>
                        <th>College</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((participant, index) => (
                        <tr key={participant.participant_id || index}>
                          <td>{index + 1}</td>
                          <td>{participant.participant_id}</td>
                          <td>{participant.name}</td>
                          <td>{participant.college}</td>
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
