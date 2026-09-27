const Game = (() => {
  const TRACK = 100;
  const CONSUME_RATE = 16;
  const DRAIN_CAP = 6;
  const TUG_CAP = 0.05;
  const TUG_GAIN = 0.075;

  let ctx = null;
  let onEnd = null;
  let frameId = 0;
  let lastTime = 0;

  let match = null;
  let deck = null;
  let question = null;

  let phase = 'idle';
  let heldPhase = 'question';
  let questionTime = 0;
  let questionLeft = 0;
  let graceLeft = 0;
  let drained = 0;
  let feedbackLeft = 0;
  let countdownLeft = 0;

  let pending = 0;
  let displayGap = Match.START_GAP;
  let speed = 0.6;
  let offset = 0;
  let tick = 0;
  let shake = 0;
  let particles = [];

  let playerWell = null;
  let rivalWell = null;
  let rivalDeadline = 0;
  let rivalAnswered = false;
  let rounds = 0;
  let strike = null;
  let pull = 0.5;

  let settings = { effects: true, extraTime: false, explanations: true };

  function init(config) {
    ctx = config.canvas.getContext('2d');
    onEnd = config.onEnd;
  }

  function configure(next) {
    settings = Object.assign({}, settings, next);
  }

  function pressure() {
    return match.level.pressure * (1 + match.hits * match.mode.escalation);
  }

  function syncDuel() {
    match.progress = Math.min(TRACK, Blocks.fill(rivalWell) * TRACK);
    match.gap = Match.MAX_GAP * Math.max(0, 1 - Blocks.fill(playerWell));
  }

  function duelRound(correct, fraction) {
    rounds += 1;
    if (correct && !rivalAnswered) {
      Blocks.attack(rivalWell, fraction > 0.62 ? 2 : 1);
      match.strikes += 1;
      strike = { toRival: true, life: 1 };
      return;
    }
    Blocks.attack(playerWell, correct ? 1 : 2);
    strike = { toRival: false, life: 1 };
    shake = correct ? 0.6 : 1;
  }

  function syncTug() {
    pull = Math.max(0, Math.min(1, pull));
    match.progress = pull * TRACK;
    match.gap = Match.MAX_GAP * pull;
  }

  function tugRound(correct, fraction, timedOut) {
    rounds += 1;
    if (correct) {
      const streak = 1 + Math.min(match.combo - 1, 4) * 0.25;
      pull += TUG_GAIN * (0.6 + 0.6 * fraction) * streak;
      match.strikes += 1;
      return;
    }
    pull -= timedOut ? 0.11 : 0.085;
  }

  function knotX() {
    return 150 + (1 - pull) * 200;
  }

  function duelTitle(correct) {
    if (!correct) {
      return 'RESPOSTA ERRADA';
    }
    return rivalAnswered ? 'CERTO, MAS ATRASADO' : 'VOCÊ FOI MAIS RÁPIDO';
  }

  function describe(response) {
    if (question.type !== 'multiple') {
      return String(response);
    }
    return question.options[Number(response)];
  }

  function burst(color) {
    if (!settings.effects) {
      return;
    }
    const origin = match.mode.tug ? knotX() - 60 : Scene.RUNNER_X + 14;
    for (let index = 0; index < 16; index += 1) {
      particles.push({
        x: origin,
        y: Scene.GROUND - 14 - Math.random() * 26,
        vx: -50 - Math.random() * 110,
        vy: -20 - Math.random() * 70,
        life: 0.45 + Math.random() * 0.45,
        color
      });
    }
  }

  function updateParticles(delta) {
    if (!particles.length) {
      return;
    }
    const alive = [];
    particles.forEach((particle) => {
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 190 * delta;
      if (particle.life > 0 && particle.y < Scene.GROUND + 6) {
        alive.push(particle);
      }
    });
    particles = alive;
  }

  function nextQuestion() {
    if (phase === 'over') {
      return;
    }
    const drawn = deck.draw();
    if (!drawn) {
      finish(false, 'tempo');
      return;
    }
    question = drawn;
    questionTime = match.level.seconds * (settings.extraTime ? 1.35 : 1);
    questionLeft = questionTime;
    graceLeft = questionTime * match.level.grace;
    drained = 0;
    phase = 'question';
    UI.renderQuestion(question, match.asked + 1);
    UI.setTimer(1);

    if (match.mode.duel) {
      const speed = Math.max(0.3, match.mode.rival - rounds * match.mode.rivalRamp);
      rivalDeadline = questionTime * (1 - speed * (0.92 + Math.random() * 0.16));
      rivalAnswered = false;
      UI.setRivalMark(rivalDeadline / questionTime);
    }
  }

  function resolve(response, timedOut) {
    const fraction = Math.max(0, Math.min(1, questionLeft / questionTime));
    const correct = !timedOut && Quiz.isCorrect(question, response);

    if (correct) {
      const points = Match.registerHit(match, question, fraction);
      if (!match.mode.duel && !match.mode.tug) {
        pending += Match.advanceFor(match, fraction);
        match.gap = Math.min(Match.MAX_GAP, match.gap + 2.6 + 4.2 * fraction);
      }
      burst('#3ddc6b');
      Sfx.play('correct');
      UI.showToast('+' + points, false);
      UI.showFeedback({
        correct: true,
        title: match.mode.duel ? duelTitle(true) : fraction > 0.6 ? 'CERTO E RÁPIDO' : 'CERTO',
        explanation: settings.explanations ? question.explanation : ''
      });
    } else {
      Match.registerMiss(match, question, timedOut ? '' : describe(response));
      if (match.mode.monster && !match.mode.duel && !match.mode.tug) {
        match.gap -= timedOut ? 6.5 : 4.5;
      }
      if (match.timeLimit) {
        match.elapsed += 6;
      }
      shake = 1;
      burst('#ffd23f');
      Sfx.play('wrong');
      UI.showToast(timedOut ? 'TEMPO!' : 'ERROU', true);
      UI.showFeedback({
        correct: false,
        title: timedOut ? 'TEMPO ESGOTADO' : 'RESPOSTA ERRADA',
        solution: Quiz.solutionOf(question),
        explanation: settings.explanations ? question.explanation : ''
      });
    }

    if (match.mode.duel) {
      duelRound(correct, fraction);
    }
    if (match.mode.tug) {
      tugRound(correct, fraction, timedOut);
    }

    UI.lockAnswers(question, correct, response);
    phase = 'feedback';
    feedbackLeft = settings.explanations ? (correct ? 2 : 3.6) : 1.2;
  }

  function checkEnd() {
    if (phase === 'over') {
      return;
    }
    if (match.progress >= TRACK) {
      finish(true, match.mode.winReason);
      return;
    }
    if (match.mode.monster && match.gap <= 0) {
      finish(false, match.mode.loseReason);
      return;
    }
    if (match.mode.lives && match.lives <= 0) {
      finish(false, 'vidas');
      return;
    }
    if (match.timeLimit && match.elapsed >= match.timeLimit) {
      finish(false, 'tempo');
    }
  }

  function update(delta) {
    tick += delta;

    if (phase === 'countdown') {
      countdownLeft -= delta;
      const shown = Math.ceil(countdownLeft - 0.35);
      UI.setCountdown(shown > 0 ? String(shown) : 'VAI');
      if (countdownLeft <= 0) {
        UI.setCountdown('');
        nextQuestion();
      }
    } else {
      match.elapsed += delta;
      if (phase === 'question') {
        questionLeft -= delta;
        if (match.mode.duel) {
          if (!rivalAnswered && questionLeft <= rivalDeadline) {
            rivalAnswered = true;
            UI.setTimerContested(true);
            UI.showToast('O DESEMPREGO RESPONDEU', true);
            Sfx.play('tick');
          }
        } else if (graceLeft > 0) {
          graceLeft -= delta;
        } else if (match.mode.tug) {
          const ceiling = TUG_CAP + rounds * 0.004;
          if (drained < ceiling) {
            const amount = Math.min(match.level.pressure * 0.005 * delta, ceiling - drained);
            drained += amount;
            pull -= amount;
          }
        } else if (match.mode.monster && drained < DRAIN_CAP) {
          const amount = Math.min(pressure() * delta, DRAIN_CAP - drained);
          drained += amount;
          match.gap -= amount;
        }
        UI.setTimer(questionLeft / questionTime);
        if (questionLeft <= 0) {
          resolve(null, true);
        }
      } else if (phase === 'feedback') {
        feedbackLeft -= delta;
        if (feedbackLeft <= 0) {
          nextQuestion();
        }
      }
    }

    if (match.mode.duel) {
      const cleanedHere = Blocks.advance(playerWell, delta);
      const cleanedThere = Blocks.advance(rivalWell, delta);
      if (cleanedHere) {
        match.score += cleanedHere * 60;
        Sfx.play('clear');
        UI.showToast('LINHA LIMPA +' + cleanedHere * 60, false);
      }
      if (cleanedThere) {
        Sfx.play('clear');
      }
      if (strike) {
        strike.life -= delta * 2.2;
        if (strike.life <= 0) {
          strike = null;
        }
      }
      syncDuel();
    }

    if (match.mode.tug) {
      syncTug();
    }

    const consumed = Math.min(pending, CONSUME_RATE * delta);
    pending -= consumed;
    const drift = match.mode.drift && phase !== 'countdown' ? 0.16 * delta : 0;
    match.progress = Math.min(TRACK, match.progress + consumed + drift);

    const rate = delta > 0 ? consumed / delta : 0;
    speed = 0.6 + Math.min(rate, CONSUME_RATE) * 0.18;
    offset += (26 + speed * 46) * delta;
    displayGap += (match.gap - displayGap) * Math.min(1, delta * 6);

    if (shake > 0) {
      shake = Math.max(0, shake - delta * 2.4);
    }
    updateParticles(delta);
    checkEnd();
  }

  function render() {
    if (!ctx || !match) {
      return;
    }
    if (match.mode.tug) {
      Scene.drawTug(ctx, {
        pull,
        tick,
        particles,
        shake: settings.effects ? shake : 0,
        running: phase === 'question' || phase === 'feedback' || phase === 'countdown'
      });
      UI.updateHud(match, { gap: Math.max(0, displayGap), speed });
      return;
    }
    if (match.mode.duel) {
      Scene.drawDuel(ctx, {
        playerWell,
        rivalWell,
        strike,
        tick,
        shake: settings.effects ? shake : 0,
        running: phase === 'question' || phase === 'feedback' || phase === 'countdown'
      });
      UI.updateHud(match, { gap: Math.max(0, displayGap), speed });
      return;
    }
    Scene.draw(ctx, {
      offset,
      progress: match.progress / TRACK,
      gap: Math.max(0, displayGap) / Match.MAX_GAP,
      monster: match.mode.monster,
      tick,
      speed,
      shake: settings.effects ? shake : 0,
      particles,
      running: phase === 'question' || phase === 'feedback' || phase === 'countdown'
    });
    UI.updateHud(match, { gap: Math.max(0, displayGap), speed });
  }

  function step(time) {
    frameId = window.requestAnimationFrame(step);
    if (!lastTime) {
      lastTime = time;
    }
    const delta = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    if (phase !== 'paused' && phase !== 'over' && phase !== 'idle') {
      update(delta);
    }
    render();
  }

  function stop() {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
    phase = 'idle';
    UI.togglePause(false);
  }

  function finish(won, reason) {
    phase = 'over';
    match.won = won;
    match.reason = reason;
    match.score += Match.finishBonus(match);
    Sfx.play(won ? 'win' : 'lose');
    render();
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    UI.togglePause(false);
    if (onEnd) {
      onEnd(match, Records.submit(match));
    }
  }

  function start(levelId, modeId) {
    stop();
    match = Match.create(levelId, modeId);
    deck = Quiz.createDeck(levelId, match.mode.questionType);
    question = null;
    pending = 0;
    displayGap = match.gap;
    speed = 0.6;
    offset = 0;
    tick = 0;
    shake = 0;
    particles = [];
    rounds = 0;
    rivalAnswered = false;
    strike = null;
    pull = 0.5;
    playerWell = Blocks.create();
    rivalWell = Blocks.create();
    countdownLeft = 3.2;
    phase = 'countdown';

    UI.prepareHud(match);
    UI.standby();
    UI.updateHud(match, { gap: displayGap, speed });
    Sfx.play('start');

    lastTime = 0;
    frameId = window.requestAnimationFrame(step);
  }

  function answer(response) {
    if (phase !== 'question') {
      return;
    }
    resolve(response, false);
  }

  function advance() {
    if (phase === 'feedback') {
      nextQuestion();
    }
  }

  function pause() {
    if (phase === 'paused' || phase === 'over' || phase === 'idle') {
      return;
    }
    heldPhase = phase;
    phase = 'paused';
    UI.togglePause(true);
  }

  function resume() {
    if (phase !== 'paused') {
      return;
    }
    phase = heldPhase;
    lastTime = 0;
    UI.togglePause(false);
  }

  function isActive() {
    return phase !== 'idle' && phase !== 'over';
  }

  function isPaused() {
    return phase === 'paused';
  }

  return { init, configure, start, answer, advance, pause, resume, stop, isActive, isPaused };
})();
