import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './DailyReportForm.css';

const MOOD_OPTIONS = [
  { value: '1', emoji: '😩', label: 'Drained' },
  { value: '2', emoji: '😐', label: 'Okay' },
  { value: '3', emoji: '🙂', label: 'Good' },
  { value: '4', emoji: '💪', label: 'Solid' },
  { value: '5', emoji: '🔥', label: 'On fire' },
];

const getTodayIST = () => {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

const formatDisplayDate = () => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const DailyReportForm = ({ profile, mentorName = 'your mentor', todayReport, onComplete }) => {
  const { id: userId } = useParams();
  const [step, setStep] = useState(0); // 0, 1, 2
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isNEET = (profile?.studentProfile?.examTarget || '').toLowerCase().includes('neet');
  const thirdSubject = isNEET ? 'Biology' : 'Maths';

  const [form, setForm] = useState({
    mood: '', showedUp: '',
    hrsPhysics: '', hrsChemistry: '', hrsThird: '',
    focusQuality: 0,
    topicsDone: '', questionsSolved: '',
    mockToday: '', mockScore: '',
    wentWell: '', wentHard: '', tomorrowOne: '',
    noteForMentor: '',
  });

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const canNext0 = form.mood && form.showedUp;
  const canNext1 = form.focusQuality > 0;
  const canSubmit = canNext1 && form.wentWell;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/student/${userId}/daily-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setSubmitted(true);
      onComplete?.(data);
    } catch (e) {
      alert(e.message || 'Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const today = getTodayIST();
  const dateStr = formatDisplayDate();

  // If already submitted today
  if (todayReport) {
    const moodInfo = MOOD_OPTIONS.find(m => m.value === todayReport.mood);
    return (
      <div className="drform">
        <div className="dr-header">
          <div className="dr-hdr-date">{dateStr}</div>
          <div className="dr-hdr-title">Today's report submitted</div>
          <div className="dr-hdr-sub">{mentorName} will read this before your next session.</div>
        </div>
        <div className="dr-submitted-card">
          <div className="dr-submitted-header">
            <div className="dr-submitted-tick">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A830" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:'var(--dr-fs)', fontSize:'15px', fontWeight:700, color:'var(--dr-navy)' }}>Report logged</div>
              <div style={{ fontSize:'12px', color:'var(--dr-muted)', marginTop:'2px' }}>Submitted today · Come back tomorrow</div>
            </div>
          </div>
          {moodInfo && (
            <div className="dr-field-row">
              <div className="dr-field-lbl">Mood</div>
              <div className="dr-field-val">{moodInfo.emoji} {moodInfo.label}</div>
            </div>
          )}
          <div className="dr-field-row">
            <div className="dr-field-lbl">Showed up</div>
            <div className="dr-field-val">{todayReport.showedUp}</div>
          </div>
          <div className="dr-field-row">
            <div className="dr-field-lbl">Focus</div>
            <div className="dr-field-val">{todayReport.focusQuality} / 5</div>
          </div>
          {todayReport.topicsDone && (
            <div className="dr-field-row">
              <div className="dr-field-lbl">Topics</div>
              <div className="dr-field-val">{todayReport.topicsDone}</div>
            </div>
          )}
          {todayReport.questionsSolved && (
            <div className="dr-field-row">
              <div className="dr-field-lbl">Problems</div>
              <div className="dr-field-val">{todayReport.questionsSolved} solved</div>
            </div>
          )}
          {todayReport.wentWell && (
            <div className="dr-field-row">
              <div className="dr-field-lbl">Went well</div>
              <div className="dr-field-val">{todayReport.wentWell}</div>
            </div>
          )}
          {todayReport.wentHard && (
            <div className="dr-field-row">
              <div className="dr-field-lbl">Felt hard</div>
              <div className="dr-field-val">{todayReport.wentHard}</div>
            </div>
          )}
          {todayReport.tomorrowOne && (
            <div className="dr-field-row">
              <div className="dr-field-lbl">Tomorrow</div>
              <div className="dr-field-val">{todayReport.tomorrowOne}</div>
            </div>
          )}
          {todayReport.noteForMentor && (
            <div className="dr-field-row">
              <div className="dr-field-lbl">For mentor</div>
              <div className="dr-field-val" style={{ fontStyle:'italic' }}>{todayReport.noteForMentor}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="drform">
        <div className="dr-success">
          <div className="dr-succ-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FDF8F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline className="dr-succ-check" points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="dr-succ-title">Done. Well done.</div>
          <div className="dr-succ-sub">
            Today is logged. <strong>{mentorName}</strong> will read this before your next session.
            <br /><br />
            <strong>Show up again tomorrow.</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drform">
      {/* Header */}
      <div className="dr-header">
        <div className="dr-hdr-date">{dateStr}</div>
        <div className="dr-hdr-title">How did today go?</div>
        <div className="dr-hdr-sub">2 minutes. Be honest with yourself.</div>
      </div>

      {/* Progress */}
      <div className="dr-prog">
        {[0,1,2].map(i => (
          <div key={i} className={'dr-pd' + (i < step ? ' done' : i === step ? ' on' : '')} />
        ))}
      </div>

      {/* ── STEP 1: Today's Vibe ── */}
      {step === 0 && (
        <div className="dr-step">
          <div className="dr-sec-lbl">Today's vibe</div>

          <div className="dr-q">
            <div className="dr-q-lbl">How are you feeling right now?</div>
            <div className="dr-radio-group">
              {MOOD_OPTIONS.map(m => (
                <div key={m.value} className={'dr-radio-label' + (form.mood === m.value ? ' selected' : '')} onClick={() => set('mood', m.value)}>
                  <div className="dr-radio-circle" />
                  <span className="dr-em">{m.emoji}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dr-q">
            <div className="dr-q-lbl">Did you show up for yourself today?</div>
            <div className="dr-radio-group">
              {[{ value: 'Yes', label: 'Yes ✓' }, { value: 'No', label: 'Not really ✗' }].map(o => (
                <div key={o.value} className={'dr-radio-label' + (form.showedUp === o.value ? ' selected' : '')} onClick={() => set('showedUp', o.value)}>
                  <div className="dr-radio-circle" />
                  <span>{o.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dr-nav">
            <button className="dr-btn-next" disabled={!canNext0} onClick={() => { if (canNext0) setStep(1); }}
              style={{ opacity: canNext0 ? 1 : 0.45, animation: canNext0 ? undefined : 'none' }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Study Session ── */}
      {step === 1 && (
        <div className="dr-step">
          <div className="dr-sec-lbl">Study session</div>

          <div className="dr-q">
            <div className="dr-q-lbl">Hours studied per subject</div>
            <div className="dr-subj-grid">
              {[
                { name: 'Physics',   field: 'hrsPhysics' },
                { name: 'Chemistry', field: 'hrsChemistry' },
                { name: thirdSubject, field: 'hrsThird' },
              ].map(s => (
                <div key={s.name} className="dr-subj-box">
                  <div className="dr-subj-name">{s.name}</div>
                  <input className="dr-subj-input" type="number" min="0" max="12" step="0.5" placeholder="0"
                    value={form[s.field]} onChange={e => set(s.field, e.target.value)} />
                  <div className="dr-subj-unit">hrs</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dr-q">
            <div className="dr-q-lbl">Focus quality today</div>
            <div className="dr-q-hint">1 = total distraction · 5 = deep focus</div>
            <div className="dr-scale-group">
              {[1,2,3,4,5].map(n => (
                <div key={n} className={'dr-scale-label' + (form.focusQuality === n ? ' selected' : '')} onClick={() => set('focusQuality', n)}>
                  <span>{n}</span>
                  <span className="dr-scale-sub">{n === 1 ? 'Low' : n === 3 ? 'Mid' : n === 5 ? 'High' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dr-q">
            <div className="dr-q-lbl">Topics / chapters covered today</div>
            <input className="dr-input" type="text" placeholder="e.g. Kinematics, Organic Chemistry, Genetics..."
              value={form.topicsDone} onChange={e => set('topicsDone', e.target.value)} />
          </div>

          <div className="dr-q">
            <div className="dr-q-lbl">Questions / problems solved</div>
            <input className="dr-input" type="number" min="0" placeholder="e.g. 40"
              value={form.questionsSolved} onChange={e => set('questionsSolved', e.target.value)} />
          </div>

          <div className="dr-q">
            <div className="dr-q-lbl">Did you attempt a mock or test today?</div>
            <div className="dr-radio-group">
              {['Yes', 'No'].map(o => (
                <div key={o} className={'dr-radio-label' + (form.mockToday === o ? ' selected' : '')} onClick={() => set('mockToday', o)}>
                  <div className="dr-radio-circle" />
                  <span>{o}</span>
                </div>
              ))}
            </div>
            {form.mockToday === 'Yes' && (
              <div className="dr-mock-reveal" style={{ marginTop:'10px' }}>
                <input className="dr-input" type="text" placeholder="Score (e.g. 560/720 or 145/300)"
                  value={form.mockScore} onChange={e => set('mockScore', e.target.value)} />
              </div>
            )}
          </div>

          <div className="dr-nav">
            <button className="dr-btn-back" onClick={() => setStep(0)}>← Back</button>
            <button className="dr-btn-next" disabled={!canNext1} onClick={() => { if (canNext1) setStep(2); }}
              style={{ opacity: canNext1 ? 1 : 0.45, animation: canNext1 ? undefined : 'none' }}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Reflection + Mentor ── */}
      {step === 2 && (
        <div className="dr-step">
          <div className="dr-sec-lbl">Mind check</div>

          <div className="dr-q">
            <div className="dr-q-lbl">One thing that went well today <span style={{ color:'var(--dr-red)', fontSize:'12px' }}>*</span></div>
            <input className="dr-input" type="text" placeholder="Even something small counts..."
              value={form.wentWell} onChange={e => set('wentWell', e.target.value)} />
          </div>

          <div className="dr-q">
            <div className="dr-q-lbl">One thing that felt hard or off</div>
            <input className="dr-input" type="text" placeholder="Be honest — this is for you"
              value={form.wentHard} onChange={e => set('wentHard', e.target.value)} />
          </div>

          <div className="dr-q">
            <div className="dr-q-lbl">What's the one thing you'll do first tomorrow?</div>
            <input className="dr-input" type="text" placeholder="One specific thing — not a list"
              value={form.tomorrowOne} onChange={e => set('tomorrowOne', e.target.value)} />
          </div>

          <div className="dr-sec-lbl" style={{ marginTop:'8px' }}>Anything for {mentorName}</div>

          <div className="dr-q">
            <div className="dr-q-lbl">Something on your mind? <span style={{ fontWeight:400, color:'var(--dr-muted)' }}>(optional)</span></div>
            <div className="dr-q-hint">A doubt, a feeling, a win — anything. This goes only to your mentor.</div>
            <textarea className="dr-textarea" placeholder="Write freely..."
              value={form.noteForMentor} onChange={e => set('noteForMentor', e.target.value)} />
          </div>

          <div className="dr-nav">
            <button className="dr-btn-back" onClick={() => setStep(1)}>← Back</button>
            <button className="dr-btn-submit" disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting…' : 'Submit today\'s report →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportForm;
