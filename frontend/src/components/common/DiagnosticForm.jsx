import { useState, useMemo, useEffect, Fragment } from 'react';
import './DiagnosticForm.css';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqLIur40mcrCKPGwDYmAlhZ2UATMFNZGowN4_pAQ30e8I89YStxu294zE5DhzOv5YpxA/exec';

const JEE_PHY  = ['Kinematics','Laws of Motion','Work, Energy & Power','Rotational Motion','Gravitation','Thermodynamics','Waves & SHM','Electrostatics','Current Electricity','Magnetism & EMI','Optics','Modern Physics'];
const JEE_CHEM = ['Mole Concept','Atomic Structure','Chemical Bonding','Thermodynamics (Chem)','Equilibrium','Electrochemistry','Chemical Kinetics','p, d & f Block','Coordination Compounds','Organic Basics & IUPAC','Reaction Mechanisms','Named Reactions'];
const JEE_MATH = ['Sets, Relations & Functions','Quadratic Equations','Sequences & Series','Permutation & Combination','Binomial Theorem','Trigonometry','Coordinate Geometry','Limits & Continuity','Differentiation','Integration','Vectors & 3D','Probability'];
const NEET_PHY  = ['Physics & Measurement','Kinematics','Laws of Motion','Work, Energy & Power','Rotational Motion','Gravitation','Properties of Solids & Liquids','Thermodynamics','Kinetic Theory of Gases','Oscillations & Waves','Electrostatics','Current Electricity','Magnetic Effects & Magnetism','EM Induction & AC','Electromagnetic Waves','Optics','Dual Nature of Matter & Radiation','Atoms & Nuclei','Electronic Devices'];
const NEET_CHEM = ['Basic Concepts in Chemistry','Atomic Structure','Chemical Bonding','Chemical Thermodynamics','Solutions','Equilibrium','Redox & Electrochemistry','Chemical Kinetics','Classification & Periodicity','p-Block Elements','d & f Block Elements','Coordination Compounds','Basic Principles of Organic Chemistry','Hydrocarbons','Organic — Halogens','Organic — Oxygen','Organic — Nitrogen','Biomolecules'];
const NEET_BIO  = ['Diversity in Living World','Structural Organisation','Cell Structure & Function','Photosynthesis','Plant Respiration','Plant Growth & Development','Breathing & Respiration','Body Fluids & Circulation','Excretory Products','Locomotion & Movement','Neural Control','Chemical Coordination','Reproduction — Plants','Human Reproduction','Reproductive Health','Genetics — Mendelian','Molecular Inheritance','Evolution','Human Health & Disease','Microbes in Human Welfare','Biotechnology','Ecology & Environment'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const Chips = ({ name, opts, val, onChange, multi }) => (
  <div className="chips">
    {opts.map(o => (
      <Fragment key={o.v}>
        <input
          type={multi ? 'checkbox' : 'radio'}
          id={`${name}_${o.v}`}
          checked={multi ? val.includes(o.v) : val === o.v}
          onChange={() => onChange(o.v)}
        />
        <label htmlFor={`${name}_${o.v}`}>{o.l}</label>
      </Fragment>
    ))}
  </div>
);

const TopicCol = ({ title, topics, val, onToggle }) => (
  <div className="topic-col">
    <h4>{title}</h4>
    {topics.map(t => (
      <label key={t} className="topic-check">
        <input type="checkbox" checked={val.includes(t)} onChange={() => onToggle(t)} />
        {t}
      </label>
    ))}
  </div>
);

const Q = ({ num, label, req, hint, children }) => (
  <div className="df-q">
    <div className="df-qrow">
      <span className="df-qn">{num}</span>
      <span className="df-ql">{label}{req && <span className="df-req"> *</span>}</span>
    </div>
    {hint && <p className="df-hint">{hint}</p>}
    <div className="df-qbody">{children}</div>
  </div>
);

const Sec = ({ id, name, badge, children }) => (
  <div className="df-sec">
    <div className="df-sec-head">
      <span className="df-sn">{id}</span>
      <span className="df-sl">{name}</span>
      {badge && <span className="df-sbadge">{badge}</span>}
    </div>
    <div className="df-sec-body">{children}</div>
  </div>
);

// Two questions side-by-side on desktop, stacked on mobile
const QPair = ({ children }) => <div className="df-qpair">{children}</div>;

// ── Main component ─────────────────────────────────────────────────────────────

const DiagnosticForm = ({ profile }) => {
  const examTarget = profile?.studentProfile?.examTarget || '';
  const isNeet = examTarget.toLowerCase().includes('neet');
  const exam   = isNeet ? 'neet' : 'jee';

  const [form, setForm] = useState({
    name: profile?.name || '',
    current_class: '',
    exam_target: '',
    target_date: '',
    has_coaching: '',
    coaching_name: '',
    coaching_coverage: '',
    study_hours: '',
    subjects: [],
    syllabus_coverage: '',
    phy_topics: [], chem_topics: [], math_topics: [], bio_topics: [],
    has_mocks: '',
    mock_score_1: '', mock_score_2: '', mock_score_3: '',
    mock_s1: '', mock_s2: '', mock_s3: '',
    hardest_subject: '',
    time_mgmt: '',
    review_mistakes: '',
    bio_weak: '', ncert_reads: '',
    math_weak: '', math_loss: '',
    phy_loss: '',
    chem_weak: '', chem_mid: '', chem_strong: '',
    dreaded_chapters: '',
    same_day_revision: '',
    fix_one_thing: '', what_missed: '', exam_meaning: '',
    parent_goal: '',
    target_score: '', target_rank: '',
    parent_involvement: '',
    parent_notes: '',
  });

  // Auto-fill name from profile (handles async profile load)
  useEffect(() => {
    if (profile?.name) {
      setForm(f => ({ ...f, name: f.name || profile.name }));
    }
  }, [profile]);

  const [topicsOpen, setTopicsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const txt = k => e => set(k, e.target.value);
  const tog = (k, v) => setForm(f => {
    const a = f[k] || [];
    return { ...f, [k]: a.includes(v) ? a.filter(x => x !== v) : [...a, v] };
  });

  const progress = useMemo(() => {
    let filled = 0, total = 0;
    Object.entries(form).forEach(([, v]) => {
      total++;
      if (Array.isArray(v) ? v.length > 0 : String(v).trim()) filled++;
    });
    return Math.min(Math.round((filled / total) * 100), 100);
  }, [form]);

  const validate = () => {
    if (!form.name.trim())   return 'Please enter your full name (Q1).';
    if (!form.current_class) return 'Please select your current class (Q2).';
    if (!form.has_coaching)  return 'Please answer the coaching question.';
    if (!form.subjects.length) return 'Please select at least one subject.';
    return null;
  };

  const handleSubmit = e => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    const data = {
      exam_type: exam,
      ...form,
      subjects:    form.subjects.join(', '),
      phy_topics:  form.phy_topics.join(', '),
      chem_topics: form.chem_topics.join(', '),
      math_topics: form.math_topics.join(', '),
      bio_topics:  form.bio_topics.join(', '),
      submitted_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    window.__diagCb = () => {};
    const params = Object.entries(data)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v || '')}`)
      .join('&');
    const s = document.createElement('script');
    s.src = `${SCRIPT_URL}?${params}&callback=__diagCb`;
    s.onerror = () => {};
    document.head.appendChild(s);

    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1500);
  };

  if (submitted) {
    return (
      <div className={`dform${isNeet ? ' neet-mode' : ''}`}>
        <div className="df-success">
          <div className="df-success-top">
            <div className="df-ok-icon">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2>Form submitted!</h2>
            <p>Your mentor has received this. We'll reach out within 24 hours.</p>
          </div>
          <div className="df-cta">
            <div className="df-cta-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.05 10.79 19.79 19.79 0 01.07 2.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
            </div>
            <h3>What happens next?</h3>
            <p>Our mentor will review your answers and prepare a personalised 3-month study plan. You'll hear back from us soon.</p>
            <div className="df-cta-contact">
              <span>talktostudyverse@gmail.com</span>
              <span className="df-cta-dot">·</span>
              <span>+91 93583 69907</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Q number offset: JEE has extra Q3 (targeting), NEET questions shift back by 1
  const q = n => isNeet ? (n <= 2 ? `Q${n}` : `Q${n - 1}`) : `Q${n}`;

  return (
    <div className={`dform${isNeet ? ' neet-mode' : ''}`}>

      {/* Sticky progress bar */}
      <div className="df-progress" title={`${progress}% complete`}>
        <div className="df-pfill" style={{ width: `${progress}%` }} />
        <span className="df-pct">{progress}%</span>
      </div>

      {/* Header card — horizontal split */}
      <div className="df-header">
        <div className="df-header-left">
          <div className="df-logo">Studyverse</div>
          <h1><em>Tell us where</em><br /><strong>you stand today</strong></h1>
          <p>No right or wrong answers. Be honest — it sharpens your first session.</p>
        </div>
        <div className="df-header-right">
          <span className="df-exam-pill">{isNeet ? 'NEET UG' : 'JEE Main + Advanced'}</span>
          <div className="df-hstats">
            <div className="df-hstat">
              <span className="df-hstat-val">8</span>
              <span className="df-hstat-lbl">min</span>
            </div>
            <div className="df-hstat">
              <span className="df-hstat-val">26</span>
              <span className="df-hstat-lbl">questions</span>
            </div>
            <div className="df-hstat">
              <span className="df-hstat-val">6</span>
              <span className="df-hstat-lbl">sections</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="df-body">
        <form onSubmit={handleSubmit} noValidate>

          {/* ── A: Basic Profile ── */}
          <Sec id="A" name="Basic Profile">

            <QPair>
              <Q num="Q1" label="Full name" req>
                <input type="text" value={form.name} onChange={txt('name')} placeholder="Your full name" />
              </Q>
              <Q num="Q2" label="Current class" req>
                <Chips name="cc" val={form.current_class} onChange={v => set('current_class', v)} opts={[
                  {v:'Class 11',l:'Class 11'},{v:'Class 12',l:'Class 12'},
                  {v:'1st year drop',l:'1st drop'},{v:'2nd year drop',l:'2nd drop'},
                ]} />
              </Q>
            </QPair>

            {!isNeet && (
              <Q num="Q3" label="Targeting" req>
                <Chips name="et" val={form.exam_target} onChange={v => set('exam_target', v)} opts={[
                  {v:'JEE Main only',l:'JEE Main only'},
                  {v:'JEE Main + Advanced',l:'JEE Main + Advanced'},
                ]} />
              </Q>
            )}

            <Q num={q(4)} label="Target exam date" hint={isNeet ? 'e.g. May 2026 (NEET)' : 'e.g. Jan 2026 (JEE Main)'}>
              <input type="text" value={form.target_date} onChange={txt('target_date')} placeholder="e.g. May 2026" />
            </Q>

            <Q num={q(5)} label="Are you attending any coaching institute?" req>
              <Chips name="hc" val={form.has_coaching} onChange={v => set('has_coaching', v)} opts={[
                {v:'Yes',l:'Yes'},{v:'No — self-study only',l:'No — self-study only'},
              ]} />
              {form.has_coaching === 'Yes' && (
                <div className="coaching-sub">
                  <div className="coaching-sub-label">Fill only if you answered Yes</div>
                  <div style={{ marginBottom: '12px' }}>
                    <div className="coaching-sub-field-label">Name of institute</div>
                    <input type="text" value={form.coaching_name} onChange={txt('coaching_name')} placeholder="e.g. Allen, Aakash, FIITJEE, local institute" />
                  </div>
                  <div>
                    <div className="coaching-sub-field-label">How much syllabus covered by coaching so far?</div>
                    <Chips name="cv" val={form.coaching_coverage} onChange={v => set('coaching_coverage', v)} opts={[
                      {v:'Less than 25%',l:'< 25%'},{v:'25–50%',l:'25–50%'},
                      {v:'50–75%',l:'50–75%'},{v:'More than 75%',l:'> 75%'},
                    ]} />
                  </div>
                </div>
              )}
            </Q>

            <QPair>
              <Q num={q(6)} label="Average honest self-study hours per day">
                <Chips name="sh" val={form.study_hours} onChange={v => set('study_hours', v)} opts={[
                  {v:'Less than 2 hrs',l:'< 2 hrs'},{v:'2–4 hrs',l:'2–4 hrs'},
                  {v:'4–6 hrs',l:'4–6 hrs'},{v:'6+ hrs',l:'6+ hrs'},
                ]} />
              </Q>
              <Q num={q(7)} label="Subjects you want help with" req>
                <Chips name="subj" val={form.subjects} onChange={v => tog('subjects', v)} multi opts={
                  isNeet
                    ? [{v:'Physics',l:'Physics'},{v:'Chemistry',l:'Chemistry'},{v:'Biology',l:'Biology'}]
                    : [{v:'Physics',l:'Physics'},{v:'Chemistry',l:'Chemistry'},{v:'Maths',l:'Maths'}]
                } />
              </Q>
            </QPair>

          </Sec>

          {/* ── B: Syllabus Coverage ── */}
          <Sec id="B" name="Syllabus Coverage" badge="Optional">
            <div className="syl-intro">
              <p>How much of the total syllabus have you personally covered so far?</p>
              <Chips name="sc" val={form.syllabus_coverage} onChange={v => set('syllabus_coverage', v)} opts={[
                {v:'Just started (0–25%)',l:'Just started'},{v:'25–50% done',l:'25–50%'},
                {v:'50–75% done',l:'50–75%'},{v:'75–100% done',l:'75–100%'},
              ]} />
              <p className="syl-sub">
                Want to tell us which specific topics you have covered? Completely optional.
              </p>
              <button type="button" className={`expand-btn${topicsOpen ? ' open' : ''}`} onClick={() => setTopicsOpen(o => !o)}>
                <span>{topicsOpen ? 'Hide topic details' : 'Add topic details'}</span>
                <span className="arrow">▼</span>
              </button>
            </div>

            {topicsOpen && (
              <div className="topic-grid">
                <TopicCol title="Physics"   topics={isNeet ? NEET_PHY  : JEE_PHY}  val={form.phy_topics}  onToggle={v => tog('phy_topics', v)} />
                <TopicCol title="Chemistry" topics={isNeet ? NEET_CHEM : JEE_CHEM} val={form.chem_topics} onToggle={v => tog('chem_topics', v)} />
                {isNeet
                  ? <TopicCol title="Biology" topics={NEET_BIO}  val={form.bio_topics}  onToggle={v => tog('bio_topics', v)} />
                  : <TopicCol title="Maths"   topics={JEE_MATH}  val={form.math_topics} onToggle={v => tog('math_topics', v)} />
                }
              </div>
            )}
          </Sec>

          {/* ── C: Test Performance ── */}
          <Sec id="C" name="Test Performance">

            <Q num="Q8" label="Have you attempted any mock tests?">
              <Chips name="hm" val={form.has_mocks} onChange={v => set('has_mocks', v)} opts={[
                {v:'Yes, multiple full mocks',l:'Yes, multiple'},{v:'A few',l:'A few'},{v:'Not yet',l:'Not yet'},
              ]} />
            </Q>

            <Q num="Q9" label="Your last 3 mock total scores" hint={isNeet ? 'NEET is out of 720. Leave blank if not applicable.' : 'JEE Main is out of 300. Leave blank if not applicable.'}>
              <div className="df-row">
                <div className="df-fp"><span>Score 1</span><input type="text" value={form.mock_score_1} onChange={txt('mock_score_1')} placeholder="—" /></div>
                <div className="df-fp"><span>Score 2</span><input type="text" value={form.mock_score_2} onChange={txt('mock_score_2')} placeholder="—" /></div>
                <div className="df-fp"><span>Score 3</span><input type="text" value={form.mock_score_3} onChange={txt('mock_score_3')} placeholder="—" /></div>
              </div>
            </Q>

            <Q num="Q10" label="Latest mock — subject-wise score" hint="Leave blank if not applicable">
              <div className="df-row">
                <div className="df-fp"><span>Physics</span><input type="text" value={form.mock_s1} onChange={txt('mock_s1')} placeholder="—" /></div>
                <div className="df-fp"><span>Chemistry</span><input type="text" value={form.mock_s2} onChange={txt('mock_s2')} placeholder="—" /></div>
                <div className="df-fp"><span>{isNeet ? 'Biology' : 'Maths'}</span><input type="text" value={form.mock_s3} onChange={txt('mock_s3')} placeholder="—" /></div>
              </div>
            </Q>

            <QPair>
              <Q num="Q11" label="Which subject consistently pulls your score down?">
                <Chips name="hs" val={form.hardest_subject} onChange={v => set('hardest_subject', v)} opts={[
                  {v:'Physics',l:'Physics'},{v:'Chemistry',l:'Chemistry'},
                  ...(isNeet ? [{v:'Biology',l:'Biology'}] : [{v:'Maths',l:'Maths'}]),
                  {v:'All feel hard',l:'All feel hard'},
                ]} />
              </Q>
              <Q num="Q12" label="Time management in tests">
                <Chips name="tm" val={form.time_mgmt} onChange={v => set('time_mgmt', v)} opts={[
                  {v:'Run out of time',l:'Run out of time'},{v:'Just right',l:'Just right'},
                  {v:'Finish early',l:'Finish early'},{v:"Haven't timed myself yet",l:'Not yet'},
                ]} />
              </Q>
            </QPair>

            <Q num="Q13" label="After a test, do you go through every mistake?">
              <Chips name="rm" val={form.review_mistakes} onChange={v => set('review_mistakes', v)} opts={[
                {v:'Always, with written notes',l:'Always, with notes'},
                {v:'Sometimes',l:'Sometimes'},{v:'Rarely / Never',l:'Rarely / Never'},
              ]} />
            </Q>

          </Sec>

          {/* ── D: Subject Gaps ── */}
          <Sec id="D" name="Subject Gaps">

            {isNeet ? (
              <QPair>
                <Q num="Q14" label="Biology — Botany vs Zoology?">
                  <Chips name="bw" val={form.bio_weak} onChange={v => set('bio_weak', v)} opts={[
                    {v:'Botany is weaker',l:'Botany weaker'},{v:'Zoology is weaker',l:'Zoology weaker'},
                    {v:'Both equally weak',l:'Both weak'},{v:'Both okay',l:'Both okay'},
                  ]} />
                </Q>
                <Q num="Q15" label="How many times have you read Biology NCERT cover-to-cover?">
                  <Chips name="nr" val={form.ncert_reads} onChange={v => set('ncert_reads', v)} opts={[
                    {v:'0 — not yet',l:'0 — not yet'},{v:'1 time',l:'1 time'},
                    {v:'2 times',l:'2 times'},{v:'3 or more',l:'3 or more'},
                  ]} />
                </Q>
              </QPair>
            ) : (
              <QPair>
                <Q num="Q14" label="Maths — which area is your biggest weakness?">
                  <Chips name="mw" val={form.math_weak} onChange={v => set('math_weak', v)} opts={[
                    {v:'Calculus',l:'Calculus'},{v:'Algebra',l:'Algebra'},
                    {v:'Coordinate Geometry',l:'Coord. Geometry'},{v:'Trigonometry',l:'Trigonometry'},
                    {v:'Vectors & 3D',l:'Vectors & 3D'},{v:'All weak',l:'All weak'},
                  ]} />
                </Q>
                <Q num="Q15" label="In Maths — concepts or lengthy calculations?">
                  <Chips name="ml" val={form.math_loss} onChange={v => set('math_loss', v)} opts={[
                    {v:'Concepts not clear',l:'Concepts not clear'},{v:'Lengthy calculations',l:'Calculations'},
                    {v:'Both',l:'Both'},{v:"Haven't studied enough yet",l:"Not studied enough"},
                  ]} />
                </Q>
              </QPair>
            )}

            <Q num="Q16" label="Physics — where do you lose marks most?">
              <Chips name="pl" val={form.phy_loss} onChange={v => set('phy_loss', v)} opts={[
                {v:'Silly calculation mistakes',l:'Silly mistakes'},{v:'Concept not clear',l:'Concepts not clear'},
                {v:'Both',l:'Both'},{v:"Haven't studied enough yet",l:"Not studied enough"},
              ]} />
            </Q>

            <Q num="Q17" label="Chemistry — rank weakest to strongest" hint="Organic / Inorganic / Physical">
              <div className="df-row">
                <div className="df-fp"><span>Weakest</span><input type="text" value={form.chem_weak} onChange={txt('chem_weak')} placeholder="e.g. Organic" /></div>
                <div className="df-fp"><span>Middle</span><input type="text" value={form.chem_mid} onChange={txt('chem_mid')} placeholder="e.g. Inorganic" /></div>
                <div className="df-fp"><span>Strongest</span><input type="text" value={form.chem_strong} onChange={txt('chem_strong')} placeholder="e.g. Physical" /></div>
              </div>
            </Q>

            <Q num="Q18" label="Chapters you avoid or dread the most" hint="Any subject. One of the most important questions — be honest.">
              <textarea value={form.dreaded_chapters} onChange={txt('dreaded_chapters')} rows="3" placeholder="e.g. Rotational Motion, Organic mechanisms, Genetics..." />
            </Q>

            <Q num="Q19" label="Do you revise on the same day you study something new?">
              <Chips name="sdr" val={form.same_day_revision} onChange={v => set('same_day_revision', v)} opts={[
                {v:'Always',l:'Always'},{v:'Sometimes',l:'Sometimes'},
                {v:'Rarely',l:'Rarely'},{v:'No system yet',l:'No system yet'},
              ]} />
            </Q>

          </Sec>

          {/* ── E: In Your Own Words ── */}
          <Sec id="E" name="In Your Own Words">
            <div className="df-note">These three questions matter more than everything above. No correct answers.</div>

            <Q num="Q20" label="If you could fix ONE thing about your prep today — what is it?">
              <textarea value={form.fix_one_thing} onChange={txt('fix_one_thing')} rows="3" placeholder="Write freely..." />
            </Q>

            <Q num="Q21" label="What has every coaching or tutor missed about you so far?" hint="If self-studying: what do you feel you're missing that no one has told you?">
              <textarea value={form.what_missed} onChange={txt('what_missed')} rows="3" placeholder="Write freely..." />
            </Q>

            <Q num="Q22" label={isNeet ? 'What does clearing NEET mean to you personally?' : 'What does getting into an IIT mean to you personally?'}>
              <textarea value={form.exam_meaning} onChange={txt('exam_meaning')} rows="3" placeholder="Write freely..." />
            </Q>
          </Sec>

          {/* ── F: Parent Section ── */}
          <Sec id="F" name="Parent Section">
            <div className="df-note">To be filled by the parent or together with the student.</div>

            <Q num="Q23" label="Primary goal for this mentorship">
              <Chips name="pg" val={form.parent_goal} onChange={v => set('parent_goal', v)} opts={[
                ...(isNeet
                  ? [{v:'Government MBBS seat',l:'Government MBBS'},{v:'Any MBBS college',l:'Any MBBS'}]
                  : [{v:'IIT — top branch',l:'IIT — top branch'},{v:'Any IIT seat',l:'Any IIT'},{v:'NIT / good college',l:'NIT / good college'}]
                ),
                {v:'Just clear the exam',l:'Just clear the exam'},
              ]} />
            </Q>

            <QPair>
              <Q num="Q24" label="Target score and rank">
                <div className="df-row two">
                  <div className="df-fp"><span>Target Score</span><input type="text" value={form.target_score} onChange={txt('target_score')} placeholder="e.g. 620" /></div>
                  <div className="df-fp"><span>Target Rank</span><input type="text" value={form.target_rank} onChange={txt('target_rank')} placeholder="e.g. under 10,000" /></div>
                </div>
              </Q>
              <Q num="Q25" label="How involved do you want to be in progress updates?">
                <Chips name="pi" val={form.parent_involvement} onChange={v => set('parent_involvement', v)} opts={[
                  {v:'Weekly',l:'Weekly'},{v:'Monthly',l:'Monthly'},
                  {v:"Only if there's a problem",l:"Only if needed"},
                ]} />
              </Q>
            </QPair>

            <Q num="Q26" label="Anything about your child's situation we should know?">
              <textarea value={form.parent_notes} onChange={txt('parent_notes')} rows="3" placeholder="Any context that would help us mentor better..." />
            </Q>
          </Sec>

          {/* ── Submit ── */}
          <div className="df-submit-wrap">
            <button type="submit" className="df-btn" disabled={submitting}>
              {submitting ? (
                <span className="df-btn-spinner" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
              {submitting ? 'Submitting…' : 'Submit Diagnostic Form'}
            </button>
            <p className="df-sub-note">Your response goes directly to our mentor. We will reach out within 24 hours.</p>
            {error && <div className="df-error">{error}</div>}
          </div>

        </form>
      </div>
    </div>
  );
};

export default DiagnosticForm;
