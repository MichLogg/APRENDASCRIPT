const Scene = (() => {
  const WIDTH = 480;
  const HEIGHT = 180;
  const GROUND = 138;
  const RUNNER_X = 250;
  const SCALE = 3;
  const CELL = 10;

  const PALETTE = {
    K: '#050a1c',
    W: '#f2f8ff',
    Y: '#ffd23f',
    y: '#c08a10',
    G: '#3ddc6b',
    g: '#1b8f45',
    B: '#2f6bff',
    b: '#16357f',
    V: '#3a1d6e',
    v: '#231044'
  };

  const RUNNER = [
    [
      '....YYYY....',
      '...YYYYYY...',
      '..YYYYYYYY..',
      '..YWWWWWWY..',
      '..WWKWWKWW..',
      '..WWWWWWWW..',
      '...WWKKWW...',
      '...GGGGGG...',
      '..GGGGGGGG..',
      '.WGGGGGGGGW.',
      '.WGGGGGGGGW.',
      '..GGgggGGG..',
      '..BBBBBBBB..',
      '..BBB..BBB..',
      '..BB....BB..',
      '.WWW....WWW.'
    ],
    [
      '....YYYY....',
      '...YYYYYY...',
      '..YYYYYYYY..',
      '..YWWWWWWY..',
      '..WWKWWKWW..',
      '..WWWWWWWW..',
      '...WWKKWW...',
      '...GGGGGG...',
      '..GGGGGGGG..',
      'W.GGGGGGGG.W',
      '.WGGGGGGGGW.',
      '..GGgggGGG..',
      '..BBBBBBBB..',
      '..BBBB.BB...',
      '.BBB....BB..',
      'WWW......WW.'
    ]
  ];

  const MONSTER = [
    [
      '.....KK..KK.....',
      '....KVVKKVVK....',
      '...KVVVVVVVVK...',
      '..KVVVVVVVVVVK..',
      '..KVYYVVVVYYVK..',
      '..KVYKYVVYKYVK..',
      '..KVVYYVVYYVVK..',
      '..KVVVVVVVVVVK..',
      '..KWKWKWKWKWKK..',
      '..KVVVVVVVVVVK..',
      '..KVVvvvvvvVVK..',
      '..KVVVVVVVVVVK..',
      '..KVVVVVVVVVVK..',
      '..KVVVVVVVVVVK..',
      '..KVK..KK..KVK..',
      '.KKK...KK...KKK.'
    ],
    [
      '.....KK..KK.....',
      '....KVVKKVVK....',
      '...KVVVVVVVVK...',
      '..KVVVVVVVVVVK..',
      '..KVYYVVVVYYVK..',
      '..KVYYVVVVYYVK..',
      '..KVVVVVVVVVVK..',
      '..KWWKWWKWWKWK..',
      '..KVVVVVVVVVVK..',
      '..KVVVVVVVVVVK..',
      '..KVVvvvvvvVVK..',
      '..KVVVVVVVVVVK..',
      '..KVVVVVVVVVVK..',
      '..KVVK..KKVVVK..',
      '.KVVK....KVVK...',
      'KKK.......KKK...'
    ]
  ];

  const stars = [];
  for (let index = 0; index < 54; index += 1) {
    stars.push({
      x: (index * 97 + 13) % WIDTH,
      y: (index * 41 + 7) % 92,
      size: index % 6 === 0 ? 2 : 1
    });
  }

  function drawSprite(ctx, frame, x, y, scale, flip) {
    for (let row = 0; row < frame.length; row += 1) {
      const line = frame[row];
      for (let col = 0; col < line.length; col += 1) {
        const key = line[col];
        if (key === '.') {
          continue;
        }
        const column = flip ? line.length - 1 - col : col;
        ctx.fillStyle = PALETTE[key];
        ctx.fillRect(x + column * scale, y + row * scale, scale, scale);
      }
    }
  }

  function eachSlot(shift, spacing, callback) {
    const offset = ((shift % spacing) + spacing) % spacing;
    const first = Math.floor(shift / spacing);
    const count = Math.ceil(WIDTH / spacing) + 1;
    for (let index = 0; index <= count; index += 1) {
      callback(index * spacing - offset, first + index);
    }
  }

  function drawSky(ctx, moon) {
    ctx.fillStyle = '#0a1430';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#0e1d46';
    ctx.fillRect(0, 76, WIDTH, 62);
    ctx.fillStyle = 'rgba(242, 248, 255, 0.75)';
    stars.forEach((star) => {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    if (moon === false) {
      return;
    }
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(392, 18, 24, 28);
    ctx.fillRect(388, 22, 32, 20);
    ctx.fillStyle = '#c08a10';
    ctx.fillRect(398, 24, 5, 5);
    ctx.fillRect(408, 33, 4, 4);
    ctx.fillRect(394, 34, 3, 3);
  }

  function drawRidge(ctx, shift, color, baseY, amplitude, wavelength) {
    ctx.fillStyle = color;
    for (let x = 0; x < WIDTH; x += 4) {
      const world = x + shift;
      const wave = Math.sin(world / wavelength) + Math.sin(world / (wavelength * 0.43)) * 0.5;
      const height = Math.round((amplitude + wave * amplitude * 0.55) / 4) * 4;
      ctx.fillRect(x, baseY - height, 4, height + 70);
    }
  }

  function drawTowers(ctx, shift) {
    eachSlot(shift, 104, (x, index) => {
      const height = 26 + ((index * 37) % 5) * 8;
      const width = 24 + ((index * 17) % 3) * 6;
      ctx.fillStyle = '#0b1c46';
      ctx.fillRect(x, GROUND - height, width, height);
      ctx.fillStyle = '#16357f';
      ctx.fillRect(x, GROUND - height, width, 3);
      ctx.fillStyle = '#ffd23f';
      for (let row = 0; row < Math.floor(height / 10); row += 1) {
        for (let col = 0; col < Math.floor(width / 10); col += 1) {
          if ((row + col + index) % 3 !== 0) {
            ctx.fillRect(x + 4 + col * 10, GROUND - height + 8 + row * 10, 3, 4);
          }
        }
      }
    });
  }

  function drawGround(ctx, shift) {
    ctx.fillStyle = '#071026';
    ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
    ctx.fillStyle = '#1b8f45';
    ctx.fillRect(0, GROUND, WIDTH, 7);
    ctx.fillStyle = '#3ddc6b';
    ctx.fillRect(0, GROUND, WIDTH, 2);

    eachSlot(shift, 14, (x, index) => {
      if (index % 2 === 0) {
        ctx.fillStyle = '#3ddc6b';
        ctx.fillRect(x, GROUND + 7, 2, 2);
      }
    });

    eachSlot(shift, 36, (x) => {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x, GROUND + 20, 14, 3);
    });

    eachSlot(shift * 0.6, 22, (x, index) => {
      ctx.fillStyle = '#0d1c3c';
      ctx.fillRect(x, GROUND + 30 + (index % 3) * 6, 6, 2);
    });
  }

  function drawProps(ctx, shift) {
    eachSlot(shift, 148, (x, index) => {
      if (index % 2 === 0) {
        ctx.fillStyle = '#0f2b1c';
        ctx.fillRect(x + 6, GROUND - 26, 4, 26);
        ctx.fillStyle = '#1b8f45';
        ctx.fillRect(x, GROUND - 40, 16, 16);
        ctx.fillStyle = '#3ddc6b';
        ctx.fillRect(x + 2, GROUND - 38, 6, 5);
        return;
      }
      ctx.fillStyle = '#16357f';
      ctx.fillRect(x + 4, GROUND - 18, 14, 18);
      ctx.fillStyle = '#2f6bff';
      ctx.fillRect(x + 4, GROUND - 18, 14, 3);
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(x + 7, GROUND - 12, 3, 3);
      ctx.fillRect(x + 12, GROUND - 12, 3, 3);
    });
  }

  function drawFinish(ctx, progress) {
    const distance = (1 - progress) * 820;
    const x = Math.round(RUNNER_X + distance);
    if (x > WIDTH + 30 || x < -30) {
      return;
    }
    ctx.fillStyle = '#f2f8ff';
    ctx.fillRect(x, 46, 4, GROUND - 46);
    for (let row = 0; row < 6; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#f2f8ff' : '#050a1c';
        ctx.fillRect(x + 4 + col * 6, 46 + row * 6, 6, 6);
      }
    }
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(x - 2, 42, 40, 4);
  }

  function drawCharacters(ctx, view) {
    const runnerFrame = RUNNER[Math.floor(view.tick * (7 + view.speed * 4)) % RUNNER.length];
    const bob = view.running && Math.floor(view.tick * 12) % 2 === 0 ? -2 : 0;
    const runnerY = GROUND - RUNNER[0].length * SCALE + bob;

    ctx.fillStyle = 'rgba(5, 10, 28, 0.55)';
    ctx.fillRect(RUNNER_X + 3, GROUND - 2, 30, 4);
    drawSprite(ctx, runnerFrame, RUNNER_X, runnerY, SCALE);

    if (!view.monster) {
      return;
    }

    const monsterX = Math.round(RUNNER_X - 52 - view.gap * 150);
    if (monsterX < -60) {
      return;
    }
    const monsterFrame = MONSTER[Math.floor(view.tick * 8) % MONSTER.length];
    const lunge = view.gap < 0.3 ? Math.round(Math.sin(view.tick * 14) * 3) : 0;
    ctx.fillStyle = 'rgba(5, 10, 28, 0.55)';
    ctx.fillRect(monsterX + 6, GROUND - 2, 36, 4);
    drawSprite(ctx, monsterFrame, monsterX + lunge, GROUND - MONSTER[0].length * SCALE, SCALE);
  }

  function drawParticles(ctx, particles) {
    particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      const size = particle.life > 0.4 ? 3 : 2;
      ctx.fillRect(Math.round(particle.x), Math.round(particle.y), size, size);
    });
  }

  function drawAlert(ctx, view) {
    if (!view.monster || view.gap > 0.24) {
      return;
    }
    if (Math.floor(view.tick * 6) % 2 === 0) {
      return;
    }
    ctx.fillStyle = '#ffd23f';
    for (let y = 0; y < HEIGHT; y += 16) {
      ctx.fillRect(0, y, 6, 8);
      ctx.fillRect(WIDTH - 6, y + 8, 6, 8);
    }
  }

  function drawCell(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, CELL, CELL);
    ctx.fillStyle = 'rgba(242, 248, 255, 0.35)';
    ctx.fillRect(x, y, CELL, 2);
    ctx.fillStyle = 'rgba(5, 10, 28, 0.45)';
    ctx.fillRect(x, y + CELL - 2, CELL, 2);
    ctx.fillRect(x + CELL - 2, y, 2, CELL);
  }

  function drawWell(ctx, well, x, y, tick, color) {
    const width = well.cols * CELL;
    const height = well.rows * CELL;
    const danger = Blocks.fill(well) > 0.7;

    ctx.fillStyle = '#04091b';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = 'rgba(47, 107, 255, 0.22)';
    for (let row = 0; row < well.rows; row += 1) {
      for (let col = 0; col < well.cols; col += 1) {
        ctx.fillRect(x + col * CELL, y + row * CELL, 1, 1);
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    for (let row = 0; row < well.rows; row += 1) {
      for (let col = 0; col < well.cols; col += 1) {
        const key = well.grid[row][col];
        if (key) {
          drawCell(ctx, x + col * CELL, y + row * CELL, PALETTE[key]);
        }
      }
    }
    if (well.falling) {
      const piece = well.falling;
      piece.shape.cells.forEach((cell) => {
        drawCell(
          ctx,
          x + (piece.col + cell[0]) * CELL,
          y + Math.round((piece.y + cell[1]) * CELL),
          PALETTE[piece.shape.color]
        );
      });
    }
    if (well.flash > 0) {
      ctx.fillStyle = 'rgba(242, 248, 255, ' + Math.min(0.65, well.flash).toFixed(2) + ')';
      ctx.fillRect(x, y, width, height);
    }
    ctx.restore();

    ctx.fillStyle = danger && Math.floor(tick * 5) % 2 === 0 ? '#f2f8ff' : color;
    ctx.fillRect(x - 3, y - 3, width + 6, 3);
    ctx.fillRect(x - 3, y + height, width + 6, 3);
    ctx.fillRect(x - 3, y - 3, 3, height + 6);
    ctx.fillRect(x + width, y - 3, 3, height + 6);
  }

  function drawStrike(ctx, strike) {
    if (!strike || strike.life <= 0) {
      return;
    }
    const progress = 1 - strike.life;
    const from = strike.toRival ? 232 : 248;
    const direction = strike.toRival ? 1 : -1;
    ctx.fillStyle = strike.toRival ? '#3ddc6b' : '#ffd23f';
    for (let index = 0; index < 4; index += 1) {
      const step = progress * 200 - index * 16;
      if (step < 0) {
        continue;
      }
      ctx.fillRect(Math.round(from + direction * step), 92 + (index % 2) * 8, 6, 6);
    }
  }

  function drawGoal(ctx, x, color) {
    ctx.fillStyle = color;
    for (let y = 44; y < GROUND; y += 12) {
      ctx.fillRect(x, y, 3, 7);
    }
    ctx.fillRect(x - 4, GROUND - 4, 11, 4);
  }

  function drawTug(ctx, view) {
    ctx.imageSmoothingEnabled = false;
    drawSky(ctx, true);

    const shakeX = view.shake ? Math.round((Math.random() - 0.5) * view.shake * 6) : 0;
    ctx.save();
    ctx.translate(shakeX, 0);

    drawRidge(ctx, 40, '#101f4e', 96, 18, 78);
    drawRidge(ctx, 96, '#14306b', 108, 14, 52);
    drawTowers(ctx, 150);
    drawGround(ctx, 0);

    drawGoal(ctx, 150, '#3ddc6b');
    drawGoal(ctx, 350, '#ffd23f');
    ctx.fillStyle = 'rgba(242, 248, 255, 0.35)';
    for (let y = 52; y < GROUND; y += 10) {
      ctx.fillRect(250, y, 1, 5);
    }

    const knot = Math.round(150 + (1 - view.pull) * 200);
    const sway = view.running ? Math.round(Math.sin(view.tick * 7) * 2) : 0;

    const ropeStart = knot - 132;
    const ropeEnd = knot + 122;
    ctx.fillStyle = '#9db4e0';
    ctx.fillRect(ropeStart, 117, ropeEnd - ropeStart, 4);
    ctx.fillStyle = '#f2f8ff';
    for (let x = ropeStart; x < ropeEnd - 4; x += 10) {
      ctx.fillRect(x, 117, 5, 4);
    }

    ctx.fillStyle = '#050a1c';
    ctx.fillRect(knot - 7, 110, 14, 18);
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(knot - 5, 112, 10, 14);

    const frame = view.running ? Math.floor(view.tick * 5) % RUNNER.length : 0;
    drawSprite(ctx, RUNNER[frame], knot - 84 - sway, GROUND - RUNNER[0].length * SCALE, SCALE, false);
    drawSprite(ctx, MONSTER[Math.floor(view.tick * 4) % MONSTER.length], knot + 42 + sway, GROUND - MONSTER[0].length * SCALE, SCALE, true);

    drawParticles(ctx, view.particles || []);
    ctx.restore();

    if (view.pull < 0.3 && Math.floor(view.tick * 6) % 2 === 0) {
      ctx.fillStyle = '#ffd23f';
      for (let y = 0; y < HEIGHT; y += 16) {
        ctx.fillRect(WIDTH - 6, y, 6, 8);
      }
    }
  }

  function drawDuel(ctx, view) {
    ctx.imageSmoothingEnabled = false;
    drawSky(ctx, false);

    const shakeX = view.shake ? Math.round((Math.random() - 0.5) * view.shake * 6) : 0;
    ctx.save();
    ctx.translate(shakeX, 0);

    ctx.fillStyle = '#071026';
    ctx.fillRect(0, 160, WIDTH, HEIGHT - 160);
    ctx.fillStyle = '#1b8f45';
    ctx.fillRect(0, 160, WIDTH, 4);

    drawWell(ctx, view.playerWell, 42, 34, view.tick, '#3ddc6b');
    drawWell(ctx, view.rivalWell, 358, 34, view.tick, '#ffd23f');

    const bob = view.running && Math.floor(view.tick * 6) % 2 === 0 ? -2 : 0;
    drawSprite(ctx, RUNNER[Math.floor(view.tick * 4) % RUNNER.length], 176, 112 + bob, SCALE, false);
    drawSprite(ctx, MONSTER[Math.floor(view.tick * 5) % MONSTER.length], 252, 112 - bob, SCALE, true);

    ctx.fillStyle = '#ffd23f';
    for (let y = 40; y < 150; y += 12) {
      ctx.fillRect(239, y, 2, 6);
    }

    drawStrike(ctx, view.strike);
    ctx.restore();
  }

  function draw(ctx, view) {
    ctx.imageSmoothingEnabled = false;
    drawSky(ctx);

    const shakeX = view.shake ? Math.round((Math.random() - 0.5) * view.shake * 8) : 0;
    const shakeY = view.shake ? Math.round((Math.random() - 0.5) * view.shake * 5) : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawRidge(ctx, view.offset * 0.16, '#101f4e', 96, 18, 78);
    drawRidge(ctx, view.offset * 0.3, '#14306b', 108, 14, 52);
    drawTowers(ctx, view.offset * 0.55);
    drawGround(ctx, view.offset);
    drawFinish(ctx, view.progress);
    drawProps(ctx, view.offset);
    drawCharacters(ctx, view);
    drawParticles(ctx, view.particles || []);
    ctx.restore();

    drawAlert(ctx, view);
  }

  return { draw, drawDuel, drawTug, WIDTH, HEIGHT, GROUND, RUNNER_X };
})();
