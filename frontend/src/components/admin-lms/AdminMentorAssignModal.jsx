import { useState, useMemo } from 'react';
import { Check, SearchX, UserRound } from 'lucide-react';
import Modal from '../common/Modal';
import './AssignModals.css';

const NEET_SUBJECTS = ['physics', 'chemistry', 'biology', 'zoology', 'botany'];
const OTHER_SUBJECTS = ['physics', 'chemistry', 'mathematics', 'maths', 'math'];

const AdminMentorAssignModal = ({ student, facultyList, onSave, onClose, saving }) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(student?.mentorId || null);
  const [filterSubject, setFilterSubject] = useState('all');

  const isNEET = (student?.examTarget || '').toLowerCase().includes('neet');

  const compatibleFaculty = useMemo(() => {
    if (!student) return [];
    const allowed = isNEET ? NEET_SUBJECTS : OTHER_SUBJECTS;
    return facultyList.filter(f => {
      const subs = (f.subjects || [f.subject]).filter(Boolean).map(x => x.toLowerCase());
      return subs.some(x => allowed.some(a => x.includes(a)));
    });
  }, [facultyList, student, isNEET]);

  const filtered = useMemo(() => {
    let list = compatibleFaculty;
    if (filterSubject !== 'all') {
      list = list.filter(f => {
        const subs = (f.subjects || [f.subject]).filter(Boolean).map(x => x.toLowerCase());
        return subs.some(x => x.includes(filterSubject));
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [compatibleFaculty, filterSubject, search]);

  if (!student) return null;

  const subjects = ['all', ...new Set(compatibleFaculty.flatMap(f => (f.subjects || [f.subject]).filter(Boolean)))];
  const currentMentor = facultyList.find(f => f.id === student.mentorId);
  const unchanged = selectedId === (student.mentorId || null);

  const barColor = (count) => (count >= 8 ? 'var(--red)' : count >= 5 ? 'var(--gold)' : 'var(--green)');

  return (
    <Modal
      onClose={onClose}
      eyebrow="Assign mentor"
      title={student.name}
      subtitle={`${student.examTarget || 'Exam not set'} · ${student.plan ? student.plan[0].toUpperCase() + student.plan.slice(1) : '—'} plan`}
      headerExtra={currentMentor ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px', marginTop: '14px', padding: '9px 13px',
          background: 'rgba(232,168,48,0.16)', border: '1px solid rgba(232,168,48,0.32)', borderRadius: '10px',
        }}>
          <span style={{
            display: 'grid', placeItems: 'center', width: '24px', height: '24px', borderRadius: '50%',
            background: 'rgba(232,168,48,0.26)', fontSize: '11px', fontWeight: 700, color: '#F5C842',
          }}>{currentMentor.name?.[0]}</span>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#F5C842' }}>Current mentor · {currentMentor.name}</span>
        </div>
      ) : null}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-gold"
            disabled={saving || unchanged}
            onClick={() => onSave(selectedId)}
          >
            {saving ? 'Saving…' : selectedId === null ? 'Remove Mentor' : 'Assign Mentor'}
          </button>
        </>
      )}
    >
      <input
        className="am-search"
        placeholder="Search faculty by name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="am-chips">
        {subjects.map(sub => (
          <button
            key={sub}
            className={`am-chip${filterSubject === sub ? ' on' : ''}`}
            onClick={() => setFilterSubject(sub)}
          >
            {sub === 'all' ? 'All subjects' : sub}
          </button>
        ))}
      </div>

      <div className="am-list" style={{ marginTop: '16px' }}>
        {filtered.length === 0 && (
          <div className="am-empty">
            <SearchX size={34} strokeWidth={1.6} />
            <strong>No faculty found</strong>
            <span>Try a different search or filter</span>
          </div>
        )}

        {filtered.length > 0 && (
          <button
            type="button"
            className={`am-card${selectedId === null ? ' on' : ''}`}
            onClick={() => setSelectedId(null)}
          >
            <span className="am-av"><UserRound size={19} strokeWidth={1.9} /></span>
            <span className="am-meta">
              <span className="am-name" style={{ color: 'var(--text3)', fontStyle: 'italic' }}>No mentor</span>
              <span className="am-sub">Remove the current assignment</span>
            </span>
            {selectedId === null && <Check className="am-check" size={19} strokeWidth={2.6} />}
          </button>
        )}

        {filtered.map((f, i) => {
          const sel = selectedId === f.id;
          const count = f.mentorStudentCount || 0;
          const pct = Math.min(count * 10, 100);
          const isCurrent = student.mentorId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className={`am-card${sel ? ' on' : ''}`}
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => setSelectedId(f.id)}
            >
              <span className="am-av">{f.name?.[0]}</span>
              <span className="am-meta">
                <span className="am-name">{f.name}</span>
                <span className="am-sub">
                  {(f.subjects || [f.subject]).filter(Boolean).join(' · ')}
                  {isCurrent && <span className="am-tag">Current</span>}
                </span>
                <span className="am-work" style={{ marginTop: '7px' }}>
                  <span className="am-bar">
                    <i style={{ width: `${pct}%`, background: barColor(count) }} />
                  </span>
                  <span className="am-count">{count}/10 mentees</span>
                </span>
              </span>
              {sel && <Check className="am-check" size={19} strokeWidth={2.6} />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
};

export default AdminMentorAssignModal;
