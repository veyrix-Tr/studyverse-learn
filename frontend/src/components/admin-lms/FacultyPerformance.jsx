import { useState, useEffect } from 'react';

const Tile = ({ n, label, gold }) => (
  <div className="pf-tile">
    <div className={`pf-n${gold ? ' gold' : ''}`}>{n}</div>
    <div className="pf-l">{label}</div>
  </div>
);

const Section = ({ title, hint, children }) => (
  <div className="pf-sec">
    <div className="pf-h">
      {title}
      {hint && <span className="pf-hint">{hint}</span>}
    </div>
    {children}
  </div>
);

const FacultyPerformance = ({ faculty, adminId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!faculty || !adminId) return;

    const token = localStorage.getItem('token');
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/${adminId}/faculty/${faculty.id}/performance`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          throw new Error(response.status === 403 ? 'You do not have access to this' : `HTTP ${response.status}`);
        }

        setData(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [faculty, adminId]);

  if (!faculty) return null;

  const cls = data?.classActivity || {};
  const stu = data?.studentActivity || {};
  const hw = data?.homeworkActivity || {};
  const res = data?.resourceActivity || {};
  const rep = data?.reportActivity || {};
  const ta = data?.timeAnalytics || {};

  const periodRows = [
    { label: 'This week', key: 'week' },
    { label: 'This month', key: 'month' },
    { label: 'This year', key: 'year' },
  ];

  return (
    <div className="pf-overlay" onClick={onClose}>
      <div className="pf-panel" onClick={e => e.stopPropagation()}>
        <div className="pf-head">
          <div>
            <div className="pf-name">{faculty.name}</div>
            <div className="pf-meta">
              {[faculty.subject, faculty.department, faculty.email].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button className="pf-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="pf-body">
          {loading && <div className="pf-state">Loading performance data…</div>}
          {error && <div className="pf-state bad">Could not load performance: {error}</div>}

          {data && !loading && !error && (
            <>
              <Section title="Class activity">
                <div className="pf-grid">
                  <Tile n={cls.thisWeek || 0} label="This week" gold />
                  <Tile n={cls.thisMonth || 0} label="This month" />
                  <Tile n={cls.thisYear || 0} label="This year" />
                  <Tile n={cls.conducted || 0} label="Classes conducted" />
                  <Tile n={cls.upcoming || 0} label="Upcoming" />
                  <Tile n={cls.total || 0} label="Total sessions" />
                </div>
              </Section>

              <Section title="Student activity">
                <div className="pf-grid">
                  <Tile n={stu.assigned || 0} label="Students assigned" gold />
                  <Tile n={stu.active || 0} label="Active students" />
                  <Tile n={stu.pendingDoubts || 0} label="Pending doubts" />
                  <Tile n={stu.resolvedDoubts || 0} label="Doubts resolved" />
                  <Tile n={stu.totalDoubts || 0} label="Total doubts" />
                </div>
              </Section>

              <Section title="Homework / assignment activity">
                <div className="pf-grid">
                  <Tile n={hw.assignmentsGiven || 0} label="Assignments given" gold />
                  <Tile n={hw.homeworkGiven || 0} label="Homework given" />
                  <Tile n={hw.studentsReceived || 0} label="Students who received" />
                  <Tile n={hw.byPeriod?.week || 0} label="Given this week" />
                  <Tile n={hw.byPeriod?.month || 0} label="Given this month" />
                  <Tile n={hw.byPeriod?.year || 0} label="Given this year" />
                </div>
              </Section>

              <Section title="Resource activity" hint="most recent uploads and who received them">
                <div className="pf-grid">
                  <Tile n={res.uploaded || 0} label="Resources uploaded" gold />
                  <Tile n={res.notesShared || 0} label="Notes shared" />
                  <Tile n={res.handoutsShared || 0} label="Handouts shared" />
                  <Tile n={res.approved || 0} label="Approved" />
                  <Tile n={res.pending || 0} label="Pending approval" />
                </div>

                <div className="pf-list">
                  {(res.recent || []).length === 0 && <div className="pf-state">No uploads yet.</div>}
                  {(res.recent || []).map(r => (
                    <div className="pf-res" key={r.id}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="pf-res-t">{r.title}</div>
                        <div className="pf-res-m">
                          {r.type} · {r.subject} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="pf-rcp">
                          {r.targeted
                            ? <>Sent to <b>{(r.recipients || []).join(', ') || '—'}</b></>
                            : <span className="pf-rcp-b">Grade-wide — all eligible students</span>}
                        </div>
                      </div>
                      <span className={`pf-status${r.status === 'approved' ? ' ok' : ''}`}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Time analytics" hint="weekly · monthly · yearly">
                <div className="pf-tbl-wrap">
                  <table className="pf-table">
                    <thead>
                      <tr><th>Period</th><th>Classes</th><th>Resources</th><th>Doubts</th><th>Reports</th></tr>
                    </thead>
                    <tbody>
                      {periodRows.map(row => (
                        <tr key={row.key}>
                          <td>{row.label}</td>
                          <td>{ta.classes?.[row.key] || 0}</td>
                          <td>{ta.resources?.[row.key] || 0}</td>
                          <td>{ta.doubts?.[row.key] || 0}</td>
                          <td>{ta.reports?.[row.key] || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>

              <Section title="Weekly reports">
                <div className="pf-grid">
                  <Tile n={rep.total || 0} label="Reports total" />
                  <Tile n={rep.sent || 0} label="Sent to parents" gold />
                  <Tile n={rep.avgRating ? `${rep.avgRating}/5` : '—'} label="Average rating" />
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyPerformance;
