const LEVELS = {
  iniciante: {
    id: 'iniciante',
    name: 'INICIANTE',
    tagline: 'Os fundamentos que sustentam tudo.',
    topics: ['let e const', 'tipos', 'operadores', 'if e else', 'funções', 'arrays'],
    seconds: 24,
    grace: 0.42,
    pressure: 0.55,
    questions: 10,
    stars: 1
  },
  intermediario: {
    id: 'intermediario',
    name: 'INTERMEDIÁRIO',
    tagline: 'Dados, laços e a página viva.',
    topics: ['objetos', 'map e filter', 'reduce', 'DOM', 'eventos', 'formulários'],
    seconds: 30,
    grace: 0.4,
    pressure: 0.6,
    questions: 12,
    stars: 2
  },
  avancado: {
    id: 'avancado',
    name: 'AVANÇADO',
    tagline: 'Escopo, assincronia e o lado difícil.',
    topics: ['closure', 'hoisting', 'promises', 'async e await', 'this', 'spread e rest'],
    seconds: 38,
    grace: 0.44,
    pressure: 0.62,
    questions: 12,
    stars: 3
  },
  senior: {
    id: 'senior',
    name: 'SÊNIOR',
    tagline: 'Problemas de projeto real, sem decoreba.',
    topics: ['event loop', 'performance', 'estado', 'padrões', 'segurança', 'caça ao bug'],
    seconds: 48,
    grace: 0.46,
    pressure: 0.65,
    questions: 12,
    stars: 4
  }
};

const MODES = {
  corrida: {
    id: 'corrida',
    name: 'CORRIDA',
    tagline: 'O modo principal: chegue ao fim da pista antes que o desemprego alcance você.',
    rules: ['Desemprego na cola', 'Respostas rápidas aceleram', 'Erros encurtam a distância'],
    monster: true,
    drift: true,
    timed: false,
    lives: 0,
    escalation: 0,
    winReason: 'chegada',
    loseReason: 'monstro'
  },
  duelo: {
    id: 'duelo',
    name: 'DUELO',
    tagline: 'Duas torres de blocos, uma para cada lado. Quem responde primeiro entulha a torre do adversário.',
    rules: ['Você contra o desemprego', 'Responder antes ataca', 'Torre cheia perde'],
    monster: true,
    duel: true,
    drift: false,
    timed: false,
    lives: 0,
    escalation: 0,
    rival: 0.62,
    rivalRamp: 0.03,
    winReason: 'torre',
    loseReason: 'soterrado'
  },
  cabo: {
    id: 'cabo',
    name: 'CABO DE GUERRA',
    tagline: 'Só desafios de completar código. Cada trecho fechado puxa a corda e arrasta o desemprego para o seu lado.',
    rules: ['Complete o código', 'Acerto puxa a corda', 'Hesitar perde terreno'],
    monster: true,
    tug: true,
    questionType: 'complete',
    drift: false,
    timed: false,
    lives: 0,
    escalation: 0,
    winReason: 'arrastou',
    loseReason: 'arrastado'
  },
  contrarrelogio: {
    id: 'contrarrelogio',
    name: 'CONTRARRELÓGIO',
    tagline: 'Pista livre, relógio implacável. Cada erro custa seis segundos.',
    rules: ['Sem perseguição', 'Tempo total fixo', 'Erro custa 6 segundos'],
    monster: false,
    drift: true,
    timed: true,
    lives: 0,
    escalation: 0,
    winReason: 'chegada',
    loseReason: 'tempo'
  },
  sobrevivencia: {
    id: 'sobrevivencia',
    name: 'SOBREVIVÊNCIA',
    tagline: 'Três vidas e um desemprego que fica mais rápido a cada acerto.',
    rules: ['3 vidas', 'Desemprego acelera', 'Só o acerto avança'],
    monster: true,
    drift: false,
    timed: false,
    lives: 3,
    escalation: 0.07,
    winReason: 'chegada',
    loseReason: 'monstro'
  }
};

const Match = (() => {
  const START_GAP = 22;
  const MAX_GAP = 30;

  const RANKS = [
    { limit: 0.92, label: 'S', note: 'Domínio absoluto do conteúdo.' },
    { limit: 0.8, label: 'A', note: 'Muito consistente, poucos deslizes.' },
    { limit: 0.65, label: 'B', note: 'Bom ritmo, revise os erros.' },
    { limit: 0.45, label: 'C', note: 'Base existe, falta firmeza.' },
    { limit: 0, label: 'D', note: 'Volte um nível e reforce os conceitos.' }
  ];

  function create(levelId, modeId) {
    const level = LEVELS[levelId];
    const mode = MODES[modeId];
    const target = mode.lives ? 16 : level.questions;

    return {
      levelId,
      modeId,
      level,
      mode,
      target,
      chunk: 100 / target,
      timeLimit: mode.timed ? Math.round(target * level.seconds * 0.5) : 0,
      score: 0,
      hits: 0,
      misses: 0,
      asked: 0,
      combo: 0,
      strikes: 0,
      bestCombo: 0,
      lives: mode.lives,
      progress: 0,
      gap: START_GAP,
      elapsed: 0,
      review: [],
      won: false,
      reason: ''
    };
  }

  function registerHit(match, question, timeFraction) {
    match.hits += 1;
    match.asked += 1;
    match.combo += 1;
    match.bestCombo = Math.max(match.bestCombo, match.combo);

    const base = 70 + question.difficulty * 35;
    const speedBonus = Math.round(base * 0.5 * timeFraction);
    const comboBonus = Math.min(match.combo - 1, 8) * 20;
    const points = Math.round(base) + speedBonus + comboBonus;
    match.score += points;
    return points;
  }

  function registerMiss(match, question, given) {
    match.misses += 1;
    match.asked += 1;
    match.combo = 0;
    if (match.lives > 0) {
      match.lives -= 1;
    }
    if (match.review.length < 12) {
      match.review.push({ question, given });
    }
    return 0;
  }

  function advanceFor(match, timeFraction) {
    if (!match.mode.drift) {
      return match.chunk;
    }
    return match.chunk * (0.7 + 0.45 * timeFraction);
  }

  function accuracy(match) {
    if (!match.asked) {
      return 0;
    }
    return match.hits / match.asked;
  }

  function rank(match) {
    const score = accuracy(match) * (match.won ? 1 : 0.8);
    return RANKS.find((item) => score >= item.limit) || RANKS[RANKS.length - 1];
  }

  function finishBonus(match) {
    if (!match.won) {
      return 0;
    }
    if (match.timeLimit) {
      return Math.round(Math.max(0, match.timeLimit - match.elapsed) * 8);
    }
    if (match.mode.monster) {
      return Math.round(match.gap * 12);
    }
    return 0;
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
    const rest = String(safe % 60).padStart(2, '0');
    return minutes + ':' + rest;
  }

  return {
    create,
    registerHit,
    registerMiss,
    advanceFor,
    accuracy,
    rank,
    finishBonus,
    formatTime,
    START_GAP,
    MAX_GAP
  };
})();

const Records = (() => {
  const KEY = 'aprendascript:records';

  function read() {
    try {
      return JSON.parse(window.localStorage.getItem(KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function write(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (error) {
      return false;
    }
    return true;
  }

  function submit(match) {
    const data = read();
    const key = match.levelId + ':' + match.modeId;
    const previous = data[key] || 0;
    const beaten = match.score > previous;
    if (beaten) {
      data[key] = match.score;
      write(data);
    }
    return { best: Math.max(previous, match.score), beaten };
  }

  function clear() {
    write({});
  }

  return { read, submit, clear };
})();
