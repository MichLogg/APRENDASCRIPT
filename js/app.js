(() => {
  const OPTIONS_KEY = 'aprendascript:options';
  const DEFAULTS = { sound: true, effects: true, extraTime: false, explanations: true };

  const selection = { level: 'iniciante', mode: 'corrida' };
  let options = Object.assign({}, DEFAULTS);
  let optionsForm = null;
  let soundChip = null;
  let optionsNote = null;
  let menuCtx = null;
  let menuFrame = 0;
  let menuLast = 0;
  let menuTick = 0;
  let menuOffset = 0;
  let reduceMotion = false;

  function readOptions() {
    try {
      return Object.assign({}, DEFAULTS, JSON.parse(window.localStorage.getItem(OPTIONS_KEY)) || {});
    } catch (error) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveOptions() {
    try {
      window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
    } catch (error) {
      optionsNote.textContent = 'Não foi possível salvar as preferências neste navegador.';
    }
  }

  function applyOptions() {
    Sfx.setEnabled(options.sound);
    document.body.classList.toggle('no-effects', !options.effects);
    Game.configure({
      effects: options.effects && !reduceMotion,
      extraTime: options.extraTime,
      explanations: options.explanations
    });
    soundChip.setAttribute('aria-pressed', options.sound ? 'true' : 'false');
    soundChip.textContent = options.sound ? 'SOM ON' : 'SOM OFF';
    Object.keys(DEFAULTS).forEach((key) => {
      const field = optionsForm.elements[key];
      if (field) {
        field.checked = Boolean(options[key]);
      }
    });
  }

  function stopMenuLoop() {
    window.cancelAnimationFrame(menuFrame);
    menuFrame = 0;
    menuLast = 0;
  }

  function menuStep(time) {
    menuFrame = window.requestAnimationFrame(menuStep);
    if (!menuLast) {
      menuLast = time;
    }
    const delta = Math.min(0.05, (time - menuLast) / 1000);
    menuLast = time;
    menuTick += delta;
    menuOffset += 62 * delta;

    Scene.draw(menuCtx, {
      offset: menuOffset,
      progress: 0.18,
      gap: 0.52 + Math.sin(menuTick * 0.7) * 0.2,
      monster: true,
      tick: menuTick,
      speed: 1.7,
      shake: 0,
      particles: [],
      running: true
    });
  }

  function startMenuLoop() {
    if (menuFrame || !menuCtx) {
      return;
    }
    menuFrame = window.requestAnimationFrame(menuStep);
  }

  function navigate(name) {
    if (name !== 'game' && Game.isActive()) {
      Game.stop();
    }
    if (name === 'modes') {
      UI.setLevelBadge(selection.level);
    }
    UI.show(name);
    if (name === 'menu') {
      startMenuLoop();
    } else {
      stopMenuLoop();
    }
  }

  function startMatch() {
    stopMenuLoop();
    UI.show('game');
    Game.start(selection.level, selection.mode);
  }

  function handleAction(action) {
    if (action === 'pause') {
      Game.pause();
      return;
    }
    if (action === 'resume') {
      Game.resume();
      return;
    }
    if (action === 'quit') {
      Game.stop();
      navigate('menu');
      return;
    }
    if (action === 'replay') {
      startMatch();
      return;
    }
    if (action === 'reset-records') {
      Records.clear();
      optionsNote.textContent = 'Recordes apagados.';
    }
  }

  function handleKey(event) {
    if (document.body.dataset.screen !== 'game') {
      if (event.key === 'Escape') {
        navigate('menu');
      }
      return;
    }

    if (event.key === 'Escape') {
      if (Game.isPaused()) {
        Game.resume();
      } else {
        Game.pause();
      }
      return;
    }

    const tag = event.target && event.target.tagName;
    if (tag === 'INPUT') {
      return;
    }

    if (event.key === 'Enter' && tag !== 'BUTTON') {
      UI.confirm();
      return;
    }

    const digit = '1234'.indexOf(event.key);
    if (digit >= 0) {
      event.preventDefault();
      UI.selectOption(digit);
      return;
    }

    const letter = 'abcd'.indexOf(String(event.key).toLowerCase());
    if (letter >= 0) {
      UI.selectOption(letter);
    }
  }

  function boot() {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    optionsForm = document.getElementById('options-form');
    optionsNote = document.getElementById('options-note');
    soundChip = document.querySelector('[data-toggle="sound"]');
    menuCtx = document.getElementById('menu-canvas').getContext('2d');

    UI.init({
      answer: (response) => Game.answer(response),
      advance: () => Game.advance()
    });

    Game.init({
      canvas: document.getElementById('track'),
      onEnd: (match, record) => {
        UI.showResult(match, record);
        UI.show('result');
      }
    });

    options = readOptions();
    applyOptions();

    UI.renderLevels((levelId) => {
      selection.level = levelId;
      Sfx.play('confirm');
      navigate('modes');
    });

    UI.renderModes((modeId) => {
      selection.mode = modeId;
      Sfx.play('confirm');
      startMatch();
    });

    document.addEventListener('click', (event) => {
      const node = event.target instanceof Element ? event.target : null;
      if (!node) {
        return;
      }
      const toggle = node.closest('[data-toggle="sound"]');
      if (toggle) {
        options.sound = !options.sound;
        applyOptions();
        saveOptions();
        Sfx.play('select');
        return;
      }
      const nav = node.closest('[data-nav]');
      if (nav) {
        Sfx.play('select');
        navigate(nav.dataset.nav);
        return;
      }
      const action = node.closest('[data-action]');
      if (action) {
        handleAction(action.dataset.action);
      }
    });

    optionsForm.addEventListener('change', (event) => {
      const field = event.target;
      if (!field.name) {
        return;
      }
      options[field.name] = field.checked;
      applyOptions();
      saveOptions();
      optionsNote.textContent = 'Preferências atualizadas.';
    });

    document.addEventListener('keydown', handleKey);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Game.pause();
        stopMenuLoop();
      } else if (document.body.dataset.screen === 'menu') {
        startMenuLoop();
      }
    });

    startMenuLoop();
  }

  boot();
})();
