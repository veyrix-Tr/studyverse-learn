// ─────────────────────────────────────────────────────────────────────────────
// Study Plan Algorithm
// Generates a personalised weekly study plan from diagnostic form answers.
// ─────────────────────────────────────────────────────────────────────────────

// Exam topic frequency data (avg questions per topic, JEE Mains / NEET 2019–2024)
const TOPIC_DATA = {
  jee: {
    Physics: [
      { name: 'Electrostatics & Current Electricity', freq: 9, keywords: ['electrostatics', 'current', 'electricity', 'capacitor', 'resistor'] },
      { name: "Mechanics — Newton's Laws & Work-Energy", freq: 7, keywords: ['mechanics', 'newton', 'work', 'energy', 'force', 'friction', 'momentum'] },
      { name: 'Modern Physics', freq: 5, keywords: ['modern', 'photoelectric', 'nuclear', 'radiation', 'semiconductor', 'atom'] },
      { name: 'Magnetism & EM Induction', freq: 5, keywords: ['magnetism', 'magnetic', 'induction', 'em', 'faraday', 'electromagnetic'] },
      { name: 'Optics (Ray & Wave)', freq: 4, keywords: ['optics', 'ray', 'wave optics', 'lens', 'mirror', 'refraction', 'diffraction'] },
      { name: 'Rotational Motion', freq: 4, keywords: ['rotation', 'rotational', 'torque', 'angular', 'moment of inertia'] },
      { name: 'Waves & SHM', freq: 3, keywords: ['waves', 'shm', 'oscillation', 'sound', 'simple harmonic'] },
      { name: 'Thermodynamics', freq: 3, keywords: ['thermodynamics', 'heat', 'temperature', 'entropy', 'carnot'] },
      { name: 'Kinematics', freq: 2, keywords: ['kinematics', 'projectile', 'motion', 'velocity', 'acceleration'] },
      { name: 'Gravitation', freq: 2, keywords: ['gravitation', 'gravity', 'satellite', 'orbit', 'kepler'] },
    ],
    Chemistry: [
      { name: 'Organic Reactions & Mechanisms', freq: 10, keywords: ['organic', 'reaction', 'mechanism', 'aldol', 'cannizzaro', 'markovnikov', 'sn1', 'sn2', 'named reaction'] },
      { name: 'Chemical Bonding & Molecular Structure', freq: 3, keywords: ['bonding', 'hybridization', 'vsepr', 'molecular', 'structure', 'ionic', 'covalent'] },
      { name: 'Coordination Compounds', freq: 3, keywords: ['coordination', 'ligand', 'complex', 'cfse', 'isomerism'] },
      { name: 'Chemical Equilibrium', freq: 3, keywords: ['equilibrium', 'le chatelier', 'ionic', 'buffer', 'kp', 'kc'] },
      { name: 'Electrochemistry', freq: 3, keywords: ['electrochemistry', 'electrolysis', 'galvanic', 'cell', 'electrode', 'nernst'] },
      { name: 'Thermodynamics (Chem)', freq: 3, keywords: ['thermodynamics', 'enthalpy', 'entropy', 'gibbs', 'hess', 'bond energy'] },
      { name: 'p-Block Elements', freq: 3, keywords: ['p-block', 'p block', 'nitrogen', 'oxygen', 'halogen', 'noble gas', 'group 15', 'group 16', 'group 17'] },
      { name: 'd & f Block Elements', freq: 2, keywords: ['d-block', 'd block', 'transition', 'f-block', 'lanthanide', 'actinide'] },
      { name: 'Chemical Kinetics', freq: 2, keywords: ['kinetics', 'rate', 'activation energy', 'arrhenius', 'half life', 'order'] },
      { name: 'Solutions & Colligative Properties', freq: 2, keywords: ['solutions', 'colligative', 'osmosis', 'boiling point', 'freezing point', 'vapour pressure'] },
      { name: 'Atomic Structure & Periodicity', freq: 2, keywords: ['atomic', 'structure', 'periodic', 'periodicity', 'bohr', 'quantum', 'orbital'] },
    ],
    Mathematics: [
      { name: 'Integration (Definite & Indefinite)', freq: 6, keywords: ['integration', 'integral', 'calculus', 'definite', 'indefinite', 'area under curve'] },
      { name: 'Coordinate Geometry (Circles & Conics)', freq: 6, keywords: ['coordinate', 'geometry', 'circle', 'parabola', 'ellipse', 'hyperbola', 'conic', 'straight line'] },
      { name: 'Vectors & 3D Geometry', freq: 4, keywords: ['vectors', 'vector', '3d', 'three dimensional', 'plane', 'line in space', 'dot product', 'cross product'] },
      { name: 'Probability & Permutation-Combination', freq: 3, keywords: ['probability', 'permutation', 'combination', 'p&c', 'bayes', 'binomial distribution'] },
      { name: 'Limits, Continuity & Differentiability', freq: 3, keywords: ['limits', 'continuity', 'differentiability', 'differentiation', 'lhopital', 'derivative'] },
      { name: 'Complex Numbers', freq: 3, keywords: ['complex', 'imaginary', 'argand', 'euler', 'de moivre'] },
      { name: 'Matrices & Determinants', freq: 2, keywords: ['matrices', 'matrix', 'determinant', 'inverse', 'eigenvalue'] },
      { name: 'Sequences & Series', freq: 2, keywords: ['sequences', 'series', 'ap', 'gp', 'hp', 'arithmetic', 'geometric', 'harmonic'] },
      { name: 'Binomial Theorem', freq: 2, keywords: ['binomial', 'binomial theorem', 'expansion', 'coefficient'] },
      { name: 'Differential Equations', freq: 2, keywords: ['differential equations', 'ode', 'variable separable', 'linear differential'] },
      { name: 'Trigonometry', freq: 2, keywords: ['trigonometry', 'trig', 'sine', 'cosine', 'inverse trig', 'identities'] },
    ],
  },
  neet: {
    Biology: [
      { name: 'Human Physiology', freq: 22, keywords: ['physiology', 'digestion', 'respiration', 'circulation', 'excretion', 'neural', 'muscle', 'nervous'] },
      { name: 'Genetics & Evolution', freq: 13, keywords: ['genetics', 'mendelian', 'dna', 'rna', 'inheritance', 'mutation', 'evolution', 'molecular basis', 'replication', 'transcription', 'translation'] },
      { name: 'Ecology & Environment', freq: 13, keywords: ['ecology', 'ecosystem', 'environment', 'food chain', 'biodiversity', 'succession', 'population'] },
      { name: 'Cell Biology & Biomolecules', freq: 9, keywords: ['cell', 'biomolecule', 'protein', 'carbohydrate', 'lipid', 'enzyme', 'cell division', 'mitosis', 'meiosis'] },
      { name: 'Plant Physiology', freq: 9, keywords: ['plant physiology', 'photosynthesis', 'respiration plant', 'transport', 'mineral nutrition', 'growth', 'development'] },
      { name: 'Reproduction', freq: 7, keywords: ['reproduction', 'reproductive', 'flower', 'fruit', 'seed', 'embryo', 'human reproduction', 'contraception'] },
      { name: 'Plant & Animal Kingdom', freq: 7, keywords: ['kingdom', 'diversity', 'classification', 'bryophytes', 'pteridophytes', 'gymnosperm', 'angiosperm', 'animal kingdom', 'phylum'] },
      { name: 'Biotechnology', freq: 4, keywords: ['biotechnology', 'recombinant', 'pcr', 'gel electrophoresis', 'clone', 'gmo', 'restriction enzyme'] },
      { name: 'Structural Organisation', freq: 4, keywords: ['structural', 'tissue', 'organ', 'earthworm', 'cockroach', 'frog', 'morphology'] },
    ],
    Physics: [
      { name: 'Current Electricity & Electrostatics', freq: 9, keywords: ['current', 'electricity', 'electrostatics', 'resistor', 'capacitor', 'ohm', 'kirchhoff'] },
      { name: "Mechanics — Newton's Laws & Work-Energy", freq: 8, keywords: ['mechanics', 'newton', 'force', 'work', 'energy', 'momentum', 'friction'] },
      { name: 'Modern Physics & Semiconductor', freq: 7, keywords: ['modern physics', 'photoelectric', 'semiconductor', 'nuclear', 'atom', 'radiation'] },
      { name: 'Optics', freq: 6, keywords: ['optics', 'lens', 'mirror', 'refraction', 'wave optics', 'diffraction'] },
      { name: 'Thermodynamics & Kinetic Theory', freq: 4, keywords: ['thermodynamics', 'heat', 'kinetic theory', 'gas laws', 'entropy'] },
      { name: 'Waves & Oscillations', freq: 4, keywords: ['waves', 'sound', 'oscillation', 'shm', 'doppler'] },
      { name: 'Rotational Motion & Gravitation', freq: 4, keywords: ['rotation', 'gravitation', 'satellite', 'angular', 'torque'] },
      { name: 'EM Induction & Alternating Current', freq: 3, keywords: ['electromagnetic', 'induction', 'alternating current', 'ac', 'transformer', 'faraday'] },
    ],
    Chemistry: [
      { name: 'Organic Chemistry (Reactions & GOC)', freq: 14, keywords: ['organic', 'goc', 'reaction', 'mechanism', 'hydrocarbon', 'alcohol', 'aldehyde', 'ketone', 'amine', 'carbonyl'] },
      { name: 'Physical Chemistry (Thermodynamics, Equilibrium, Kinetics)', freq: 13, keywords: ['thermodynamics', 'equilibrium', 'kinetics', 'solutions', 'electrochemistry', 'physical chemistry'] },
      { name: 'Inorganic (p-Block, d-Block, Coordination)', freq: 12, keywords: ['inorganic', 'p-block', 'd-block', 'coordination', 'periodicity', 'periodic table', 'metallurgy'] },
      { name: 'Chemical Bonding & Structure', freq: 4, keywords: ['bonding', 'hybridization', 'vsepr', 'molecular structure'] },
      { name: 'Electrochemistry & Surface Chemistry', freq: 2, keywords: ['electrochemistry', 'surface', 'colloid', 'adsorption'] },
    ],
  },
};

