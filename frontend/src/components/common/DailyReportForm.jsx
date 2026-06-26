import { useState } from 'react';
import { useParams } from 'react-router-dom';
import './DailyReportForm.css';

const MOOD_OPTIONS = [
  { value: '1', emoji: '😩', label: 'Drained' },
  { value: '2', emoji: '😐', label: 'Okay' },
  { value: '3', emoji: '🙂', label: 'Good' },
  { value: '4', emoji: '💪', label: 'Solid' },
  { value: '5', emoji: '🔥', label: 'On fire' },
];

const MOOD_COLORS = { '1': '#F87171', '2': '#FBBF24', '3': '#86EFAC', '4': '#4ADE80', '5': '#E8A830' };

const getTodayIST = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

const formatDisplayDate = () => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatShortDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
};

// ── RIGHT PANEL — 7-day streak & history ──
const HistoryPanel = ({ dailyReports }) => {
  const todayStr = getTodayIST();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - i * 86400000);
    const ds = d.toISOString().slice(0, 10);
    const report = dailyReports.find(r => r.date === ds);
    const isToday = ds === todayStr;
    const isFuture = ds > todayStr;
    let status = 'future';
    if (!isFuture) status = report ? 'submitted' : (isToday ? 'today' : 'missed');
    days.push({ ds, short: formatShortDate(ds), report, status, isToday });
  }

  const last7 = dailyReports.filter(r => {
    const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 6 * 86400000);
    return r.date >= d.toISOString().slice(0, 10);
  });
  const submitted7 = days.filter(d => d.status === 'submitted').length;
  const streak = (() => {
    const sorted = [...dailyReports].sort((a, b) => b.date.localeCompare(a.date));
    const yesterday = new Date(Date.now() + 5.5 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10);
    let exp = (sorted[0]?.date === todayStr) ? todayStr : yesterday;
    let s = 0;
    for (const r of sorted) {
      if (r.date !== exp) break;
      s++;
      const dd = new Date(exp + 'T00:00:00');
      dd.setDate(dd.getDate() - 1);
      exp = dd.toISOString().slice(0, 10);
    }
    return s;
  })();
  const avgMood = last7.length ? (last7.reduce((s, r) => s + parseInt(r.mood), 0) / last7.length).toFixed(1) : null;
  const avgFocus = last7.length ? (last7.reduce((s, r) => s + r.focusQuality, 0) / last7.length).toFixed(1) : null;
  const recent = [...dailyReports].slice(0, 5);

  return (
    <div className="drform-right">
      {/* Streak */}
      <div className="drp-card">
        <div className="drp-label">Your streak</div>
        <div className="drp-streak-num">{streak}</div>
        <div className="drp-streak-sub">consecutive days</div>
        <div className="drp-7days">
          {days.map(day => (
            <div key={day.ds} className="drp-day">
              <div className={'drp-day-dot ' + day.status}>
                {day.status === 'submitted' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                {day.status === 'missed' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                {day.status === 'today' && <span style={{ fontSize:'10px', color:'#E8A830', fontWeight:800 }}>•</span>}
              </div>
              <div className="drp-day-lbl">{day.short}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {(avgMood || avgFocus) && (
        <div className="drp-card">
          <div className="drp-label">Last 7 days</div>
          <div className="drp-stat-row">
            <div className="drp-stat-label">Reports submitted</div>
            <div className="drp-stat-val" style={{ color: '#86EFAC' }}>{submitted7} / 7</div>
          </div>
          {avgMood && (
            <div className="drp-stat-row">
              <div className="drp-stat-label">Avg mood</div>
              <div className="drp-stat-val">{avgMood} / 5</div>
            </div>
          )}
          {avgFocus && (
            <div className="drp-stat-row">
              <div className="drp-stat-label">Avg focus</div>
              <div className="drp-stat-val">{avgFocus} / 5</div>
            </div>
          )}
        </div>
      )}

      {/* Recent reports */}
      {recent.length > 0 && (
        <div className="drp-card">
          <div className="drp-label">Recent reports</div>
          {recent.map((r, i) => {
            const mood = MOOD_OPTIONS.find(m => m.value === r.mood);
            const totalHrs = ((r.hrsPhysics || 0) + (r.hrsChemistry || 0) + (r.hrsThird || 0)).toFixed(1);
            return (
              <div key={r.id} className="drp-recent-item" style={{ animationDelay: (i * 0.06) + 's' }}>
                <div className="drp-recent-dot" style={{ background: MOOD_COLORS[r.mood] || '#86EFAC' }} />
                <div className="drp-recent-date">{formatShortDate(r.date)}</div>
                <div className="drp-recent-mood">{mood?.emoji}</div>
                <div className="drp-recent-info">
                  Focus {r.focusQuality}/5
                  {parseFloat(totalHrs) > 0 ? ` · ${totalHrs}h` : ''}
                  {r.questionsSolved ? ` · ${r.questionsSolved}Q` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {dailyReports.length === 0 && (
        <div className="drp-card" style={{ textAlign:'center', padding:'28px 20px' }}>
          <div style={{ fontSize:'28px', marginBottom:'10px', opacity:.5 }}>📊</div>
          <div style={{ fontSize:'13px', color:'rgba(234,244,236,.4)', lineHeight:1.6 }}>Submit your first report to start tracking your progress here.</div>
        </div>
      )}
    </div>
  );
};

// ── MAIN FORM ──
const DailyReportForm = ({ profile, mentorName = 'your mentor', todayReport, dailyReports = [], onComplete }) => {
  const { id: userId } = useParams();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('forward');
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

  const goNext = () => { setDirection('forward'); setStep(s => s + 1); };
  const goBack = () => { setDirection('back'); setStep(s => s - 1); };

  const canNext0 = form.mood && form.showedUp;
  const canNext1 = form.focusQuality > 0;
  const canSubmit = form.wentWell.trim().length > 0;

  const handleSubmit = async () => {
    if (submitting || !canSubmit) return;
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

  const dateStr = formatDisplayDate();
  const stepClass = direction === 'forward' ? 'dr-step-anim' : 'dr-step-back';

  return (
    <div className="drform-layout">
      {/* ── LEFT: FORM ── */}
      <div className="drform-left drform">

        {/* Header */}
        <div className="dr-header">
          <div className="dr-hdr-date">{dateStr}</div>
          <div className="dr-hdr-title">
            {(todayReport || submitted) ? 'Today\'s report' : 'How did today go?'}
          </div>
          <div className="dr-hdr-sub">
            {(todayReport || submitted) ? `Submitted and shared with ${mentorName}.` : '2 minutes. Be honest with yourself.'}
          </div>
        </div>

        {/* Progress — only shown during active form steps */}
        {!todayReport && !submitted && (
          <div className="dr-prog">
            {[0,1,2].map(i => (
              <div key={i} className={'dr-pd' + (i < step ? ' done' : i === step ? ' on' : '')} />
            ))}
          </div>
        )}

        {/* Already submitted */}
        {todayReport && !submitted && (
          <div className="dr-body">
            <div className="dr-done-card">
              <div className="dr-done-header">
                <div className="dr-done-tick">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div className="dr-done-title">Today's report is in</div>
                  <div className="dr-done-sub">{mentorName} will read this. Come back tomorrow.</div>
                </div>
              </div>
              {(() => {
                const mood = MOOD_OPTIONS.find(m => m.value === todayReport.mood);
                return (
                  <>
                    {mood && <div className="dr-field-row"><div className="dr-field-lbl">Mood</div><div className="dr-field-val">{mood.emoji} {mood.label}</div></div>}
                    <div className="dr-field-row"><div className="dr-field-lbl">Showed up</div><div className="dr-field-val">{todayReport.showedUp}</div></div>
                    <div className="dr-field-row"><div className="dr-field-lbl">Focus</div><div className="dr-field-val">{todayReport.focusQuality} / 5</div></div>
                    {todayReport.topicsDone && <div className="dr-field-row"><div className="dr-field-lbl">Topics</div><div className="dr-field-val">{todayReport.topicsDone}</div></div>}
                    {todayReport.questionsSolved && <div className="dr-field-row"><div className="dr-field-lbl">Problems</div><div className="dr-field-val">{todayReport.questionsSolved} solved</div></div>}
                    {todayReport.wentWell && <div className="dr-field-row"><div className="dr-field-lbl">Went well</div><div className="dr-field-val">{todayReport.wentWell}</div></div>}
                    {todayReport.wentHard && <div className="dr-field-row"><div className="dr-field-lbl">Felt hard</div><div className="dr-field-val">{todayReport.wentHard}</div></div>}
                    {todayReport.tomorrowOne && <div className="dr-field-row"><div className="dr-field-lbl">Tomorrow</div><div className="dr-field-val">{todayReport.tomorrowOne}</div></div>}
                    {todayReport.noteForMentor && <div className="dr-field-row"><div className="dr-field-lbl">For mentor</div><div className="dr-field-val" style={{ fontStyle:'italic' }}>{todayReport.noteForMentor}</div></div>}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Success */}
        {submitted && (
          <div className="dr-success">
            <div className="dr-succ-ring">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline className="dr-succ-check" points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="dr-succ-title">Done. Well done.</div>
            <div className="dr-succ-sub">
              Today is logged. <strong>{mentorName}</strong> will read this before your next session.
              <br/><br/><strong>Show up again tomorrow.</strong>
            </div>
          </div>
        )}

        {/* Form steps */}
        {!todayReport && !submitted && (
          <div className="dr-body">

            {/* STEP 1 */}
            {step === 0 && (
              <div key="s0" className={stepClass}>
                <div className="dr-sec-lbl">Today's vibe</div>

                <div className="dr-q">
                  <div className="dr-q-lbl">How are you feeling right now?</div>
                  <div className="dr-radio-group">
                    {MOOD_OPTIONS.map(m => (
                      <div key={m.value} className={'dr-radio-label' + (form.mood === m.value ? ' selected' : '')} onClick={() => set('mood', m.value)}>
                        <div className="dr-radio-circle" />
                        <span className="dr-em">{m.emoji}</span>
                        <span style={{ flex: 1 }}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dr-q">
                  <div className="dr-q-lbl">Did you show up for yourself today?</div>
                  <div className="dr-radio-group">
                    {[{ value:'Yes', label:'Yes ✓' }, { value:'No', label:'Not really ✗' }].map(o => (
                      <div key={o.value} className={'dr-radio-label' + (form.showedUp === o.value ? ' selected' : '')} onClick={() => set('showedUp', o.value)}>
                        <div className="dr-radio-circle" />
                        <span>{o.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dr-nav">
                  <button className="dr-btn-next" disabled={!canNext0} onClick={goNext}
                    style={{ opacity: canNext0 ? 1 : 0.35, animation: canNext0 ? undefined : 'none' }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 1 && (
              <div key="s1" className={stepClass}>
                <div className="dr-sec-lbl">Study session</div>

                <div className="dr-q">
                  <div className="dr-q-lbl">Hours studied per subject</div>
                  <div className="dr-subj-grid">
                    {[{ name:'Physics', field:'hrsPhysics' }, { name:'Chemistry', field:'hrsChemistry' }, { name:thirdSubject, field:'hrsThird' }].map(s => (
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
                        <span className="dr-scale-sub">{n===1?'Low':n===3?'Mid':n===5?'High':''}</span>
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
                    {['Yes','No'].map(o => (
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
                  <button className="dr-btn-back" onClick={goBack}>← Back</button>
                  <button className="dr-btn-next" disabled={!canNext1} onClick={goNext}
                    style={{ opacity: canNext1 ? 1 : 0.35, animation: canNext1 ? undefined : 'none' }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <div key="s2" className={stepClass}>
                <div className="dr-sec-lbl">Mind check</div>

                <div className="dr-q">
                  <div className="dr-q-lbl">One thing that went well today <span style={{ color:'#F87171', fontSize:'12px' }}>*</span></div>
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
                  <div className="dr-q-lbl">Something on your mind? <span style={{ fontWeight:400, color:'rgba(234,244,236,.4)' }}>(optional)</span></div>
                  <div className="dr-q-hint">A doubt, a feeling, a win — anything. This goes only to your mentor.</div>
                  <textarea className="dr-textarea" placeholder="Write freely..."
                    value={form.noteForMentor} onChange={e => set('noteForMentor', e.target.value)} />
                </div>

                <div className="dr-nav">
                  <button className="dr-btn-back" onClick={goBack}>← Back</button>
                  <button className="dr-btn-submit" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                    {submitting ? 'Submitting…' : 'Submit today\'s report →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL ── */}
      <HistoryPanel dailyReports={dailyReports} />
    </div>
  );
};

export default DailyReportForm;
