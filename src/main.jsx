import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const STORAGE_KEYS = {
  scores: 'coderush_high_scores_v1',
  settings: 'coderush_settings_v1',
};

const DEFAULT_SETTINGS = {
  sound: true,
  showTimer: true,
};

const QUIZ_QUESTIONS = [
  {
    question: 'Which React hook is used to store local component state?',
    options: ['useEffect', 'useState', 'useMemo', 'useRef'],
    answer: 'useState',
    explanation: 'useState lets a component remember values between renders and update the UI when they change.',
  },
  {
    question: 'What does Array.prototype.map() return?',
    options: ['A new transformed array', 'The first matching item', 'A boolean', 'The array length'],
    answer: 'A new transformed array',
    explanation: 'map() creates a new array containing the results of calling a function for every element.',
  },
  {
    question: 'Which CSS property controls the space inside an element?',
    options: ['margin', 'gap', 'padding', 'spacing'],
    answer: 'padding',
    explanation: 'Padding is the space between an element’s content and its border.',
  },
  {
    question: 'What is a primary key used for in a database?',
    options: ['Styling rows', 'Uniquely identifying records', 'Encrypting data', 'Sorting columns'],
    answer: 'Uniquely identifying records',
    explanation: 'A primary key uniquely identifies each record in a table.',
  },
  {
    question: 'Which command initializes a new Git repository?',
    options: ['git start', 'git create', 'git init', 'git new'],
    answer: 'git init',
    explanation: 'git init creates the hidden .git directory that turns a folder into a Git repository.',
  },
  {
    question: 'What does HTTP status code 404 usually mean?',
    options: ['Server error', 'Unauthorized', 'Resource not found', 'Success'],
    answer: 'Resource not found',
    explanation: '404 indicates that the server could not find the requested resource.',
  },
];

const BUG_CHALLENGES = [
  {
    title: 'State Update Bug',
    code: `const [count, setCount] = useState(0);\n\nfunction add() {\n  count = count + 1;\n}`,
    options: ['Replace count directly', 'Use setCount(count + 1)', 'Wrap count in JSON', 'Use useMemo'],
    answer: 'Use setCount(count + 1)',
    explanation: 'React state should be updated through its setter. Direct assignment does not schedule a React re-render.',
  },
  {
    title: 'Array Key Bug',
    code: `items.map((item) => (\n  <li key={item.name}>\n    {item.label}\n  </li>\n));`,
    options: ['Keys must be numbers', 'key should be unique and stable', 'Remove key entirely', 'Use className as key'],
    answer: 'key should be unique and stable',
    explanation: 'React keys should identify siblings consistently across renders.',
  },
  {
    title: 'Async Bug',
    code: `async function load() {\n  const response = fetch('/api/tasks');\n  const data = await response.json();\n  return data;\n}`,
    options: ['fetch must be awaited', 'json() should be removed', 'async cannot use await', 'fetch only accepts POST'],
    answer: 'fetch must be awaited',
    explanation: 'fetch returns a Promise, so response must resolve before calling response.json().',
  },
  {
    title: 'Condition Bug',
    code: `const isReady = false;\n\nif (isReady = true) {\n  startGame();\n}`,
    options: ['Use === instead of =', 'Use !== instead of =', 'Remove the if', 'Use let on isReady'],
    answer: 'Use === instead of =',
    explanation: '= assigns a value. === compares values without changing the variable.',
  },
];

const TYPE_SNIPPETS = [
  'const total = income - expenses;',
  'function greet(name) { return `Hello, ${name}!`; }',
  'const activeTasks = tasks.filter((task) => !task.completed);',
  'const doubled = numbers.map((number) => number * 2);',
  'setScore((current) => current + 10);',
  'const user = { name: "Fraterne", role: "Developer" };',
  'const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;',
];

const MEMORY_PATTERNS = [
  ['useState', 'useEffect', 'useMemo', 'useRef'],
  ['HTML', 'CSS', 'JavaScript', 'React'],
  ['SELECT', 'FROM', 'WHERE', 'ORDER BY'],
  ['git add', 'git commit', 'git push', 'git pull'],
  ['props', 'state', 'hooks', 'components'],
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.scores)) || [];
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)) || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveScores(scores) {
  localStorage.setItem(STORAGE_KEYS.scores, JSON.stringify(scores.slice(0, 20)));
}

