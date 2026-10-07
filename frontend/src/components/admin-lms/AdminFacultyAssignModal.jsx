import { useState, useEffect, useMemo } from 'react';
import { Check, SearchX, UserRound, X } from 'lucide-react';
import Modal from '../common/Modal';
import { facultySubjects, teachesSubject, isActiveFaculty } from './facultyFilters';
import './AssignModals.css';

const NEET_SUBJECTS = ['Physics', 'Chemistry', 'Biology'];
const JEE_SUBJECTS = ['Physics', 'Chemistry', 'Maths'];

const AdminFacultyAssignModal = ({ student, facultyList, onSave, onClose, saving }) => {
  const [selections, setSelections] = useState({});
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('all');
  const [activeOnly, setActiveOnly] = useState(true);

  const isNEET = (student?.examTarget || '').toLowerCase().includes('neet');
  const subjectList = useMemo(() => (isNEET ? NEET_SUBJECTS : JEE_SUBJECTS), [isNEET]);

  const gradeOptions = useMemo(
    () => [...new Set(facultyList.flatMap(f => (f.grades || []).map(String)))].sort(),
    [facultyList]
  );

  // Every active, grade-eligible faculty — no other gate, so nobody can drop out
  // of a subject section because of a label mismatch.
  const facultyForSubject = useMemo(() => {
    const map = {};
    subjectList.forEach(subj => {
      map[subj] = facultyList.filter(f => {
        if (activeOnly && !isActiveFaculty(f)) return false;
        if (grade !== 'all' && !(f.grades || []).map(String).includes(String(grade))) return false;
        return teachesSubject(f, subj);
      });
    });
    return map;
  }, [facultyList, subjectList, grade, activeOnly]);

  useEffect(() => {
    if (student?.subjectFaculty) setSelections({ ...student.subjectFaculty });
  }, [student]);

  const hasChanges = useMemo(() => {
    const current = student?.subjectFaculty || {};
    const keys = new Set([...Object.keys(current), ...Object.keys(selections)]);
    for (const k of keys) {
      if ((current[k] || null) !== (selections[k] || null)) return true;
    }
    return false;
  }, [selections, student]);

  if (!student) return null;

  const filteredSearch = search.trim().toLowerCase();

  const handleSelect = (subject, facultyId) => {
    setSelections(prev => {
      const next = { ...prev };
      if (facultyId) next[subject] = facultyId;
      else delete next[subject];
      return next;
    });
  };

  const assignedCount = Object.keys(selections).length;
  const totalSubjects = subjectList.length;
  const barColor = (count) => (count >= 8 ? 'var(--red)' : count >= 5 ? 'var(--gold)' : 'var(--green)');

  return (
    <Modal
      onClose={onClose}
      eyebrow="Assign subject faculty"
      title={student.name}
      subtitle={`${student.examTarget || 'Exam not set'} · ${student.plan ? student.plan[0].toUpperCase() + student.plan.slice(1) : '—'} plan`}
      headerExtra={(
        <div className="am-progress">
          <span className="track">
            <i style={{ width: `${(assignedCount / totalSubjects) * 100}%` }} />
          </span>
          <span className="label">{assignedCount}/{totalSubjects} assigned</span>
        </div>
      )}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-gold"
            disabled={saving || !hasChanges}
            onClick={() => onSave(selections)}
          >
            {saving ? 'Saving…' : hasChanges ? 'Save Assignments' : 'No Changes'}
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

      <div className="am-filters">
        <select className="am-select" value={grade} onChange={e => setGrade(e.target.value)}>
          <option value="all">All grades</option>
          {gradeOptions.map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <div className="am-seg">
          <button type="button" className={activeOnly ? 'on' : ''} onClick={() => setActiveOnly(true)}>Active</button>
          <button type="button" className={!activeOnly ? 'on' : ''} onClick={() => setActiveOnly(false)}>All</button>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        {subjectList.map((subj, si) => {
          const opts = facultyForSubject[subj] || [];
          const filtered = filteredSearch
            ? opts.filter(f => f.name.toLowerCase().includes(filteredSearch))
            : opts;
          const selId = selections[subj] || null;
          const selFaculty = opts.find(f => f.id === selId);

          return (
            <div className="am-subject" key={subj} style={{ animationDelay: `${si * 0.05}s` }}>
              <div className={`am-subject-hd${selId ? ' on' : ''}`}>
                <span className="am-subject-ic">{subj[0]}</span>
                <span className="am-subject-name">{subj}</span>
                <span className="am-subject-count">{filtered.length} eligible</span>
                {selFaculty && <span className="am-subject-picked">{selFaculty.name}</span>}
                {selId && (
                  <button type="button" className="am-remove" onClick={() => handleSelect(subj, null)}>
                    <X size={11} strokeWidth={2.6} style={{ verticalAlign: '-1px', marginRight: '3px' }} />
                    Remove
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="am-empty" style={{ padding: '22px 14px' }}>
                  <SearchX size={26} strokeWidth={1.6} />
                  <strong>{filteredSearch ? 'No match in your search' : `No eligible ${subj} faculty${grade !== 'all' ? ` for grade ${grade}` : ''}`}</strong>
                  <span>{grade !== 'all' ? 'Try “All grades”' : 'Add faculty or check the Active/All filter'}</span>
                </div>
              ) : (
                <div className="am-list">
                  {filtered.map((f, i) => {
                    const sel = selId === f.id;
                    const active = isActiveFaculty(f);
                    const count = f.mentorStudentCount || 0;
                    const pct = Math.min(count * 10, 100);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        className={`am-card${sel ? ' on' : ''}${active ? '' : ' off'}`}
                        style={{ animationDelay: `${i * 0.03}s` }}
                        disabled={!active}
                        onClick={() => handleSelect(subj, f.id)}
                      >
                        <span className="am-av">{f.name?.[0]}</span>
                        <span className="am-meta">
                          <span className="am-name">
                            {f.name}
                            {!active && <span className="am-tag">Inactive</span>}
                          </span>
                          <span className="am-sub">{facultySubjects(f).join(' · ')}</span>
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
              )}
            </div>
          );
        })}
      </div>

      {assignedCount > 0 && !filteredSearch && (
        <div className="am-note">
          <UserRound size={14} strokeWidth={2} />
          Applies to this student only — students see their assigned faculty in each subject.
        </div>
      )}
    </Modal>
  );
};

export default AdminFacultyAssignModal;
