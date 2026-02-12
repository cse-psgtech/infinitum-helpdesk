'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '60px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px'
        }}>
          Infinitum Helpdesk
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6B7280',
          marginBottom: '48px'
        }}>
          Select an action to continue
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <button
            onClick={() => router.push('/provide-kit')}
            style={{
              padding: '32px 24px',
              fontSize: '18px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid #667eea',
              background: 'white',
              color: '#667eea',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }}
          >
            Provide Kit
          </button>

          <button
            onClick={() => router.push('/register-for-events')}
            style={{
              padding: '32px 24px',
              fontSize: '18px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid #667eea',
              background: 'white',
              color: '#667eea',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }}
          >
            Register for Events
          </button>

          <button
            onClick={() => router.push('/workshop-certificate')}
            style={{
              padding: '32px 24px',
              fontSize: '18px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid #667eea',
              background: 'white',
              color: '#667eea',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }}
          >
            Workshop Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
