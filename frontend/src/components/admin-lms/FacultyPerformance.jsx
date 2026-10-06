import React, { useState, useEffect } from 'react';

const FacultyPerformance = ({ faculty, onClose }) => {
  console.log('FacultyPerformance component mounted, faculty:', faculty);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('useEffect triggered, faculty:', faculty);

    if (!faculty) return;

    const token = localStorage.getItem('token');
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching from:', `${import.meta.env.VITE_API_URL}/api/admin/faculty/${faculty.id}/performance`);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/faculty/${faculty.id}/performance`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('Data received:', result);
        setData(result);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [faculty]);

  if (!faculty) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 31, 61, 0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 500,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '600px',
          maxWidth: '96vw',
          background: '#FDF8F0',
          height: '100%',
          overflowY: 'auto',
          boxShadow: '-12px 0 48px rgba(15,31,61,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0F1F3D 0%, #1C2E50 100%)',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#FDF8F0' }}>
              {faculty.name}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(253,248,240,0.7)', marginTop: '4px' }}>
              {faculty.subject}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#FDF8F0',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8896B3' }}>
              Loading performance data...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#EF4444' }}>
              Error: {error}
            </div>
          )}

          {data && !loading && !error && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                  Class Activity
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#E8A830' }}>
                      {data.classActivity?.thisWeek || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      This Week
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.classActivity?.total || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Total Sessions
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.classActivity?.bySubject?.length || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Subjects
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                  Student Activity
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.studentActivity?.assigned || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Students Assigned
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.studentActivity?.active || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Active Students
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                  Resources
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.resourceActivity?.uploaded || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Uploaded
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.resourceActivity?.approved || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Approved
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                  Reports
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.reportActivity?.total || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Total Reports
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(15,31,61,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {data.reportActivity?.sent || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8896B3', marginTop: '4px' }}>
                      Sent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyPerformance;
