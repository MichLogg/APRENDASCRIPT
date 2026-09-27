const UI = (() => {
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const REASONS = {
    chegada: 'Você cruzou a linha de chegada',
    monstro: 'O desemprego alcançou você',
    torre: 'A torre do desemprego transbordou',
    soterrado: 'Sua torre transbordou primeiro',
    arrastou: 'Você arrastou o desemprego para fora da linha',
    arrastado: 'O desemprego puxou você para fora da linha',
    vidas: 'As vidas acabaram no meio da pista',
    tempo: 'O relógio zerou antes da chegada'
  };

  const el = {};
  let handlers = {};
  let selected = -1;
  let locked = false;
  let current = 'menu';

  function pick(id) {
    return document.getElementById(id);
  }

  function pips(count, total) {
    let markup = '';
    for (let index = 0; index < total; index += 1) {
      markup += index < count ? '<i class="on"></i>' : '<i></i>';
    }
    return markup;
  }

  function setText(node, value) {
    if (node && node.textContent !== value) {
      node.textContent = value;
    }
  }

  function setBar(node, ratio) {
    const width = Math.max(0, Math.min(100, ratio * 100)).toFixed(1) + '%';
    if (node.firstElementChild.style.width !== width) {
      node.firstElementChild.style.width = width;
      node.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    }
  }

  function init(callbacks) {
    handlers = callbacks;

    el.screens = Array.from(document.querySelectorAll('.screen'));
    el.levelList = pick('level-list');
    el.modeList = pick('mode-list');
    el.modeBadge = pick('mode-level-badge');
    el.category = pick('question-category');
    el.pips = pick('question-pips');
    el.count = pick('question-count');
    el.timer = pick('timer');
    el.timerFill = pick('timer-fill');
    el.timerMark = pick('timer-mark');
    el.questionText = pick('question-text');
    el.code = pick('question-code');
    el.options = pick('options');
    el.typed = pick('typed');
    el.typedInput = pick('typed-input');
    el.form = pick('answer-form');
    el.confirm = pick('confirm-btn');
    el.feedback = pick('feedback');
    el.countdown = pick('countdown');
    el.toast = pick('stage-toast');
    el.pause = pick('pause-overlay');
    el.threatBlock = pick('threat-block');
    el.bars = {
      progress: pick('bar-progress'),
      threat: pick('bar-threat')
    };
    el.names = {
      progress: pick('name-progress'),
      threat: pick('name-threat'),
      speed: pick('label-speed')
    };
    el.values = {
      progress: pick('value-progress'),
      threat: pick('value-threat'),
      score: pick('stat-score'),
      hits: pick('stat-hits'),
      misses: pick('stat-misses'),
      combo: pick('stat-combo'),
      speed: pick('stat-speed'),
      clock: pick('stat-clock'),
      lives: pick('stat-lives')
    };
    el.livesItem = pick('stat-lives-item');
    el.progressBlock = pick('progress-block');
    el.typedLabel = pick('typed-label');
    el.result = {
      flag: pick('result-flag'),
      title: pick('result-title'),
      rank: pick('result-rank'),
      note: pick('result-rank-note'),
      stats: pick('result-stats'),
      review: pick('review-list')
    };

    el.form.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });

    document.querySelectorAll('[data-bank-total]').forEach((node) => {
      node.textContent = String(Quiz.total());
    });
  }

  function show(name) {
    const target = el.screens.find((screen) => screen.dataset.screen === name);
    if (!target) {
      return;
    }
    el.screens.forEach((screen) => {
      screen.classList.toggle('is-active', screen === target);
    });
    document.body.dataset.screen = name;
    current = name;
    target.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function screen() {
    return current;
  }

  function renderLevels(onPick) {
    el.levelList.innerHTML = '';
    Object.values(LEVELS).forEach((level, index) => {
      const item = document.createElement('li');
      item.className = 'panel card card-level-' + (index + 1);
      item.innerHTML =
        '<div class="card-head"><h3></h3><span class="pips">' + pips(level.stars, 4) + '</span></div>' +
        '<p></p>' +
        '<ul class="tags"></ul>' +
        '<div class="card-foot"><span></span><button class="btn btn-primary" type="button">SELECIONAR</button></div>';

      item.querySelector('h3').textContent = level.name;
      item.querySelector('p').textContent = level.tagline;
      const tags = item.querySelector('.tags');
      level.topics.forEach((topic) => {
        const tag = document.createElement('li');
        tag.textContent = topic;
        tags.appendChild(tag);
      });
      item.querySelector('.card-foot span').textContent = Quiz.countByLevel(level.id) + ' DESAFIOS';
      const button = item.querySelector('button');
      button.setAttribute('aria-label', 'Selecionar nível ' + level.name);
      button.addEventListener('click', () => onPick(level.id));
      el.levelList.appendChild(item);
    });
  }

  function renderModes(onPick) {
    el.modeList.innerHTML = '';
    Object.values(MODES).forEach((mode) => {
      const item = document.createElement('li');
      item.className = 'panel card';
      item.innerHTML =
        '<div class="card-head"><h3></h3></div>' +
        '<p></p>' +
        '<ul class="tags"></ul>' +
        '<div class="card-foot"><span>MODO</span><button class="btn btn-primary" type="button">JOGAR</button></div>';

      item.querySelector('h3').textContent = mode.name;
      item.querySelector('p').textContent = mode.tagline;
      const tags = item.querySelector('.tags');
      mode.rules.forEach((rule) => {
        const tag = document.createElement('li');
        tag.textContent = rule;
        tags.appendChild(tag);
      });
      const button = item.querySelector('button');
      button.setAttribute('aria-label', 'Jogar no modo ' + mode.name);
      button.addEventListener('click', () => onPick(mode.id));
      el.modeList.appendChild(item);
    });
  }

  function setLevelBadge(levelId) {
    setText(el.modeBadge, 'NÍVEL ' + LEVELS[levelId].name);
  }

  function selectOption(index) {
    if (locked) {
      return;
    }
    const buttons = Array.from(el.options.children);
    if (index < 0 || index >= buttons.length) {
      return;
    }
    if (selected === index) {
      submit();
      return;
    }
    selected = index;
    buttons.forEach((button, position) => {
      button.setAttribute('aria-pressed', position === index ? 'true' : 'false');
    });
    Sfx.play('select');
  }

  function nudge() {
    el.form.classList.remove('is-nudge');
    void el.form.offsetWidth;
    el.form.classList.add('is-nudge');
  }

  function submit() {
    if (locked) {
      handlers.advance();
      return;
    }
    if (!el.typed.hidden) {
      const value = el.typedInput.value.trim();
      if (!value) {
        nudge();
        return;
      }
      handlers.answer(value);
      return;
    }
    if (selected < 0) {
      nudge();
      return;
    }
    handlers.answer(selected);
  }

  function renderCode(node, code) {
    node.textContent = '';
    const parts = code.split('___');
    parts.forEach((part, index) => {
      node.appendChild(document.createTextNode(part));
      if (index < parts.length - 1) {
        const slot = document.createElement('span');
        slot.className = 'gap';
        slot.textContent = '___';
        node.appendChild(slot);
      }
    });
  }

  function renderQuestion(question, number) {
    locked = false;
    selected = -1;

    setText(el.category, Quiz.labelOf(question.category));
    el.pips.innerHTML = pips(question.difficulty, 5);
    setText(el.count, 'DESAFIO ' + number);
    setText(el.questionText, question.question);

    if (question.code) {
      el.code.hidden = false;
      renderCode(el.code.firstElementChild, question.code);
    } else {
      el.code.hidden = true;
      el.code.firstElementChild.textContent = '';
    }

    el.feedback.hidden = true;
    el.feedback.className = 'feedback';
    el.feedback.innerHTML = '';
    el.confirm.textContent = 'RESPONDER';
    el.confirm.disabled = false;
    setTimerContested(false);

    if (question.type !== 'multiple') {
      el.options.hidden = true;
      el.options.innerHTML = '';
      el.typed.hidden = false;
      el.typedInput.value = '';
      el.typedInput.disabled = false;
      setText(el.typedLabel, question.type === 'complete' ? 'COMPLETE O CÓDIGO' : 'DIGITE A RESPOSTA');
      if (window.matchMedia('(pointer: fine)').matches) {
        el.typedInput.focus();
      }
      return;
    }

    el.typed.hidden = true;
    el.options.hidden = false;
    el.options.innerHTML = '';
    question.options.forEach((text, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'option';
      button.setAttribute('aria-pressed', 'false');
      const key = document.createElement('span');
      key.className = 'option-key';
      key.textContent = LETTERS[index];
      const label = document.createElement('span');
      label.className = 'option-text';
      label.textContent = text;
      button.append(key, label);
      button.addEventListener('click', () => selectOption(index));
      el.options.appendChild(button);
    });
  }

  function standby() {
    locked = false;
    selected = -1;
    setText(el.category, 'PREPARAR');
    el.pips.innerHTML = pips(0, 5);
    setText(el.count, 'DESAFIO 1');
    setText(el.questionText, 'O desemprego está entrando na pista. Prepare os dedos.');
    el.code.hidden = true;
    el.code.firstElementChild.textContent = '';
    el.options.hidden = false;
    el.options.innerHTML = '';
    el.typed.hidden = true;
    el.feedback.hidden = true;
    el.feedback.innerHTML = '';
    el.confirm.disabled = true;
    el.confirm.textContent = 'AGUARDE';
  }

  function lockAnswers(question, correct, response) {
    locked = true;
    el.confirm.textContent = 'CONTINUAR';
    if (question.type !== 'multiple') {
      el.typedInput.disabled = true;
      return;
    }
    Array.from(el.options.children).forEach((button, index) => {
      button.disabled = true;
      if (index === question.answer) {
        button.classList.add('is-correct');
      } else if (!correct && index === Number(response)) {
        button.classList.add('is-wrong');
      }
    });
  }

  function showFeedback(payload) {
    el.feedback.hidden = false;
    el.feedback.className = 'feedback ' + (payload.correct ? 'is-correct' : 'is-wrong');
    el.feedback.innerHTML = '';

    const title = document.createElement('b');
    title.textContent = payload.title;
    el.feedback.appendChild(title);

    if (!payload.correct) {
      const answer = document.createElement('p');
      answer.textContent = 'Resposta certa: ';
      const code = document.createElement('code');
      code.textContent = payload.solution;
      answer.appendChild(code);
      el.feedback.appendChild(answer);
    }

    if (payload.explanation) {
      const explanation = document.createElement('p');
      explanation.textContent = payload.explanation;
      el.feedback.appendChild(explanation);
    }
  }

  function setTimer(ratio) {
    const value = Math.max(0, Math.min(1, ratio));
    el.timerFill.style.width = (value * 100).toFixed(1) + '%';
    el.timer.setAttribute('aria-valuenow', String(Math.round(value * 100)));
    el.timer.classList.toggle('is-low', value < 0.25);
  }

  function setRivalMark(ratio) {
    if (ratio === null) {
      el.timerMark.hidden = true;
      return;
    }
    el.timerMark.hidden = false;
    el.timerMark.style.left = (Math.max(0, Math.min(1, ratio)) * 100).toFixed(1) + '%';
  }

  function setTimerContested(active) {
    el.timer.classList.toggle('is-contested', Boolean(active));
  }

  function setCountdown(text) {
    setText(el.countdown, text);
  }

  function showToast(text, bad) {
    el.toast.textContent = text;
    el.toast.classList.toggle('is-bad', Boolean(bad));
    el.toast.classList.remove('is-visible');
    void el.toast.offsetWidth;
    el.toast.classList.add('is-visible');
  }

  function prepareHud(match) {
    const duel = Boolean(match.mode.duel);
    const tug = Boolean(match.mode.tug);
    el.threatBlock.hidden = !match.mode.monster || tug;
    el.livesItem.hidden = !match.mode.lives;
    setText(el.names.progress, duel ? 'TORRE DELE' : tug ? 'CORDA' : 'PISTA');
    setText(el.names.threat, duel ? 'SUA TORRE' : 'DESEMPREGO');
    setText(el.names.speed, duel ? 'ATAQUES' : tug ? 'PUXÕES' : 'VELOCIDADE');
    el.bars.progress.setAttribute('aria-label', duel ? 'Torre do desemprego' : tug ? 'Posição da corda' : 'Progresso da pista');
    el.progressBlock.classList.remove('is-danger');
    setRivalMark(duel ? 0.5 : null);
    setTimerContested(false);
    setTimer(1);
    setCountdown('');
  }

  function updateHud(match, view) {
    setBar(el.bars.progress, match.progress / 100);
    setText(el.values.progress, Math.round(match.progress) + '%');
    if (match.mode.tug) {
      el.progressBlock.classList.toggle('is-danger', match.progress < 35);
    }

    if (match.mode.monster) {
      const ratio = view.gap / Match.MAX_GAP;
      const near = ratio <= 0.3;
      setBar(el.bars.threat, ratio);
      if (match.mode.duel) {
        setText(el.values.threat, ratio > 0.6 ? 'FOLGA' : near ? 'CHEIA' : 'APERTO');
      } else {
        setText(el.values.threat, ratio > 0.6 ? 'LONGE' : near ? 'COLADO' : 'PERTO');
      }
      el.threatBlock.classList.toggle('is-danger', near);
    }

    setText(el.values.score, String(match.score));
    setText(el.values.hits, String(match.hits));
    setText(el.values.misses, String(match.misses));
    setText(el.values.combo, 'x' + match.combo);
    setText(el.values.speed, match.mode.duel || match.mode.tug ? String(match.strikes) : view.speed.toFixed(1) + 'x');
    setText(el.values.clock, Match.formatTime(match.timeLimit ? match.timeLimit - match.elapsed : match.elapsed));
    if (match.mode.lives) {
      setText(el.values.lives, String(match.lives));
    }
  }

  function togglePause(visible) {
    el.pause.hidden = !visible;
  }

  function statItem(label, value, highlight) {
    const item = document.createElement('li');
    if (highlight) {
      item.className = 'is-record';
    }
    const name = document.createElement('span');
    name.textContent = label;
    const content = document.createElement('b');
    content.textContent = value;
    item.append(name, content);
    return item;
  }

  function showResult(match, record) {
    const grade = Match.rank(match);
    el.result.flag.textContent = match.won ? 'VITÓRIA' : 'DERROTA';
    el.result.flag.classList.toggle('is-lost', !match.won);
    setText(el.result.title, REASONS[match.reason] || 'Partida encerrada');
    setText(el.result.rank, grade.label);
    setText(el.result.note, grade.note);

    const stats = [
      statItem('NÍVEL', match.level.name),
      statItem('MODO', match.mode.name),
      statItem('PONTOS', String(match.score)),
      statItem('ACERTOS', String(match.hits)),
      statItem('ERROS', String(match.misses)),
      statItem('PRECISÃO', Math.round(Match.accuracy(match) * 100) + '%'),
      statItem('MAIOR COMBO', 'x' + match.bestCombo),
      statItem('TEMPO', Match.formatTime(match.elapsed))
    ];
    if (match.mode.duel || match.mode.tug) {
      stats.push(statItem(match.mode.tug ? 'PUXÕES' : 'ATAQUES', String(match.strikes)));
    }
    stats.push(statItem('RECORDE', String(record.best), record.beaten));

    el.result.stats.innerHTML = '';
    stats.forEach((item) => el.result.stats.appendChild(item));

    el.result.review.innerHTML = '';
    if (!match.review.length) {
      const empty = document.createElement('li');
      empty.className = 'review-empty';
      empty.textContent = match.hits ? 'Nenhum erro nesta partida. Sobe de nível.' : 'Sem desafios respondidos.';
      el.result.review.appendChild(empty);
      return;
    }

    match.review.forEach((entry) => {
      const item = document.createElement('li');

      const question = document.createElement('p');
      question.className = 'review-question';
      question.textContent = entry.question.question;

      const answer = document.createElement('p');
      answer.className = 'review-answer';
      const label = document.createElement('b');
      label.textContent = 'CERTO: ';
      answer.append(label, document.createTextNode(Quiz.solutionOf(entry.question)));

      const note = document.createElement('p');
      note.className = 'review-note';
      note.textContent = entry.question.explanation;

      item.append(question, answer);
      if (entry.given) {
        const given = document.createElement('p');
        given.className = 'review-note';
        given.textContent = 'Você marcou: ' + entry.given;
        item.appendChild(given);
      }
      item.appendChild(note);
      el.result.review.appendChild(item);
    });
  }

  return {
    init,
    show,
    screen,
    renderLevels,
    renderModes,
    setLevelBadge,
    renderQuestion,
    standby,
    selectOption,
    confirm: submit,
    lockAnswers,
    showFeedback,
    setTimer,
    setRivalMark,
    setTimerContested,
    setCountdown,
    showToast,
    prepareHud,
    updateHud,
    togglePause,
    showResult
  };
})();