function App() {
  const [screen, setScreen] = useState('home');
  const [mode, setMode] = useState(null);
  const [difficulty, setDifficulty] = useState('normal');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [round, setRound] = useState(1);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [scores, setScores] = useState(loadScores);
  const [settings, setSettings] = useState(loadSettings);
  const [playerName, setPlayerName] = useState('Player');

  const [quizIndex, setQuizIndex] = useState(0);
  const [bugIndex, setBugIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [typeStartedAt, setTypeStartedAt] = useState(null);
  const [typeComplete, setTypeComplete] = useState(false);
  const [memoryItems, setMemoryItems] = useState([]);
  const [memoryPhase, setMemoryPhase] = useState('show');
  const [memoryInput, setMemoryInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [comboPulse, setComboPulse] = useState(0);

  const intervalRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioReadyRef = useRef(false);

  function getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    return audioContextRef.current;
  }

  function unlockAudio() {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
    audioReadyRef.current = true;
  }

  function playTone(type = 'ui') {
    if (!settings.sound || !audioReadyRef.current) return;
    const context = getAudioContext();
    if (!context || context.state !== 'running') return;

    const sounds = {
      start: { notes: [[392, 0], [523.25, 0.1], [659.25, 0.2]], duration: 0.16, wave: 'sine' },
      correct: { notes: [[523.25, 0], [659.25, 0.08], [783.99, 0.16]], duration: 0.12, wave: 'sine' },
      wrong: { notes: [[220, 0], [164.81, 0.12]], duration: 0.18, wave: 'sawtooth' },
      timeout: { notes: [[330, 0], [247, 0.14], [196, 0.28]], duration: 0.2, wave: 'triangle' },
      complete: { notes: [[392, 0], [523.25, 0.1], [659.25, 0.2], [783.99, 0.3]], duration: 0.14, wave: 'sine' },
      ui: { notes: [[440, 0]], duration: 0.07, wave: 'sine' },
    };
    const sound = sounds[type] || sounds.ui;
    const startAt = context.currentTime + 0.01;

    sound.notes.forEach(([frequency, offset]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = sound.wave;
      oscillator.frequency.setValueAtTime(frequency, startAt + offset);
      gain.gain.setValueAtTime(0.0001, startAt + offset);
      gain.gain.exponentialRampToValueAtTime(0.055, startAt + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + sound.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt + offset);
      oscillator.stop(startAt + offset + sound.duration + 0.02);
    });
  }

  const difficultyConfig = useMemo(() => ({
    easy: { quizTime: 35, bugTime: 30, typeBonus: 1, memoryTime: 4 },
    normal: { quizTime: 25, bugTime: 22, typeBonus: 1.2, memoryTime: 3 },
    hard: { quizTime: 18, bugTime: 16, typeBonus: 1.5, memoryTime: 2 },
  }[difficulty]), [difficulty]);

  useEffect(() => () => {
    window.clearInterval(intervalRef.current);
    window.clearTimeout(feedbackTimeoutRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
  }, []);

  useEffect(() => {
    if (!settings.showTimer || !['quiz', 'bug', 'memory'].includes(mode) || screen !== 'game') return;
    window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(intervalRef.current);
          handleTimeOut();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalRef.current);
  }, [screen, mode, round, quizIndex, bugIndex, memoryPhase, settings.showTimer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handler = (event) => {
      if (screen !== 'game') return;
      if (mode === 'quiz' && ['1', '2', '3', '4'].includes(event.key)) {
        chooseQuiz(QUIZ_QUESTIONS[quizIndex].options[Number(event.key) - 1]);
      }
      if (mode === 'bug' && ['1', '2', '3', '4'].includes(event.key)) {
        chooseBug(BUG_CHALLENGES[bugIndex].options[Number(event.key) - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const currentQuiz = QUIZ_QUESTIONS[quizIndex % QUIZ_QUESTIONS.length];
  const currentBug = BUG_CHALLENGES[bugIndex % BUG_CHALLENGES.length];
  const currentType = TYPE_SNIPPETS[(round - 1) % TYPE_SNIPPETS.length];
  const accuracy = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0;

  function startGame(selectedMode) {
    unlockAudio();
    playTone('start');
    setMode(selectedMode);
    setScreen('game');
    setScore(0);
    setStreak(0);
    setLives(3);
    setRound(1);
    setBestCombo(0);
    setCorrect(0);
    setWrong(0);
    setFeedback(null);
    setQuizIndex(0);
    setBugIndex(0);
    setTimeLeft(selectedMode === 'quiz' ? difficultyConfig.quizTime : selectedMode === 'bug' ? difficultyConfig.bugTime : selectedMode === 'memory' ? difficultyConfig.memoryTime : 60);
    setTypedText('');
    setTypeStartedAt(null);
    setTypeComplete(false);
    setMemoryRound();
  }

  function setMemoryRound() {
    const source = MEMORY_PATTERNS[(round - 1) % MEMORY_PATTERNS.length];
    setMemoryItems([...source].sort(() => Math.random() - 0.5));
    setMemoryInput('');
    setMemoryPhase('show');
  }

  useEffect(() => {
    if (screen !== 'game' || mode !== 'memory' || memoryPhase !== 'show') return;
    const timer = window.setTimeout(() => {
      setMemoryPhase('input');
      setTimeLeft(Math.max(8, difficulty === 'hard' ? 8 : 12));
    }, difficultyConfig.memoryTime * 1000);
    return () => window.clearTimeout(timer);
  }, [screen, mode, memoryPhase, round, difficultyConfig.memoryTime, difficulty]);

  function showFeedback(type, message) {
    playTone(type === 'correct' ? 'correct' : 'wrong');
    setFeedback({ type, message });
    window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(null), 1200);
  }

  function award(points) {
    setScore((value) => value + Math.round(points));
    setStreak((value) => {
      const next = value + 1;
      setBestCombo((best) => Math.max(best, next));
      setComboPulse((pulse) => pulse + 1);
      return next;
    });
    setCorrect((value) => value + 1);
  }

  function penalize() {
    setStreak(0);
    setWrong((value) => value + 1);
    setLives((value) => {
      const next = value - 1;
      if (next <= 0) window.setTimeout(endGame, 350);
      return next;
    });
  }

  function handleTimeOut() {
    playTone('timeout');
    penalize();
    setFeedback({ type: 'wrong', message: 'Time is up!' });
    window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => setFeedback(null), 1200);
    if (mode === 'quiz') nextQuiz();
    if (mode === 'bug') nextBug();
    if (mode === 'memory') nextMemory();
  }

  function chooseQuiz(option) {
    if (feedback) return;
    if (option === currentQuiz.answer) {
      award(100 + streak * 20 + timeLeft * 3);
      showFeedback('correct', 'Correct!');
    } else {
      penalize();
      showFeedback('wrong', currentQuiz.explanation);
    }
    window.setTimeout(nextQuiz, 500);
  }

  function nextQuiz() {
    setQuizIndex((value) => (value + 1) % QUIZ_QUESTIONS.length);
    setRound((value) => value + 1);
    setTimeLeft(difficultyConfig.quizTime);
  }

  function chooseBug(option) {
    if (feedback) return;
    if (option === currentBug.answer) {
      award(130 + streak * 25 + timeLeft * 4);
      showFeedback('correct', 'Bug fixed!');
    } else {
      penalize();
      showFeedback('wrong', currentBug.explanation);
    }
    window.setTimeout(nextBug, 500);
  }

  function nextBug() {
    setBugIndex((value) => (value + 1) % BUG_CHALLENGES.length);
    setRound((value) => value + 1);
    setTimeLeft(difficultyConfig.bugTime);
  }

  function handleTypingChange(event) {
    const value = event.target.value;
    if (!typeStartedAt && value.length) setTypeStartedAt(Date.now());
    setTypedText(value);
    if (value === currentType && !typeComplete) {
      const seconds = Math.max(0.4, (Date.now() - (typeStartedAt || Date.now())) / 1000);
      const words = currentType.trim().split(/\s+/).length;
      const wpm = Math.round((words / seconds) * 60);
      award(Math.round(160 * difficultyConfig.typeBonus + wpm));
      setTypeComplete(true);
      playTone('complete');
      showFeedback('correct', `${wpm} WPM — clean run!`);
      window.setTimeout(() => {
        setRound((value) => value + 1);
        setTypedText('');
        setTypeStartedAt(null);
        setTypeComplete(false);
      }, 900);
    }
  }

  function submitMemory() {
    if (memoryPhase !== 'input' || feedback) return;
    const expected = memoryItems.join(' ');
    if (memoryInput.trim() === expected) {
      award(180 + streak * 30 + timeLeft * 5);
      showFeedback('correct', 'Perfect memory!');
    } else {
      penalize();
      showFeedback('wrong', `Sequence: ${expected}`);
    }
    window.setTimeout(nextMemory, 600);
  }

  function nextMemory() {
    setRound((value) => value + 1);
    setTimeLeft(difficultyConfig.memoryTime);
    setMemoryRound();
  }

  function endGame() {
    window.clearInterval(intervalRef.current);
    const entry = {
      name: playerName.trim() || 'Player',
      score,
      mode,
      difficulty,
      accuracy,
      date: new Date().toISOString(),
    };
    const nextScores = [...scores, entry].sort((a, b) => b.score - a.score).slice(0, 20);
    setScores(nextScores);
    saveScores(nextScores);
    setScreen('result');
  }

  function resetScores() {
    localStorage.removeItem(STORAGE_KEYS.scores);
    setScores([]);
  }

  function goHome() {
    window.clearInterval(intervalRef.current);
    setScreen('home');
    setMode(null);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="Back to home">
          <span className="brand-mark">&lt;/&gt;</span>
          <span>CodeRush</span>
        </button>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={() => setScreen('scores')}>🏆 Scores</button>
          <button className="icon-button" onClick={() => setScreen('settings')} aria-label="Settings">⚙</button>
        </div>
      </header>

      <main className="page">
        {screen === 'home' && <HomeScreen difficulty={difficulty} setDifficulty={setDifficulty} startGame={startGame} scores={scores} />}
        {screen === 'game' && (
          <GameScreen
            mode={mode}
            difficulty={difficulty}
            score={score}
            streak={streak}
            lives={lives}
            round={round}
            timeLeft={timeLeft}
            settings={settings}
            currentQuiz={currentQuiz}
            currentBug={currentBug}
            currentType={currentType}
            typedText={typedText}
            typeComplete={typeComplete}
            memoryItems={memoryItems}
            memoryPhase={memoryPhase}
            memoryInput={memoryInput}
            setMemoryInput={setMemoryInput}
            chooseQuiz={chooseQuiz}
            chooseBug={chooseBug}
            handleTypingChange={handleTypingChange}
            submitMemory={submitMemory}
            feedback={feedback}
            comboPulse={comboPulse}
            onExit={goHome}
          />
        )}
        {screen === 'result' && (
          <ResultScreen score={score} accuracy={accuracy} correct={correct} wrong={wrong} bestCombo={bestCombo} mode={mode} onPlayAgain={() => startGame(mode)} onHome={goHome} />
        )}
        {screen === 'scores' && <ScoresScreen scores={scores} resetScores={resetScores} onBack={goHome} />}
        {screen === 'settings' && <SettingsScreen settings={settings} setSettings={setSettings} onBack={goHome} />}
      </main>
    </div>
  );
}

function HomeScreen({ difficulty, setDifficulty, startGame, scores }) {
  const highScore = scores[0]?.score || 0;
  return (
    <section className="home-grid">
      <div className="hero-card">
        <div className="eyebrow"><span className="pulse-dot" /> READY TO CODE</div>
        <h1>Think fast.<br /><span>Code faster.</span></h1>
        <p>Four fast-paced developer challenges designed to sharpen your JavaScript, React, SQL, Git and problem-solving skills.</p>
        <div className="hero-meta">
          <div><strong>{scores.length}</strong><span>Scores saved</span></div>
          <div><strong>{highScore.toLocaleString()}</strong><span>Best score</span></div>
          <div><strong>4</strong><span>Game modes</span></div>
        </div>
      </div>

      <div className="mode-panel">
        <div className="section-heading">
          <div><span className="eyebrow">CHOOSE YOUR CHALLENGE</span><h2>Pick a mode</h2></div>
          <div className="difficulty-switch">
            {['easy', 'normal', 'hard'].map((level) => (
              <button key={level} className={difficulty === level ? 'active' : ''} onClick={() => setDifficulty(level)}>{level}</button>
            ))}
          </div>
        </div>
        <div className="mode-grid">
          <GameModeCard icon="🧠" title="Code Quiz" description="Race through developer questions." accent="violet" onClick={() => startGame('quiz')} />
          <GameModeCard icon="🐞" title="Bug Hunter" description="Spot the bug before time runs out." accent="orange" onClick={() => startGame('bug')} />
          <GameModeCard icon="⌨️" title="Code Sprint" description="Type snippets with speed and accuracy." accent="cyan" onClick={() => startGame('typing')} />
          <GameModeCard icon="🧩" title="Memory Stack" description="Remember the sequence. Rebuild it." accent="pink" onClick={() => startGame('memory')} />
        </div>
      </div>
    </section>
  );
}

function GameModeCard({ icon, title, description, accent, onClick }) {
  return (
    <button className={`game-mode-card ${accent}`} onClick={onClick}>
      <span className="mode-icon">{icon}</span>
      <span className="mode-title">{title}</span>
      <span className="mode-description">{description}</span>
      <span className="mode-arrow">→</span>
    </button>
  );
}

function GameScreen(props) {
  const {
    mode, score, streak, lives, round, timeLeft, settings, currentQuiz, currentBug, currentType,
    typedText, typeComplete, memoryItems, memoryPhase, memoryInput, setMemoryInput,
    chooseQuiz, chooseBug, handleTypingChange, submitMemory, feedback, comboPulse, onExit,
  } = props;
  const progress = clamp((timeLeft / 30) * 100, 0, 100);
  return (
    <section className="game-screen">
      <div className="game-topline">
        <button className="back-button" onClick={onExit}>← Exit</button>
        <div className="game-mode-label">{mode === 'quiz' ? '🧠 Code Quiz' : mode === 'bug' ? '🐞 Bug Hunter' : mode === 'typing' ? '⌨️ Code Sprint' : '🧩 Memory Stack'}</div>
        <div className="round-label">ROUND {String(round).padStart(2, '0')}</div>
      </div>

      <div className="hud-grid">
        <StatBox label="SCORE" value={score.toLocaleString()} />
        <StatBox label="STREAK" value={`🔥 ${streak}x`} pulse={comboPulse} />
        <StatBox label="LIVES" value={'❤️'.repeat(lives) || '🖤'} />
        {settings.showTimer && <StatBox label="TIME" value={`${timeLeft}s`} urgent={timeLeft <= 5} />}
      </div>

      {settings.showTimer && <div className="timer-line"><span style={{ width: `${progress}%` }} /></div>}

      <div className="challenge-card">
        {mode === 'quiz' && <QuizChallenge question={currentQuiz} choose={chooseQuiz} />}
        {mode === 'bug' && <BugChallenge challenge={currentBug} choose={chooseBug} />}
        {mode === 'typing' && <TypingChallenge snippet={currentType} value={typedText} onChange={handleTypingChange} complete={typeComplete} />}
        {mode === 'memory' && <MemoryChallenge items={memoryItems} phase={memoryPhase} value={memoryInput} setValue={setMemoryInput} submit={submitMemory} />}
      </div>

      {feedback && <div className={`feedback ${feedback.type}`}>{feedback.type === 'correct' ? '✓' : '×'} {feedback.message}</div>}
    </section>
  );
}

function StatBox({ label, value, urgent, pulse }) {
  return <div className={`stat-box ${urgent ? 'urgent' : ''} ${pulse ? 'pulse' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}

function QuizChallenge({ question, choose }) {
  return (
    <div>
      <span className="eyebrow">QUESTION</span>
      <h2 className="challenge-title">{question.question}</h2>
      <div className="answer-grid">
        {question.options.map((option, index) => <button key={option} className="answer-button" onClick={() => choose(option)}><kbd>{index + 1}</kbd><span>{option}</span></button>)}
      </div>
      <p className="hint">Press 1–4 to answer.</p>
    </div>
  );
}

function BugChallenge({ challenge, choose }) {
  return (
    <div>
      <span className="eyebrow">FIND THE BUG</span>
      <h2 className="challenge-title">{challenge.title}</h2>
      <pre className="code-panel"><code>{challenge.code}</code></pre>
      <div className="answer-grid">
        {challenge.options.map((option, index) => <button key={option} className="answer-button" onClick={() => choose(option)}><kbd>{index + 1}</kbd><span>{option}</span></button>)}
      </div>
      <p className="hint">Press 1–4 to choose the fix.</p>
    </div>
  );
}

function TypingChallenge({ snippet, value, onChange, complete }) {
  return (
    <div>
      <span className="eyebrow">CODE SPRINT</span>
      <h2 className="challenge-title">Type the snippet exactly.</h2>
      <pre className="code-panel typing-target"><code>{snippet}</code></pre>
      <textarea autoFocus value={value} onChange={onChange} disabled={complete} className="typing-input" placeholder="Start typing here..." spellCheck="false" />
      <div className="typing-meta"><span>{value.length} / {snippet.length} characters</span><span>{complete ? '✓ Complete' : 'Accuracy matters'}</span></div>
    </div>
  );
}

function MemoryChallenge({ items, phase, value, setValue, submit }) {
  return (
    <div>
      <span className="eyebrow">MEMORY STACK</span>
      <h2 className="challenge-title">{phase === 'show' ? 'Memorize the sequence.' : 'Rebuild the sequence.'}</h2>
      <div className={`memory-board ${phase}`}>
        {phase === 'show' ? items.map((item) => <span key={item}>{item}</span>) : <span className="memory-hidden">?</span>}
      </div>
      {phase === 'input' && (
        <div className="memory-input-row">
          <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Example: useState useEffect useMemo useRef" />
          <button className="primary-button" onClick={submit}>Submit</button>
        </div>
      )}
      <p className="hint">{phase === 'show' ? 'The sequence will disappear automatically.' : 'Separate each item with a single space.'}</p>
    </div>
  );
}

function ResultScreen({ score, accuracy, correct, wrong, bestCombo, mode, onPlayAgain, onHome }) {
  return (
    <section className="result-card">
      <div className="result-icon">🏆</div>
      <span className="eyebrow">RUN COMPLETE</span>
      <h1>{score.toLocaleString()}</h1>
      <p className="result-message">Nice run. Your score has been saved locally.</p>
      <div className="result-stats">
        <StatBox label="ACCURACY" value={`${accuracy}%`} />
        <StatBox label="CORRECT" value={correct} />
        <StatBox label="MISSED" value={wrong} />
        <StatBox label="BEST STREAK" value={`${bestCombo}x`} />
      </div>
      <div className="result-actions">
        <button className="primary-button" onClick={onPlayAgain}>Play Again</button>
        <button className="ghost-button large" onClick={onHome}>Back to Home</button>
      </div>
      <small>Mode: {mode}</small>
    </section>
  );
}

function ScoresScreen({ scores, resetScores, onBack }) {
  return (
    <section className="content-card">
      <div className="page-heading"><div><span className="eyebrow">LOCAL LEADERBOARD</span><h1>High Scores</h1></div><button className="ghost-button" onClick={onBack}>← Home</button></div>
      {scores.length ? (
        <div className="score-table">
          <div className="score-row table-head"><span>#</span><span>PLAYER</span><span>MODE</span><span>DIFFICULTY</span><span>SCORE</span></div>
          {scores.map((entry, index) => <div className="score-row" key={`${entry.date}-${index}`}><span>#{index + 1}</span><span className="player-cell">{index === 0 ? '👑 ' : ''}{entry.name}</span><span>{entry.mode}</span><span>{entry.difficulty}</span><strong>{entry.score.toLocaleString()}</strong></div>)}
        </div>
      ) : <div className="empty-state">No scores yet. Start a challenge and claim the top spot.</div>}
      {scores.length > 0 && <button className="danger-button" onClick={resetScores}>Clear saved scores</button>}
    </section>
  );
}

function SettingsScreen({ settings, setSettings, onBack }) {
  return (
    <section className="content-card narrow">
      <div className="page-heading"><div><span className="eyebrow">PREFERENCES</span><h1>Settings</h1></div><button className="ghost-button" onClick={onBack}>← Home</button></div>
      <div className="settings-list">
        <label className="setting-row"><span><strong>Show timer</strong><small>Keep the countdown visible during timed modes.</small></span><input type="checkbox" checked={settings.showTimer} onChange={(event) => setSettings((value) => ({ ...value, showTimer: event.target.checked }))} /></label>
        <label className="setting-row"><span><strong>Sound effects</strong><small>Plays lightweight browser-generated tones during the game.</small></span><input type="checkbox" checked={settings.sound} onChange={(event) => { const enabled = event.target.checked; setSettings((value) => ({ ...value, sound: enabled })); if (enabled) { unlockAudio(); window.setTimeout(() => playTone('ui'), 20); } }} /></label>
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);
