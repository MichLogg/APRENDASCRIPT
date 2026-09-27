const Blocks = (() => {
  const COLS = 8;
  const ROWS = 12;
  const FALL_SPEED = 22;

  const SHAPES = [
    { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], width: 2, color: 'Y' },
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], width: 4, color: 'B' },
    { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], width: 3, color: 'G' },
    { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], width: 3, color: 'W' },
    { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], width: 3, color: 'Y' },
    { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], width: 3, color: 'G' },
    { cells: [[0, 0], [1, 0], [2, 0], [0, 1]], width: 3, color: 'B' }
  ];

  function create() {
    const grid = [];
    for (let row = 0; row < ROWS; row += 1) {
      grid.push(new Array(COLS).fill(null));
    }
    return { grid, cols: COLS, rows: ROWS, queue: [], falling: null, flash: 0, overflow: false };
  }

  function blocked(well, cells, col, row) {
    return cells.some((cell) => {
      const x = col + cell[0];
      const y = row + cell[1];
      if (x < 0 || x >= COLS || y >= ROWS) {
        return true;
      }
      return y >= 0 && well.grid[y][x] !== null;
    });
  }

  function landing(well, shape, col) {
    let row = -shape.cells.length - 1;
    while (!blocked(well, shape.cells, col, row + 1)) {
      row += 1;
    }
    return row;
  }

  function settle(well, shape, col, row) {
    shape.cells.forEach((cell) => {
      const x = col + cell[0];
      const y = row + cell[1];
      if (y < 0) {
        well.overflow = true;
        return;
      }
      well.grid[y][x] = shape.color;
    });
  }

  function clearLines(well) {
    let cleared = 0;
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (well.grid[row].every((cell) => cell !== null)) {
        well.grid.splice(row, 1);
        well.grid.unshift(new Array(COLS).fill(null));
        cleared += 1;
        row += 1;
      }
    }
    if (cleared) {
      well.flash = 0.45;
    }
    return cleared;
  }

  function height(well) {
    for (let row = 0; row < ROWS; row += 1) {
      if (well.grid[row].some((cell) => cell !== null)) {
        return ROWS - row;
      }
    }
    return 0;
  }

  function fill(well) {
    if (well.overflow) {
      return 1;
    }
    return height(well) / ROWS;
  }

  function attack(well, amount) {
    for (let index = 0; index < amount; index += 1) {
      well.queue.push(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    }
  }

  function start(well) {
    const shape = well.queue.shift();
    let col = 0;
    let row = -Infinity;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const candidate = Math.floor(Math.random() * (COLS - shape.width + 1));
      const depth = landing(well, shape, candidate);
      if (depth > row) {
        row = depth;
        col = candidate;
      }
    }
    well.falling = { shape, col, row, y: -shape.cells.length };
  }

  function advance(well, delta) {
    if (well.flash > 0) {
      well.flash = Math.max(0, well.flash - delta * 1.6);
    }
    if (!well.falling && well.queue.length) {
      start(well);
    }
    if (!well.falling) {
      return 0;
    }
    const piece = well.falling;
    piece.y += delta * FALL_SPEED;
    if (piece.y < piece.row) {
      return 0;
    }
    piece.y = piece.row;
    settle(well, piece.shape, piece.col, piece.row);
    well.falling = null;
    return clearLines(well);
  }

  return { create, advance, attack, fill };
})();