// Subject max marks (for score normalisation)
const SUBJECT_MAX = {
  jee: { Physics: 100, Chemistry: 100, Mathematics: 100 },
  neet: { Physics: 180, Chemistry: 180, Biology: 360 },
};

// Approach hints per topic type
const APPROACH_HINTS = {
  'Electrostatics': 'NCERT → Coulomb\'s Law → Electric Field → Gauss\'s Law → PYQs',
  'Current Electricity': 'Focus on Kirchhoff\'s Laws circuits, Wheatstone bridge → PYQs',
  'Mechanics': 'Free Body Diagrams first → Energy conservation → 10 PYQs daily',
  'Integration': 'Substitution → Parts → Partial fractions → 5 problems/day',
  'Coordinate Geometry': 'Standard forms only → plug-and-solve approach → PYQs',
  'Organic': 'Mechanism logic (not rote) → Named reactions list → PYQ patterns',
  'Human Physiology': 'NCERT line-by-line → diagrams from memory → previous year MCQs',
  'Genetics': 'Punnett squares daily → molecular basis diagrams → NCERT examples',
  'default': 'NCERT first → concept clarity → previous year questions → mock test',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseFloat2(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function calcDaysToExam(targetDate, isNEET) {
  if (targetDate) {
    const d = new Date(targetDate);
    if (!isNaN(d.getTime())) {
      const diff = Math.ceil((d - new Date()) / 86400000);
      if (diff > 0 && diff < 1000) return diff;
    }
  }
  return isNEET ? 180 : 240;
}

function getApproach(topicName) {
  for (const [key, hint] of Object.entries(APPROACH_HINTS)) {
    if (topicName.toLowerCase().includes(key.toLowerCase())) return hint;
  }
  return APPROACH_HINTS.default;
}

function normaliseScore(raw, max) {
  if (raw === null || raw === undefined) return null;
  return Math.min(Math.round((raw / max) * 100), 100);
}

function matchesKeywords(text, keywords) {
  if (!text) return false;
  const t = text.toLowerCase();
  return keywords.some(k => t.includes(k));
}

function topicWeaknessScore(topicKeywords, weakFields) {
  // Returns 0-3 scale: 0=none, 1=mild, 2=weak, 3=dreaded
  let score = 0;
  if (matchesKeywords(weakFields.phy_loss, topicKeywords)) score = Math.max(score, 2);
  if (matchesKeywords(weakFields.chem_weak, topicKeywords)) score = Math.max(score, 2);
  if (matchesKeywords(weakFields.chem_mid, topicKeywords)) score = Math.max(score, 1);
  if (matchesKeywords(weakFields.math_weak, topicKeywords)) score = Math.max(score, 2);
  if (matchesKeywords(weakFields.math_loss, topicKeywords)) score = Math.max(score, 2);
  if (matchesKeywords(weakFields.bio_weak, topicKeywords)) score = Math.max(score, 2);
  if (matchesKeywords(weakFields.dreaded_chapters, topicKeywords)) score = Math.max(score, 3);
  if (matchesKeywords(weakFields.fix_one_thing, topicKeywords)) score = Math.max(score, 2);
  return score;
}

// ── Main algorithm ────────────────────────────────────────────────────────────

function generateStudyPlan(answers, liveScores = null) {
  if (!answers) return null;

  const isNEET   = (answers.exam_target || '').toLowerCase().includes('neet');
  const examType = isNEET ? 'neet' : 'jee';
  const topics   = TOPIC_DATA[examType];
  const subMax   = SUBJECT_MAX[examType];

  const subjects  = isNEET
    ? ['Biology', 'Physics', 'Chemistry']
    : ['Physics', 'Chemistry', 'Mathematics'];

  const studyHoursPerDay = parseFloat2(answers.study_hours) || 5;
  const daysToExam       = calcDaysToExam(answers.target_date, isNEET);
  const weeksToExam      = Math.max(Math.floor(daysToExam / 7), 3);
  const weeklyHours      = Math.round(studyHoursPerDay * 7);

  // ── Subject scores: live weekly scores override diagnostic mock scores ───
  // liveScores = { Physics: 62, Chemistry: 55 } (already %, from WeeklyScore)
  // Falls back to diagnostic mock_s1/s2/s3 if no weekly data (free plan)
  const scorePct = {};
  for (let i = 0; i < subjects.length; i++) {
    const subj = subjects[i];
    if (liveScores && liveScores[subj] !== undefined) {
      scorePct[subj] = liveScores[subj]; // live test data — most accurate
    } else {
      const raw = parseFloat2(answers[`mock_s${i + 1}`]);
      scorePct[subj] = raw !== null ? normaliseScore(raw, subMax[subj] || 100) : null;
    }
  }

  // ── Weak fields object for topic matching ────────────────────────────────
  const weakFields = {
    phy_loss:         answers.phy_loss || '',
    chem_weak:        answers.chem_weak || '',
    chem_mid:         answers.chem_mid || '',
    math_weak:        answers.math_weak || '',
    math_loss:        answers.math_loss || '',
    bio_weak:         answers.bio_weak || '',
    dreaded_chapters: answers.dreaded_chapters || '',
    fix_one_thing:    answers.fix_one_thing || '',
  };

  // ── Subject priority (40-35-25 rule adjusted by weakness) ───────────────
  const subjectPriority = subjects.map(subject => {
    const pct        = scorePct[subject];
    const weakness   = pct !== null ? (100 - pct) / 100 : 0.55; // default moderate
    const isHardest  = (answers.hardest_subject || '').toLowerCase().includes(subject.toLowerCase());
    const examWeight = isNEET
      ? { Biology: 0.50, Physics: 0.25, Chemistry: 0.25 }[subject] || 0.33
      : 0.33;
    const priorityScore = weakness * examWeight * (isHardest ? 1.3 : 1);

    let urgency, urgencyColor;
    if (pct === null)     { urgency = 'no data';  urgencyColor = 'gray'; }
    else if (pct < 35)   { urgency = 'urgent';   urgencyColor = 'red'; }
    else if (pct < 55)   { urgency = 'high';     urgencyColor = 'orange'; }
    else if (pct < 72)   { urgency = 'moderate'; urgencyColor = 'yellow'; }
    else                  { urgency = 'maintain'; urgencyColor = 'green'; }

    const isLive = liveScores && liveScores[subject] !== undefined;
    const reason = pct !== null
      ? `${isLive ? 'Latest test' : 'Diagnostic mock'} ${Math.round(pct)}%${isHardest ? ' · self-reported hardest' : ''}`
      : isHardest
        ? 'Self-reported hardest — treating as high priority'
        : 'No test data yet';

    return { subject, scorePct: pct, priorityScore, urgency, urgencyColor, reason };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  // ── Time allocation ──────────────────────────────────────────────────────
  const allocationWeights = [0.40, 0.35, 0.25];
  const timeAlloc = {};
  subjectPriority.forEach(({ subject }, i) => {
    timeAlloc[subject] = Math.round(weeklyHours * (allocationWeights[i] || 0.25));
  });

  // ── Prioritise topics per subject ────────────────────────────────────────
  const topicPlan = {};
  for (const subject of subjects) {
    const subTopics = topics[subject] || [];
    topicPlan[subject] = subTopics.map(t => {
      const weakScore = topicWeaknessScore(t.keywords, weakFields);
      // Priority = (exam frequency × weakness multiplier)
      const multiplier = [1, 1.5, 2.5, 3.5][weakScore] || 1;
      const priority   = t.freq * multiplier;
      let label, color;
      if (priority >= 20)     { label = 'Urgent';   color = 'red'; }
      else if (priority >= 12) { label = 'High';     color = 'orange'; }
      else if (priority >= 7)  { label = 'Important';color = 'yellow'; }
      else                     { label = 'Maintain'; color = 'green'; }
      return { ...t, weakScore, priority, label, color };
    }).sort((a, b) => b.priority - a.priority);
  }

  // ── "This Week" focus (max 4 cards) ─────────────────────────────────────
  const thisWeek = [];
  for (const { subject } of subjectPriority) {
    if (thisWeek.length >= 4) break;
    const priorityTopics = (topicPlan[subject] || [])
      .filter(t => t.label === 'Urgent' || t.label === 'High')
      .slice(0, thisWeek.length < 2 ? 2 : 1);

    const fallback = (topicPlan[subject] || []).slice(0, 1);
    const picks    = priorityTopics.length > 0 ? priorityTopics : fallback;

    for (const t of picks) {
      if (thisWeek.length >= 4) break;
      const hours = Math.round(timeAlloc[subject] / (picks.length || 1));
      thisWeek.push({
        subject,
        topic:    t.name,
        hours:    Math.max(hours, 2),
        label:    t.label,
        color:    t.color,
        reason:   buildTopicReason(t, subject, answers, scorePct),
        approach: getApproach(t.name),
      });
    }
  }

  // ── 4-Week roadmap ────────────────────────────────────────────────────────
  const weeklyRoadmap = buildWeeklyRoadmap(subjectPriority, topicPlan, weeksToExam, daysToExam);

  // ── Daily structure ───────────────────────────────────────────────────────
  const dailyStructure = buildDailyStructure(studyHoursPerDay, subjectPriority);

  // ── Habit nudges (max 2) ──────────────────────────────────────────────────
  const habits = buildHabitNudges(answers);

  // ── Mock trend ────────────────────────────────────────────────────────────
  const mockTrend = buildMockTrend(answers);

  // ── Maintain topics (strong subject top topics) ───────────────────────────
  const strongSubject = subjectPriority[subjectPriority.length - 1];
  const maintainTopics = (topicPlan[strongSubject?.subject] || [])
    .slice(0, 2)
    .map(t => ({ subject: strongSubject.subject, topic: t.name, frequency: 'Every 3 days, 30 min' }));

  return {
    overview: {
      daysToExam,
      weeksToExam,
      studyHoursPerDay,
      weeklyHours,
      examTarget: answers.exam_target || (isNEET ? 'NEET UG' : 'JEE'),
      targetScore: answers.target_score || null,
      targetRank:  answers.target_rank  || null,
      syllabusGap: answers.syllabus_coverage || null,
    },
    subjectFocus: subjectPriority.map((s, i) => ({
      ...s,
      hoursPerWeek:   timeAlloc[s.subject] || 0,
      allocationPct:  allocationWeights[i] ? Math.round(allocationWeights[i] * 100) : 25,
    })),
    thisWeek,
    weeklyRoadmap,
    dailyStructure,
    habits,
    mockTrend,
    maintainTopics,
  };
}

// ── Supporting builders ───────────────────────────────────────────────────────

function buildTopicReason(topic, subject, answers, scorePct) {
  const pct = scorePct[subject];
  let reason = '';
  if (topic.weakScore >= 3) reason = 'You marked this as dreaded — high exam weight too.';
  else if (topic.weakScore === 2) reason = `Self-reported weak area + ${topic.freq} questions in past papers.`;
  else if (topic.weakScore === 1) reason = `Moderate gap + ${topic.freq} questions on average.`;
  else if (pct !== null && pct < 50) reason = `${subject} score low (${Math.round(pct)}%) — this topic alone can swing 8–12 marks.`;
  else reason = `${topic.freq} questions on average in past papers — strong ROI.`;
  return reason;
}

function buildWeeklyRoadmap(subjectPriority, topicPlan, weeksToExam, daysToExam) {
  const roadmap = [];
  const topicQueue = {}; // track which topics remain per subject
  for (const { subject } of subjectPriority) {
    topicQueue[subject] = [...(topicPlan[subject] || [])];
  }

  const weekThemes = [
    'Fix Weakest Areas', 'Build Momentum', 'Deepen Concepts',
    'Speed & Accuracy', 'Full Revision Mode', 'Mock & Refine',
  ];

  for (let w = 0; w < Math.min(weeksToExam, 6); w++) {
    const weekTopics = [];
    for (const { subject } of subjectPriority) {
      const picks = topicQueue[subject].splice(0, subjectPriority[0]?.subject === subject ? 2 : 1);
      picks.forEach(t => weekTopics.push({ subject, topic: t.name, label: t.label }));
    }

    const daysLeft = daysToExam - w * 7;
    roadmap.push({
      week: w + 1,
      daysLeft: Math.max(daysLeft, 0),
      theme: weekThemes[w] || `Week ${w + 1}`,
      topics: weekTopics,
    });
  }
  return roadmap;
}

function buildDailyStructure(hoursPerDay, subjectPriority) {
  const [s1, s2, s3] = subjectPriority.map(s => s.subject);
  if (hoursPerDay >= 8) {
    return [
      { slot: 'Early Morning', time: '5–7 AM', hours: 2, label: s1, note: 'Hardest subject, fresh mind' },
      { slot: 'Morning',       time: '8–10 AM', hours: 2, label: s1, note: 'Continue deep work' },
      { slot: 'Afternoon',     time: '12–2 PM', hours: 2, label: s2, note: null },
      { slot: 'Evening',       time: '5–7 PM',  hours: 2, label: s3, note: null },
      { slot: 'Night',         time: '9–9:30 PM', hours: 0.5, label: 'Revision', note: 'Revise today only' },
    ];
  }
  if (hoursPerDay >= 6) {
    return [
      { slot: 'Morning',   time: '7–9 AM',  hours: 2,   label: s1, note: 'Hardest subject first' },
      { slot: 'Afternoon', time: '2–4 PM',  hours: 2,   label: s2, note: null },
      { slot: 'Evening',   time: '6–8 PM',  hours: 1.5, label: s3, note: null },
      { slot: 'Night',     time: '9:30 PM', hours: 0.5, label: 'Revision', note: 'Revise today only' },
    ];
  }
  return [
    { slot: 'Morning',   time: '7–9 AM',  hours: 2,   label: s1, note: 'Hardest first' },
    { slot: 'Afternoon', time: '3–4:30 PM', hours: 1.5, label: s2, note: null },
    { slot: 'Evening',   time: '6–7 PM',  hours: 1,   label: 'Revision', note: 'Revise today only' },
  ];
}

function buildHabitNudges(answers) {
  const nudges = [];

  if (answers.review_mistakes === 'Sometimes' || answers.review_mistakes === 'Never') {
    nudges.push({
      icon: '📝',
      title: 'Review mistakes same day',
      body: 'You said you review mistakes sometimes — make this a rule. Every mock error reviewed within 24h adds an estimated 15–25 marks over a month.',
      impact: '+15–25 marks',
    });
  }

  if (answers.same_day_revision === 'No' || answers.same_day_revision === 'Rarely') {
    nudges.push({
      icon: '🔁',
      title: 'Add same-day revision (30 min before sleep)',
      body: 'Without same-day revision, you forget 60–70% of what you studied by the next morning. 30 minutes before sleep locks it in.',
      impact: '60% better retention',
    });
  }

  if (nudges.length < 2 && (answers.time_mgmt === 'No' || answers.time_mgmt === 'Partially')) {
    nudges.push({
      icon: '⏱',
      title: 'Switch to 50-minute Pomodoro blocks',
      body: 'Study in 50-min blocks with a 10-min break. You mentioned time management is a struggle — this structure removes the decision of when to stop.',
      impact: 'Eliminates decision fatigue',
    });
  }

  return nudges.slice(0, 2);
}

function buildMockTrend(answers) {
  const s1 = parseFloat2(answers.mock_score_1);
  const s2 = parseFloat2(answers.mock_score_2);
  const s3 = parseFloat2(answers.mock_score_3);
  const scores = [s1, s2, s3].filter(s => s !== null);

  if (scores.length < 2) return null;

  const last  = scores[scores.length - 1];
  const first = scores[0];
  const diff  = last - first;
  const trend = diff > 5 ? 'improving' : diff < -5 ? 'declining' : 'stable';
  const latest = scores[scores.length - 1];
  const prev   = scores.length >= 2 ? scores[scores.length - 2] : null;

  return {
    scores,
    trend,
    latest,
    change: prev !== null ? Math.round(latest - prev) : null,
    message: trend === 'improving'
      ? `Up ${Math.abs(Math.round(diff))} marks since first mock — keep the momentum.`
      : trend === 'declining'
        ? `Down ${Math.abs(Math.round(diff))} marks — likely from ignoring weak areas. Address top priority topics first.`
        : 'Score is stable — need a focused week on weak topics to break through the plateau.',
  };
}

module.exports = { generateStudyPlan };
