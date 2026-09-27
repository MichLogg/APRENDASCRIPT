const Quiz = (() => {
  const CATEGORY_LABELS = {
    variaveis: 'VARIÁVEIS',
    tipos: 'TIPOS',
    numeros: 'NÚMEROS',
    strings: 'STRINGS',
    booleanos: 'BOOLEANOS',
    operadores: 'OPERADORES',
    comparacao: 'COMPARAÇÃO',
    condicionais: 'CONDICIONAIS',
    funcoes: 'FUNÇÕES',
    arrays: 'ARRAYS',
    objetos: 'OBJETOS',
    loops: 'LOOPS',
    metodos: 'MÉTODOS DE ARRAY',
    callbacks: 'CALLBACKS',
    dom: 'DOM',
    eventos: 'EVENTOS',
    formularios: 'FORMULÁRIOS',
    escopo: 'ESCOPO',
    closure: 'CLOSURE',
    hoisting: 'HOISTING',
    promises: 'PROMISES',
    assincrono: 'ASSÍNCRONO',
    fetch: 'FETCH API',
    erros: 'ERROS',
    destructuring: 'DESTRUCTURING',
    spread: 'SPREAD',
    rest: 'REST',
    modulos: 'MÓDULOS',
    this: 'THIS',
    hof: 'ORDEM SUPERIOR',
    imutabilidade: 'IMUTABILIDADE',
    eventloop: 'EVENT LOOP',
    callstack: 'CALL STACK',
    performance: 'PERFORMANCE',
    estado: 'ESTADO',
    memoria: 'MEMÓRIA',
    clonagem: 'CLONAGEM',
    seguranca: 'SEGURANÇA',
    padroes: 'PADRÕES',
    refatoracao: 'REFATORAÇÃO',
    arquitetura: 'ARQUITETURA',
    bugs: 'CAÇA AO BUG'
  };

  function shuffle(list) {
    const copy = list.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      const held = copy[index];
      copy[index] = copy[target];
      copy[target] = held;
    }
    return copy;
  }

  function spreadCategories(list) {
    const groups = new Map();
    list.forEach((question) => {
      const key = question.category || 'geral';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(question);
    });

    const buckets = shuffle(Array.from(groups.values()));
    const ordered = [];
    while (ordered.length < list.length) {
      let moved = false;
      buckets.forEach((bucket) => {
        if (bucket.length) {
          ordered.push(bucket.shift());
          moved = true;
        }
      });
      if (!moved) {
        break;
      }
    }
    return ordered;
  }

  function byLevel(level, type) {
    return QUESTION_BANK.filter((question) => {
      if (question.level !== level) {
        return false;
      }
      return type ? question.type === type : true;
    });
  }

  function createDeck(level, type) {
    let pool = spreadCategories(shuffle(byLevel(level, type)));
    let cursor = 0;

    return {
      total: pool.length,
      draw() {
        if (!pool.length) {
          return null;
        }
        if (cursor >= pool.length) {
          pool = spreadCategories(shuffle(pool));
          cursor = 0;
        }
        const question = pool[cursor];
        cursor += 1;
        return question;
      }
    };
  }

  function normalize(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[;.]+$/, '')
      .replace(/^["'`]+|["'`]+$/g, '')
      .replace(/\s+/g, ' ');
  }

  function normalizeCode(value) {
    return String(value)
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/;+$/, '');
  }

  function isCorrect(question, response) {
    if (question.type === 'multiple') {
      return Number(response) === question.answer;
    }
    const clean = question.type === 'complete' ? normalizeCode : normalize;
    const given = clean(response);
    if (!given) {
      return false;
    }
    const accepted = question.accept || [question.answer];
    return accepted.some((option) => clean(option) === given);
  }

  function solutionOf(question) {
    if (question.type === 'multiple') {
      return question.options[question.answer];
    }
    return question.answer;
  }

  function labelOf(category) {
    return CATEGORY_LABELS[category] || String(category || 'geral').toUpperCase();
  }

  function countByLevel(level) {
    return byLevel(level).length;
  }

  function total() {
    return QUESTION_BANK.length;
  }

  return { createDeck, isCorrect, solutionOf, labelOf, countByLevel, total, shuffle };
})();
