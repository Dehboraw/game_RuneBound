// ============================================================
//  RuneBound: The Ascendant — Canvas 2D
//  5 andares, 2 personagens (Cavaleiro Solitário / Guarda Real)
// ============================================================
'use strict';

// ---------------- Canvas ----------------
const cv = document.getElementById('game');
let ctx = cv.getContext('2d');
let W = innerWidth, H = innerHeight;
function resize() { W = innerWidth; H = innerHeight; cv.width = W; cv.height = H; }
addEventListener('resize', resize); resize();

// ---------------- Helpers ----------------
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------- Input ----------------
const keys = {};
let aimX = 0, aimY = 0, aimActive = false;
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); keys.__atk = true; }
});
addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space') keys.__atk = false; });
addEventListener('mousemove', e => {
  aimX = e.clientX + cam.x; aimY = e.clientY + cam.y;
  aimActive = true;
});
addEventListener('mousedown', () => { keys.__atk = true; });
addEventListener('mouseup', () => { keys.__atk = false; });

// ---------------- HUD ----------------
const hud = {
  hp: document.getElementById('hp'),
  dash: document.getElementById('dash'),
  stats: document.getElementById('stats'),
  obj: document.getElementById('objective'),
  keys: document.getElementById('keys'),
  title: document.getElementById('levelTitle'),
  timer: document.getElementById('timer'),
  boss: document.getElementById('bossbar'),
  bossHP: document.getElementById('bossHP'),
  phase: document.getElementById('phaseMsg'),
};
function showMsg(t) {
  hud.phase.textContent = t;
  hud.phase.style.opacity = 1;
  clearTimeout(showMsg._t);
  showMsg._t = setTimeout(() => hud.phase.style.opacity = 0, 1800);
}

// ============================================================
//  SPRITES
// ============================================================
function shadowBlob(x, y, r, a = .35) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * .38, 0, 0, TAU);
  ctx.fill();
}

function drawHero(x, y, t, dir, cfg, slashT, moving) {
  const armor = cfg.armor, trim = cfg.trim, skin = cfg.skin, cloak = cfg.cloak;
  shadowBlob(x, y + 6, 11);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  const bob = moving ? 0 : Math.sin(t * 1.6) * 1.2;
  // capa
  ctx.fillStyle = cloak;
  const swing = moving ? Math.sin(t * 10) * 4 : Math.sin(t * 1.6) * 2;
  ctx.beginPath();
  ctx.moveTo(-2, -26);
  ctx.quadraticCurveTo(-16 + swing * .5, -10, -10 + swing, 4 + bob);
  ctx.quadraticCurveTo(-4, -14, 2, -24);
  ctx.closePath(); ctx.fill();
  // pernas
  const legA = moving ? Math.sin(t * 11) * 5 : 0;
  ctx.strokeStyle = '#2a2f3d'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(-2 + legA, 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -8); ctx.lineTo(3 - legA, 4); ctx.stroke();
  // torso
  const g = ctx.createLinearGradient(-8, -30, 8, 0);
  g.addColorStop(0, trim); g.addColorStop(.25, armor); g.addColorStop(1, '#1e2434');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-8, -26); ctx.lineTo(8, -26); ctx.lineTo(6, -4); ctx.lineTo(-6, -4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = trim; ctx.fillRect(-2.5, -22, 5, 9);
  // cabeça/elmo
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(1, -31, 6.4, 0, TAU); ctx.fill();
  ctx.fillStyle = armor;
  ctx.beginPath(); ctx.arc(1, -31.5, 6.8, Math.PI * .95, Math.PI * 2.08); ctx.fill();
  ctx.fillRect(-5.8, -32, 11, 3);
  ctx.fillStyle = '#0d1018'; ctx.fillRect(-2.2, -31, 3.4, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.beginPath(); ctx.arc(3.4, -33.5, 1.4, 0, TAU); ctx.fill();
  // escudo da guarda
  if (cfg.weapon === 'spear') {
    ctx.fillStyle = '#8a1f2b';
    ctx.beginPath();
    ctx.moveTo(1, -14); ctx.lineTo(11, -12); ctx.lineTo(10, -2); ctx.lineTo(1, 4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.6; ctx.stroke();
  }
  // arma
  const swingAng = slashT > 0 ? -1.1 + (1 - slashT) * 2.5 : -.35 + Math.sin(t * 1.8) * .06;
  ctx.save();
  ctx.translate(7, -20);
  ctx.rotate(swingAng);
  if (cfg.weapon === 'sword') {
    ctx.fillStyle = '#dfe8ff';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(23, -2.6); ctx.lineTo(30, 0); ctx.lineTo(23, 2.6); ctx.lineTo(0, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9aa8c0'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#c9a227'; ctx.fillRect(-3.4, -4.5, 4, 9);
    ctx.fillStyle = '#5a3c22'; ctx.fillRect(-9, -2, 6.4, 4);
  } else {
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-8, -1.7, 34, 3.4);
    ctx.fillStyle = '#e8eefc';
    ctx.beginPath(); ctx.moveTo(26, -5); ctx.lineTo(38, 0); ctx.lineTo(26, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9a227'; ctx.fillRect(17, -3, 3, 6);
  }
  ctx.restore();
  // arco do golpe
  if (slashT > 0) {
    const pp = 1 - slashT;
    ctx.strokeStyle = `rgba(255,236,170,${slashT * .95})`;
    ctx.lineWidth = 5 * slashT + 1;
    ctx.beginPath();
    ctx.arc(4, -18, cfg.attackRange * .84, -0.9 - pp * 1.2, 1.0 - pp * .4);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${slashT * .8})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawGoblin(e) {
  const { x, y } = e; const t = e.anim;
  shadowBlob(x, y + 5, 9);
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const legA = Math.sin(t * 12) * 3;
  ctx.strokeStyle = '#3f5424'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-1, -5); ctx.lineTo(-1 + legA, 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(2 - legA, 4); ctx.stroke();
  ctx.fillStyle = '#6b8e3a';
  ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(6, -16); ctx.lineTo(5, -4); ctx.lineTo(-5, -4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#87b04d'; ctx.beginPath(); ctx.arc(1, -21, 5.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -23); ctx.lineTo(-10, -26); ctx.lineTo(-4, -20.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, -23); ctx.lineTo(10, -26); ctx.lineTo(4, -20.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e33333'; ctx.fillRect(3.4, -22.5, 2.4, 2);
  ctx.save(); ctx.translate(6, -12); ctx.rotate(.5 + Math.sin(t * 9) * .2);
  ctx.fillStyle = '#8a6b3a'; ctx.fillRect(-2, -2, 12, 4);
  ctx.fillStyle = '#75552d'; ctx.beginPath(); ctx.arc(11, 0, 3.4, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
}

function drawBat(e) {
  shadowBlob(e.x, e.y + e.eggHover || e.y + 14, 6, .2);
  ctx.save(); ctx.translate(e.x, e.y);
  const flap = Math.sin(e.anim * 16) * .8;
  ctx.fillStyle = '#6b4a8a';
  ctx.beginPath(); ctx.ellipse(-7, 0, 7, 3.2, -.35 + flap * .5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, 0, 7, 3.2, .35 - flap * .5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2b4a';
  ctx.beginPath(); ctx.ellipse(0, 0, 5.4, 4.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff4455';
  ctx.fillRect(-2.6, -1.4, 1.7, 1.7); ctx.fillRect(.9, -1.4, 1.7, 1.7);
  ctx.restore();
}

function drawMage(e) {
  const { x, y } = e; const t = e.anim;
  shadowBlob(x, y + 6, 9, .3);
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const g = ctx.createLinearGradient(0, -30, 0, 8);
  g.addColorStop(0, '#6b3a8a'); g.addColorStop(1, '#2a1040');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9c7a0'; ctx.beginPath(); ctx.arc(1, -30, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1040';
  ctx.beginPath(); ctx.moveTo(-6.5, -33); ctx.lineTo(8.5, -33); ctx.lineTo(1, -44); ctx.closePath(); ctx.fill();
  ctx.fillRect(-7.4, -34, 16, 2.2);
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(10, -26); ctx.stroke();
  const glow = .5 + Math.sin(t * 6) * .5;
  const og = ctx.createRadialGradient(10.5, -30, 1, 10.5, -30, 7);
  og.addColorStop(0, '#e0b0ff');
  og.addColorStop(.55, `rgba(170,68,255,${.6 + glow * .35})`);
  og.addColorStop(1, 'rgba(170,68,255,0)');
  ctx.fillStyle = og; ctx.beginPath(); ctx.arc(10.5, -30, 7, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawNecromancer(e) {
  const { x, y } = e; const t = e.anim;
  shadowBlob(x, y + 8, 14, .45);
  ctx.save(); ctx.translate(x, y);
  const a = ctx.createRadialGradient(0, -20, 8, 0, -20, 46);
  a.addColorStop(0, 'rgba(120,40,60,.3)'); a.addColorStop(1, 'rgba(120,40,60,0)');
  ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, -20, 46, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(0, -44, 0, 10);
  g.addColorStop(0, '#2a1840'); g.addColorStop(1, '#0c0818');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(13, 10); ctx.lineTo(-13, 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#301845';
  ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(20, 6); ctx.lineTo(-20 + Math.sin(t * 2) * 3, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(10,6,24,.9)';
  ctx.beginPath(); ctx.arc(0, -48, 7.5, 0, TAU); ctx.fill();
  ctx.fillStyle = e.invuln ? '#88ffbb' : '#ff5566';
  ctx.fillRect(-3.4, -50, 2.6, 2.4); ctx.fillRect(1, -50, 2.6, 2.4);
  ctx.strokeStyle = '#3a2b1a'; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(14, -40); ctx.stroke();
  const glow = .5 + Math.sin(t * 4) * .5;
  const og = ctx.createRadialGradient(14, -44, 2, 14, -44, 11);
  og.addColorStop(0, '#b8ffd0');
  og.addColorStop(.5, `rgba(102,255,136,${.5 + glow * .4})`);
  og.addColorStop(1, 'rgba(102,255,136,0)');
  ctx.fillStyle = og; ctx.beginPath(); ctx.arc(14, -44, 11, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawRune(r) {
  const t = r.anim;
  ctx.save(); ctx.translate(r.x, r.y + Math.sin(t * 2) * 4);
  const s = clamp(r.hp / 8, .15, 1);
  ctx.globalAlpha = .35 + s * .5;
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
  glow.addColorStop(0, 'rgba(255,80,110,.8)'); glow.addColorStop(1, 'rgba(255,80,110,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ff5577'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#ffd76e';
  ctx.rotate(t);
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 0); ctx.lineTo(0, 7); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawKey(k) {
  const t = k.anim;
  ctx.save(); ctx.translate(k.x, k.y + Math.sin(t * 3) * 4);
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
  glow.addColorStop(0, 'rgba(255,215,110,.7)'); glow.addColorStop(1, 'rgba(255,215,110,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ffd76e'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.arc(0, -2, 3.6, 0, TAU); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 1.4); ctx.lineTo(0, 8);
  ctx.moveTo(0, 6); ctx.lineTo(3.4, 6);
  ctx.moveTo(0, 3.6); ctx.lineTo(2.8, 3.6);
  ctx.stroke();
  ctx.restore();
}

function drawPortal(x, y, t) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 3; i++) {
    const r = 12 + i * 6, p = (t * .9 + i * .33) % 1;
    ctx.strokeStyle = `rgba(102,238,255,${(1 - p) * .8})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r * p + 4, 0, TAU); ctx.stroke();
  }
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
  glow.addColorStop(0, 'rgba(200,250,255,.9)'); glow.addColorStop(1, 'rgba(102,238,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
  ctx.restore();
}

// ============================================================
//  PERSONAGENS JOGÁVEIS
// ============================================================
const CHARS = {
  knight: {
    label: 'Cavaleiro Solitário',
    maxHp: 110, speed: 215, dmg: 2, attackRange: 54, atkCd: .5, weapon: 'sword',
    armor: '#4a5a70', trim: '#c9a227', skin: '#d9c7a0', cloak: '#27303f',
  },
  guard: {
    label: 'Guarda Real',
    maxHp: 135, speed: 250, dmg: 1.45, attackRange: 48, atkCd: .36, weapon: 'spear',
    armor: '#7a2530', trim: '#c9a227', skin: '#e0cfa8', cloak: '#5a1620',
  },
};

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let charSel = 'knight';
let state = 'menu';
let world = null;
let time = 0;
let shake = 0;
let particles = [], pops = [];

const cam = { x: 0, y: 0 };

function spawnParticles(x, y, color, n = 12, spd = 130, up = 90) {
  for (let i = 0; i < n; i++)
    particles.push({
      x, y, vx: rand(-spd, spd), vy: -rand(30, up + sortaUp()),
      life: rand(.4, .9), color, size: rand(1.5, 3.6), grav: 320,
    });
}
const sortaUp = () => 60;

function popText(x, y, text, color = '#fff', size = 14) {
  pops.push({ x, y, text, color, size, life: .9 });
}

// ============================================================
//  MUNDO
// ============================================================
function newWorld(idx) {
  world = {
    idx,
    walls: [], enemies: [], projectiles: [], hazards: [],
    pickups: [], runes: [],
    kills: 0, killsNeeded: 0,
    keys: 0, keysNeeded: 0,
    spawned: 0,
    platforms: null,
    windActive: false, windForce: null, windDur: 0, windT: 0, windStreaks: null,
    timeLeft: -1,
    complete: false,
    checkWin: null, update: null, bg: null,
    objective: '',
    player: {
      x: 120, y: 300, cfg: CHARS[charSel],
      hp: CHARS[charSel].maxHp, dir: 1, anim: 0, moving: false,
      atkCd: 0, slashT: 0, hitDone: false,
      dashCd: 0, dashing: 0, invuln: 0,
      fall: 0, dead: false, ghost: [],
    },
  };
  [buildL1, buildL2, buildL3, buildL4, buildL5][idx](world);
  cam.x = clamp(world.player.x - W / 2, 0, Math.max(0, world.w - W));
  cam.y = clamp(world.player.y - H / 2, 0, Math.max(0, world.h - H));
  if (world.w < W) cam.x = (world.w - W) / 2;
  if (world.h < H) cam.y = (world.h - H) / 2;
}

function pTakeDamage(d) {
  const p = world.player;
  if (p.dead || p.invuln > 0) return;
  p.hp -= d;
  p.invuln = Math.max(p.invuln, .55);
  shake = Math.min(shake + 6, 14);
  spawnParticles(p.x, p.y - 28, '#c0392b', 8, 110);
  popText(p.x, p.y - 48, `-${Math.round(d)}`, '#ff7b6e');
  if (p.hp <= 0) {
    p.hp = 0; p.dead = true;
    deathOf('As sombras das trevas consumiram nosso herói…');
  }
}

// -------- colisão com paredes (AABB, resolvida por blocagem por eixo)
function moveWithCollision(px, py, vx, vy) {
  let x = px + vx, y = py + vy;
  const r = 10;
  for (const b of world.walls) {
    if (x + r > b.x && x - r < b.x + b.w && y + 5 > b.y && y - 5 < b.y + b.h) {
      if (px + r <= b.x) { x = b.x - r; }
      else if (px - r >= b.x + b.w) { x = b.x + b.w + r; }
      else if (py + 5 <= b.y) { y = b.y - 5; }
      else if (py - 5 >= b.y + b.h) { y = b.y + b.h + 5; }
      else { x = px; y = py; } // começou dentro: não resolve
    }
  }
  return { x, y };
}

function updatePlayer(dt) {
  const p = world.player;
  if (p.dead) return;
  let ix = 0, iy = 0;
  if (keys.KeyW || keys.ArrowUp) iy -= 1;
  if (keys.KeyS || keys.ArrowDown) iy += 1;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1;
  let vx = 0, vy = 0;
  if (ix || iy) {
    const n = Math.hypot(ix, iy);
    vx = ix / n * p.cfg.speed;
    vy = iy / n * p.cfg.speed;
    p.dir = ix !== 0 ? Math.sign(ix) : p.dir;
    p.moving = true;
    p.anim += dt;
  } else p.moving = false;

  // dash
  if ((keys.ShiftLeft || keys.ShiftRight) && p.dashCd <= 0 && (ix || iy)) {
    p.dashing = .22; p.dashCd = .9; p.invuln = Math.max(p.invuln, .45);
    spawnParticles(p.x, p.y - 14, '#8fd6ff', 8, 60, 30);
  }
  if (p.dashing > 0) {
    p.dashing -= dt;
    vx *= 3.2; vy *= 3.2;
    p.ghost.push({ x: p.x, y: p.y, t: 1, dir: p.dir });
  }
  p.ghost = p.ghost.filter(g => (g.t -= dt * 3) > 0);
  p.dashCd -= dt; p.invuln -= dt; p.atkCd -= dt;

  // ataque (mouse: alvo pelo cursor; teclado: direção de movimento)
  if (keys.__atk && p.atkCd <= 0) {
    if (aimActive && dist(p.x, p.y - 18, aimX, aimY) > 26) p.dir = aimX > p.x ? 1 : -1;
    p.atkCd = p.cfg.atkCd;
    p.slashT = 1; p.hitDone = false;
  }
  if (p.slashT > 0) {
    p.slashT -= dt / .28;
    doSlashHit(p);
  }

  if (world.windActive && world.windForce) {
    vx += world.windForce.x * dt * 55;
    vy += world.windForce.y * dt * 55;
  }
  const pos = moveWithCollision(p.x, p.y, vx * dt, vy * dt);
  p.x = clamp(pos.x, 12, world.w - 12);
  p.y = clamp(pos.y, 60, world.h - 12);

  // abismo (L4)
  if (world.platforms) {
    const on = world.platforms.some(b =>
      p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h);
    if (!on) {
      p.fall += dt * 150;
      if (p.fall > 46) { deathOf('O abismo engoliu nosso herói… cuidado com o vento!'); return; }
    } else p.fall = Math.max(0, p.fall - dt * 420);
  }

  // perigos
  world.hazards = world.hazards.filter(hz => hz.update(dt));
}

// golpe: dano em semicírculo à frente no início do golpe
function doSlashHit(p) {
  if (p.hitDone || p.slashT < .68) return;
  p.hitDone = true;
  const rr = p.cfg.attackRange;
  const cx = p.x + p.dir * rr * .4, cy = p.y - 18;
  let hit = false;
  for (const e of world.enemies) {
    if (e.dead) continue;
    const ey = e.y - 18;
    if (dist(cx, cy, e.x, ey) < rr &&
        ((e.x - p.x) * p.dir > -6 || Math.abs(e.x - p.x) < rr * .45)) {
      e.hp -= p.cfg.dmg;
      e.flash = .18;
      spawnParticles(e.x, ey, '#ffd76e', 5, 90, 60);
      popText(e.x, ey - 16, `-${p.cfg.dmg}`);
      hit = true;
      if (e.hp <= 0) killEnemy(e);
    }
  }
  for (const r of world.runes) {
    if (r.dead) continue;
    if (dist(cx, cy, r.x, r.y) < rr) {
      r.hp -= p.cfg.dmg;
      popText(r.x, r.y - 18, `-${p.cfg.dmg}`, '#ff99aa');
      if (r.hp <= 0) {
        r.dead = true;
        spawnParticles(r.x, r.y, '#ff5577', 20, 150);
        popText(r.x, r.y - 26, 'Runa destruída!', '#ff99aa', 15);
        shake = 8;
        showMsg('🔒 Runa destruída!');
      }
    }
  }
  // espada derruba feitiços
  world.projectiles = world.projectiles.filter(pr => {
    if (dist(cx, cy, pr.x, pr.y) < rr) {
      spawnParticles(pr.x, pr.y, pr.color, 6, 90, 20);
      return false;
    }
    return true;
  });
  if (hit) shake = Math.min(shake + 3, 8);
}

function killEnemy(e) {
  e.dead = true;
  world.kills += e.boss ? 10 : 1;
  spawnParticles(e.x, e.y - 12, e.color || '#fff', 16, 140);
  if (!e.boss) popText(e.x, e.y - 24, '+1 ⚔', '#ffe9a8');
  else popText(e.x, e.y - 56, 'O Necromante tombou!', '#8fe38f', 20);
}

function shoot(px, py, tx, ty, speed, color, homing = .5) {
  const d = dist(px, py, tx, ty) || 1;
  world.projectiles.push({
    x: px, y: py,
    vx: (tx - px) / d * speed, vy: (ty - py) / d * speed,
    speed, color, homing, life: 5,
  });
}

// ============================================================
//  FASES
// ============================================================
function spawnGoblinAt(x, y) {
  world.enemies.push({
    type: 'goblin', x, y, hp: 3, anim: rand(0, 9), dir: -1, flash: 0,
    speed: rand(85, 120), atkCd: rand(0, 1), color: '#6b8e3a',
  });
}

// ---------- FASE 1: Pátios ----------
function buildL1(w) {
  w.w = 1400; w.h = 1000; w.bg = bgL1;
  [[250, 180, 130, 90], [620, 120, 150, 100], [1050, 200, 120, 90],
   [180, 620, 120, 130], [1100, 640, 140, 120], [700, 830, 160, 90],
   [950, 460, 90, 90]].forEach(([x, y, rw, rh]) => w.walls.push({ x, y, w: rw, h: rh, house: true }));
  w.player.x = 140; w.player.y = w.h / 2;
  w.killsNeeded = 10;
  w.checkWin = () => world.kills >= world.killsNeeded;
  w.update = dt => {
    w.rainDrops = w.rainDrops || Array.from({ length: 110 }, () => ({
      x: rand(0, w.w), y: rand(0, w.h), v: rand(700, 900),
    }));
    for (const d of w.rainDrops) {
      d.y += d.v * dt; d.x -= 110 * dt;
      if (d.y > w.h) { d.y = 0; d.x = rand(0, w.w); }
      if (d.x < 0) d.x += w.w;
    }
    const alive = w.enemies.filter(e => !e.dead).length;
    if (w.spawned < 10 && alive < 4) {
      spawnGoblinAt(rand(240, w.w - 240), rand(160, w.h - 160));
      w.spawned++;
    }
  };
}

function bgL1() {
  const w = world;
  ctx.fillStyle = '#12182b';
  ctx.fillRect(cam.x, cam.y, W, H);
  // estrelas
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 70; i++) {
    const sx = (i * 997) % w.w, sy = (i * 613) % Math.min(w.h, 420);
    if (inViewRaw(sx, sy, 20)) ctx.fillRect(sx, sy, 2, 2);
  }
  // lua
  const mx = cam.x + W - 130, my = cam.y + 90;
  ctx.fillStyle = 'rgba(223,230,242,.95)';
  ctx.beginPath(); ctx.arc(mx, my, 38, 0, TAU); ctx.fill();
  ctx.fillStyle = '#12182b';
  ctx.beginPath(); ctx.arc(mx + 22, my - 12, 34, 0, TAU); ctx.fill();
  // chão
  const gg = ctx.createLinearGradient(0, 80, 0, cam.y + H);
  gg.addColorStop(0, '#2c3a2c'); gg.addColorStop(1, '#1f2b20');
  ctx.fillStyle = gg;
  ctx.fillRect(cam.x, Math.max(cam.y, 80), W, Math.min(H + cam.y - 80, w.h - 80 + 4));
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  for (let i = 0; i < 44; i++) {
    const sx = (i * 761) % w.w, sy = 100 + ((i * 419) % (w.h - 130));
    if (inViewRaw(sx, sy, 6)) ctx.fillRect(sx, sy, 5, 3);
  }
}

function bgL2() {
  ctx.fillStyle = '#141120';
  ctx.fillRect(cam.x, cam.y, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.04)';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 911) % world.w, sy = (i * 577) % world.h;
    if (inViewRaw(sx, sy, 16)) ctx.fillRect(sx, sy, 14, 8);
  }
}

function bgL3() {
  const w = world;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#302216'); g.addColorStop(1, '#1a1209');
  ctx.fillStyle = g;
  ctx.fillRect(cam.x, cam.y, W, H);
  // tapete
  ctx.fillStyle = '#7a1818';
  ctx.fillRect(w.w * .18, w.h / 2 - 60, w.w * .64, 120);
  ctx.strokeStyle = 'rgba(255,215,110,.35)'; ctx.lineWidth = 3;
  ctx.strokeRect(w.w * .18 + 9, w.h / 2 - 51, w.w * .64 - 18, 102);
}

function bgL4() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#15251c'); g.addColorStop(1, '#0a120e');
  ctx.fillStyle = g;
  ctx.fillRect(cam.x, cam.y, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  for (let i = 0; i < 8; i++) {
    const sx = ((i * 1207 + time * 14) % (W + 340)) + cam.x - 170;
    const sy = 60 + (i * 211) % (H * .5) + cam.y * .9;
    ctx.beginPath(); ctx.ellipse(sx, sy, 64 + i * 8, 14, 0, 0, TAU); ctx.fill();
  }
}

function bgL5() {
  const w = world;
  const g = ctx.createRadialGradient(w.w / 2, w.h / 2, 60, w.w / 2, w.h / 2, Math.max(w.w, w.h) * .72);
  g.addColorStop(0, '#3a1414'); g.addColorStop(1, '#110606');
  ctx.fillStyle = g;
  ctx.fillRect(cam.x, cam.y, W, H);
  // círculo ritualístico
  ctx.strokeStyle = 'rgba(255,70,100,.26)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(w.w / 2, w.h / 2, 120, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,70,100,.14)'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const ang = i / 6 * TAU + time * .12;
    ctx.beginPath();
    ctx.moveTo(w.w / 2 + Math.cos(ang) * 90, w.h / 2 + Math.sin(ang) * 90);
    ctx.lineTo(w.w / 2 + Math.cos(ang + 2.2) * 150, w.h / 2 + Math.sin(ang + 2.2) * 150);
    ctx.stroke();
  }
  // lua eclipsada gigante ao fundo (paralaxe leve)
  const mx = w.w / 2 + (cam.x - (w.w - W) / 2) * .8, my = 90;
  ctx.fillStyle = 'rgba(90,26,32,.55)';
  ctx.beginPath(); ctx.arc(mx, my, 74, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(20,8,10,.92)';
  ctx.beginPath(); ctx.arc(mx - 12, my - 8, 64, 0, TAU); ctx.fill();
}

function inViewRaw(x, y, m = 40) {
  return x > cam.x - m && x < cam.x + W + m && y > cam.y - m && y < cam.y + H + m;
}

// ---------- FASE 2: Catacumbas ----------
function buildL2(w) {
  w.w = 1500; w.h = 1200; w.bg = bgL2;
  const W_ = (x, y, ww, hh) => w.walls.push({ x, y, w: ww, h: hh });
  W_(0, 0, 1500, 40); W_(0, 1160, 1500, 40); W_(0, 0, 40, 1200); W_(1460, 0, 40, 1200);
  W_(500, 40, 60, 380); W_(300, 40, 60, 200); W_(900, 40, 60, 300);
  W_(220, 420, 500, 60); W_(1000, 340, 60, 320); W_(1180, 560, 320, 60);
  W_(300, 800, 60, 340); W_(700, 700, 60, 300); W_(940, 860, 400, 60);
  W_(40, 640, 260, 60); W_(1240, 900, 260, 60); W_(480, 1000, 60, 200);
  // tochas
  w.torches = [[220, 500], [680, 300], [1080, 420], [1300, 700], [560, 900], [140, 1080], [860, 1100], [400, 150]];
  // chaves
  [[260, 150], [1250, 420], [1300, 1100]].forEach(([x, y]) => {
    w.pickups.push({ type: 'key', x, y, anim: rand(0, 9) });
  });
  // espinhos
  [[770, 500], [120, 800], [1080, 950], [820, 760]].forEach(([x, y]) => {
    w.hazards.push({ type: 'spike', x, y, t: rand(0, 2.4), update(dt) {
      this.t += dt;
      if ((this.t % 2.4) > 1.2 && dist(this.x, this.y, world.player.x, world.player.y) < 32)
        pTakeDamage(7);
      return true;
    } });
  });
  // morcegos
  [[420, 620], [1000, 260], [1300, 800], [200, 980]].forEach(([x, y]) => {
    for (let i = 0; i < 2; i++)
      w.enemies.push({
        type: 'bat', x: x + rand(-30, 30), y: y + rand(-30, 30), hp: 2,
        anim: rand(0, 9), t: rand(0, 9), speed: 190, color: '#3a2b4a',
      });
  });
  w.keysNeeded = 3;
  w.objective = '🗝 Encontre 3 chaves de ouro! Evite os espinhos e o bando de morcegos.';
  w.player.x = 110; w.player.y = 180;
}

// ---------- FASE 3: Biblioteca ----------
function buildL3(w) {
  w.w = 1400; w.h = 1000; w.bg = bgL3;
  for (let i = 0; i < 5; i++) {
    const x = 180 + i * 230;
    w.walls.push({ x, y: 130, w: 55, h: 480, shelf: true });
    w.walls.push({ x, y: 720, w: 55, h: 220, shelf: true });
  }
  [[300, 640], [700, 620], [1080, 640], [1250, 900]].forEach(([x, y]) => {
    w.enemies.push({
      type: 'mage', x, y, hp: 5, anim: rand(0, 9), dir: -1,
      shootCd: rand(1, 2.5), color: '#aa44ff',
    });
  });
  w.fireOnExpire = true;
  w.objective = '🔥 Elimine os 4 Magos Renegados! Feitiços errados nas estantes incendeiam o chão.';
  w.player.x = 140; w.player.y = 330;
}

function spawnFire(x, y) {
  world.hazards.push({
    type: 'fire', x, y, t: 0, life: 9,
    update(dt) {
      this.t += dt; this.life -= dt;
      if (dist(this.x, this.y, world.player.x, world.player.y) < 44) pTakeDamage(7);
      return this.life > 0;
    },
  });
}

// ---------- FASE 4: Jardins Suspensos ----------
function buildL4(w) {
  w.w = 1400; w.h = 1000; w.bg = bgL4;
  w.platforms = [];
  const P = (x, y, ww, hh, bridge) => w.platforms.push({ x, y, w: ww, h: hh, bridge });
  P(60, 400, 300, 300);                 // início
  P(60, 272, 180, 100, true);           // ponte esquerda-norte
  P(60, 620, 180, 100, true);           // ponte esquerda-sul
  P(380, 272, 300, 100, true);          // ponte norte
  P(380, 720, 60, 180);                 // ilha central
  P(380, 900, 300, 100, true);          // ponte sul
  P(700, 404, 60, 190);                 // pilar central
  P(790, 272, 300, 100, true);          // ponte norte-direita
  P(790, 620, 300, 100, true);          // ponte sul-direita
  P(1110, 400, 240, 200);               // plataforma do portal
  [[300, 322], [520, 322], [140, 322], [560, 330], [560, 950], [900, 322], [900, 670]].forEach(([x, y]) => {
    w.hazards.push({ type: 'poison', x, y, r: 34, t: 0, update(dt) {
      this.t += dt;
      if (dist(this.x, this.y, world.player.x, world.player.y) < this.r) pTakeDamage(6);
      return true;
    } });
  });
  w.pickups.push({ type: 'portal', x: 1230, y: 480 });
  w.windT = 1.6;
  w.objective = '🌪 Atravesse as pontes e alcance o portal! Rajadas de vento empurram — plantas venenosas mordem.';
  w.player.x = 150; w.player.y = 500;
}

// ---------- FASE 5: Altar do Eclipse ----------
function buildL5(w) {
  w.w = 1250; w.h = 950; w.bg = bgL5;
  w.boss = {
    type: 'boss',
    x: 625, y: 480,
    hp: 60, maxHp: 60,
    anim: 0, flash: 0, dir: 1,
    invuln: true, state: 'idle', stateT: 2.5,
    color: '#66ff88', dead: false,
  };
  w.enemies.push(w.boss);
  w.runes = [[625, 180], [625, 780], [250, 480], [1000, 480]]
    .map(([x, y]) => ({ x, y, hp: 8, anim: rand(0, 6), dead: false }));
  w.timeLeft = 180;
  w.objective = '🌑 Destrua as 4 Runas de Proteção; derrote o Necromante antes que o ritual se complete!';
  w.player.x = 625; w.player.y = 760;
}

// ============================================================
//  INIMIGOS
// ============================================================
function updateEnemies(dt) {
  const p = world.player;
  for (const e of world.enemies) {
    if (e.dead) continue;
    e.anim += dt;
    e.flash = Math.max(0, (e.flash || 0) - dt);
    if (e.type === 'goblin') {
      const d = dist(e.x, e.y, p.x, p.y) || 1;
      const nx = (p.x - e.x) / d, ny = (p.y - e.y) / d;
      if (d > 20) {
        const pos = moveWithCollision(e.x, e.y, nx * e.speed * dt, ny * e.speed * dt);
        e.x = pos.x; e.y = pos.y;
        e.dir = nx < 0 ? -1 : 1;
      }
      e.atkCd -= dt;
      if (d < 26 && e.atkCd <= 0) { e.atkCd = 1.1; pTakeDamage(9); }
    } else if (e.type === 'bat') {
      e.t += dt;
      const tx = p.x + Math.cos(e.t * 1.4) * 70, ty = p.y - 40 + Math.sin(e.t * 1.4) * 26;
      const d = dist(e.x, e.y, tx, ty) || 1;
      e.x += (tx - e.x) / d * e.speed * dt * .8;
      e.y += (ty - e.y) / d * e.speed * dt * 1.1;
      if (dist(e.x, e.y, p.x, p.y - 20) < 22) { e.y -= 60; e.t += .5; pTakeDamage(6); }
    } else if (e.type === 'mage') {
      const d = dist(e.x, e.y, p.x, p.y) || 1;
      e.dir = (p.x - e.x) < 0 ? -1 : 1;
      if (d < 260) {
        const pos = moveWithCollision(e.x, e.y, -(p.x - e.x) / d * 70 * dt, -(p.y - e.y) / d * 55 * dt);
        e.x = pos.x; e.y = pos.y;
      } else if (d > 430) {
        const pos = moveWithCollision(e.x, e.y, (p.x - e.x) / d * 50 * dt, (p.y - e.y) / d * 50 * dt);
        e.x = pos.x; e.y = pos.y;
      }
      e.shootCd -= dt;
      if (e.shootCd <= 0) {
        e.shootCd = 2.7;
        shoot(e.x, e.y - 30, p.x, p.y - 20, 200, '#aa44ff', .55);
      }
    } else if (e.type === 'boss') {
      updateBoss(dt, e, p);
    }
  }
  world.enemies = world.enemies.filter(e => !e.dead);
}

function updateBoss(dt, e, p) {
  if (e.invuln && world.runes.every(r => r.dead)) {
    e.invuln = false;
    showMsg('⚔ O Necromante está vulnerável!');
    shake = 10;
  }
  e.dir = (p.x - e.x) < 0 ? -1 : 1;
  if (!e.invuln) {
    const d = dist(e.x, e.y, p.x, p.y) || 1;
    if (d > 150) {
      e.x += (p.x - e.x) / d * 60 * dt;
      e.y += (p.y - e.y) / d * 50 * dt;
    }
  }
  e.stateT -= dt;
  if (e.stateT > 0) return;
  if (e.invuln) {
    // runas atacam discretamente enquanto o selo protege o chefe
    if (Math.random() < .6) {
      const rs = world.runes.filter(r => !r.dead);
      if (rs.length) {
        const rr = rs[Math.floor(rand(0, rs.length))];
        shoot(rr.x, rr.y, p.x, p.y - 20, 190, '#ff6688', .5);
      }
    }
    e.stateT = 1.1;
    return;
  }
  if (e.state === 'idle' || e.state === 'summon') {
    e.state = 'orbs'; e.stateT = 2.2;
    showMsg('🔮 Esferas de energia!');
    const base = Math.atan2(p.y - 20 - e.y, p.x - e.x);
    for (let i = -2; i <= 2; i++) {
      const a = base + i * .21;
      shoot(e.x, e.y - 30, e.x + Math.cos(a) * 100, e.y - 30 + Math.sin(a) * 100, 230, '#66ff88', .8);
    }
  } else {
    e.state = 'summon'; e.stateT = 2.6;
    if (world.enemies.filter(x => !x.dead && x.type === 'goblin').length < 5) {
      showMsg('💀 O Necromante invoca lacaios!');
      for (let i = 0; i < 3; i++) {
        const a = rand(0, TAU);
        spawnGoblinAt(e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 70);
      }
    }
  }
}

function updateProjectiles(dt) {
  const p = world.player;
  world.projectiles = world.projectiles.filter(pr => {
    pr.life -= dt;
    if (pr.homing > 0 && !p.dead) {
      const d = dist(pr.x, pr.y, p.x, p.y - 20) || 1;
      pr.vx = lerp(pr.vx, (p.x - pr.x) / d * pr.speed, pr.homing * dt * 2.4);
      pr.vy = lerp(pr.vy, (p.y - 20 - pr.y) / d * pr.speed, pr.homing * dt * 2.4);
    }
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    for (const b of world.walls) {
      if (pr.x > b.x && pr.x < b.x + b.w && pr.y > b.y && pr.y < b.y + b.h) {
        pr.life = 0;
        if (world.fireOnExpire && b.shelf) spawnFire(pr.x, pr.y);
        spawnParticles(pr.x, pr.y, pr.color, 5, 80, 20);
        break;
      }
    }
    if (pr.life <= 0) return false;
    if (!p.dead && dist(pr.x, pr.y, p.x, p.y - 20) < 16) {
      pTakeDamage(11);
      spawnParticles(pr.x, pr.y, pr.color, 8, 100, 20);
      return false;
    }
    return true;
  });
}

function updatePickups(dt) {
  const p = world.player;
  world.pickups = world.pickups.filter(pk => {
    if (pk.type !== 'portal') pk.anim += dt;
    if (!p.dead && dist(pk.x, pk.y, p.x, p.y - 16) < (pk.type === 'portal' ? 40 : 24)) {
      if (pk.type === 'key') {
        world.keys++;
        spawnParticles(pk.x, pk.y, '#ffd76e', 16, 130);
        popText(pk.x, pk.y - 30, `Chave ${world.keys}/${world.keysNeeded}!`, '#ffe9a8');
        showMsg(`🗝 Chave ${world.keys}/${world.keysNeeded} encontrada!`);
        hud.keys.textContent = '🔑 '.repeat(world.keys) + '◆ '.repeat(Math.max(0, world.keysNeeded - world.keys));
        if (world.keys === world.keysNeeded) winLevel();
      } else winLevel();
      return false;
    }
    return true;
  });
}

// ============================================================
//  LOOP / UPDATE
// ============================================================
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, .05);
  last = now;
  time += dt;
  if (state === 'play' && world && !world.complete) stepUpdate(dt);
  render();
}
requestAnimationFrame(frame);

function stepUpdate(dt) {
  if (world.timeLeft > 0) {
    world.timeLeft -= dt;
    hud.timer.textContent = `⏳ Ritual: ${Math.ceil(world.timeLeft)}s`;
    if (world.timeLeft <= 0) { deathOf('O ritual do eclipse foi concluído… o reino afundou em escuridão.'); return; }
  }
  const p = world.player;
  updatePlayer(dt);
  if (p.dead) return;
  // vento (L4)
  if (world.platforms) {
    world.windT -= dt;
    if (world.windT <= 0) {
      world.windT = rand(3, 5.5);
      world.windActive = true;
      world.windDur = rand(1, 1.7);
      const ang = rand(0, TAU);
      world.windForce = { x: Math.cos(ang) * 95, y: Math.sin(ang) * 95 };
      showMsg('🌪 Rajada de vento!');
      world.windStreaks = Array.from({ length: 16 }, () => ({
        x: cam.x + rand(0, W), y: cam.y + rand(0, H),
        vx: Math.cos(ang) * 520, vy: Math.sin(ang) * 520,
      }));
    }
    if (world.windActive) {
      world.windDur -= dt;
      if (world.windStreaks)
        world.windStreaks.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; });
      if (world.windDur <= 0) world.windActive = false;
    }
  }
  if (world.update) world.update(dt);
  if (world.complete) return;
  updateEnemies(dt);
  updateProjectiles(dt);
  updatePickups(dt);
  if (world.boss && world.boss.dead) { winLevelOut(); return; }
  if (world.checkWin && world.checkWin()) { winLevel(); return; }
  // HUD
  hud.hp.style.width = clamp(p.hp / p.cfg.maxHp * 100, 0, 100) + '%';
  hud.stats.innerHTML = `HP: ${Math.max(0, Math.round(p.hp))} &nbsp;|&nbsp; Abates: ${world.kills}` +
    (world.killsNeeded ? ` / ${world.killsNeeded}` : '');
  hud.dash.style.width = (1 - clamp(p.dashCd / .9, 0, 1)) * 100 + '%';
  if (world.boss) {
    hud.boss.style.display = 'block';
    hud.bossHP.style.width = clamp(world.boss.hp / world.boss.maxHp * 100, 0, 100) + '%';
    hud.bossHP.style.opacity = world.boss.invuln ? .35 : 1;
    hud.bossHP.style.filter = world.boss.invuln ? 'grayscale(.7)' : 'none';
  } else hud.boss.style.display = 'none';
  // partículas
  particles = particles.filter(pt => {
    pt.life -= dt;
    pt.vy += pt.grav * dt;
    pt.x += pt.vx * dt; pt.y += pt.vy * dt;
    return pt.life > 0;
  });
  pops = pops.filter(pp => { pp.life -= dt; pp.y -= 34 * dt; return pp.life > 0; });
  shake = Math.max(0, shake - dt * 30);
  // câmera
  const horiz = world.w > W, vert = world.h > H;
  if (horiz) cam.x = lerp(cam.x, clamp(p.x - W / 2, 0, world.w - W), 1 - Math.pow(.0001, dt));
  if (vert) cam.y = lerp(cam.y, clamp(p.y - H / 2, 0, world.h - H), 1 - Math.pow(.0001, dt));
}

// ============================================================
//  FIM DE NÍVEL / JOGO
// ============================================================
const LEVEL_NAMES = ['Os Pátios da Torre', 'As Catacumbas Esquecidas', 'A Grande Biblioteca',
                     'Os Jardins Suspensos', 'O Altar do Eclipse'];

function winLevel() {
  if (!world || world.complete) return;
  world.complete = true;
  if (world.idx === 4) {
    showGameEnd(true, 'O Necromante tombou. O eclipse se desfaz e o reino respira novamente. A torre foi redimida!');
  } else {
    state = 'inter';
    document.getElementById('interTitle').textContent = `Andar ${world.idx + 1} concluído! 🏰`;
    document.getElementById('interText').textContent =
      `O herói sobe a escadaria espiral da torre. O próximo andar guarda novos horrores… (Abates: ${world.kills})`;
    document.getElementById('interScreen').classList.remove('hidden');
    document.getElementById('interBtn').onclick = () => {
      document.getElementById('interScreen').classList.add('hidden');
      startLevel(world.idx + 1);
    };
  }
}
// morte do chefe termina o jogo mesmo sem checkWin
function winLevelOut() { winLevel(); }

function deathOf(text) {
  if (state !== 'play') return;
  showGameEnd(false, text);
}

function showGameEnd(win, text) {
  state = 'over';
  const t = document.getElementById('endTitle');
  t.textContent = win ? '🏆 Reino Salvo!' : '💀 Fim da Jornada';
  t.classList.toggle('win', win);
  document.getElementById('endText').textContent = `${text} (Abates: ${world.kills})`;
  document.getElementById('endScreen').classList.remove('hidden');
  document.getElementById('endBtn').onclick = () => {
    document.getElementById('endScreen').classList.remove('hidden');
    document.getElementById('endScreen').classList.add('hidden');
    hud.keys.style.display = 'none';
    hud.timer.textContent = '';
    startLevel(win ? 0 : world.idx);
  };
}

// ============================================================
//  RENDER
// ============================================================
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!world || state === 'menu') { drawMenuBg(); return; }
  const sx = rand(-shake, shake), sy = rand(-shake, shake);
  ctx.save();
  ctx.translate(sx - cam.x, sy - cam.y);

  world.bg();

  for (const b of world.walls) if (inViewRaw(b.x + b.w / 2, b.y + b.h / 2, 240)) drawWall(b);

  if (world.platforms) for (const b of world.platforms) drawPlatform(b);

  // perigos
  for (const hz of world.hazards) {
    if (!inViewRaw(hz.x, hz.y)) continue;
    if (hz.type === 'spike') drawSpike(hz);
    else if (hz.type === 'fire') drawFire(hz);
    else if (hz.type === 'poison') drawPoison(hz);
  }

  // chaves / portal / runas
  for (const pk of world.pickups) {
    if (!inViewRaw(pk.x, pk.y, 200)) continue;
    if (pk.type === 'key') drawKey(pk); else drawPortal(pk.x, pk.y, time);
  }
  for (const r of world.runes) {
    if (r.dead || !inViewRaw(r.x, r.y, 200)) continue;
    drawRune(r);
  }

  // tochas do cenário (L2)
  if (world.torches) for (const [tx, ty] of world.torches) {
    if (inViewRaw(tx, ty)) {
      ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(tx, ty + 14); ctx.lineTo(tx, ty - 12); ctx.stroke();
    }
  }

  // inimigos
  for (const e of world.enemies) {
    if (!inViewRaw(e.x, e.y)) continue;
    ctx.save();
    if (e.flash > 0) ctx.filter = 'brightness(1.9)';
    if (e.type === 'goblin') drawGoblin(e);
    else if (e.type === 'bat') drawBat(e);
    else if (e.type === 'mage') drawMage(e);
    else if (e.type === 'boss') drawNecromancer(e);
    ctx.restore();
    const mhp = { goblin: 3, bat: 2, mage: 5 }[e.type];
    if (mhp && e.hp < mhp) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(e.x - 13, e.y - (e.type === 'goblin' ? 40 : 34), 26, 3.4);
      ctx.fillStyle = '#6be36b';
      ctx.fillRect(e.x - 13, e.y - (e.type === 'goblin' ? 40 : 34), 26 * clamp(e.hp / mhp, 0, 1), 3.4);
    }
  }

  // partículas
  for (const pt of particles) {
    ctx.globalAlpha = clamp(pt.life * 1.6, 0, 1);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // herói
  const p = world.player;
  p.ghost.forEach(g => {
    ctx.globalAlpha = g.t * .35;
    drawHero(g.x, g.y, 0, g.dir, p.cfg, 0, false);
    ctx.globalAlpha = 1;
  });
  ctx.save();
  if (p.invuln > 0 && !p.dead) ctx.globalAlpha = .55 + Math.sin(time * 30) * .25;
  const yr = p.fall > 0 ? p.y + p.fall * .65 : p.y;
  if (p.fall > 0) {
    const s = Math.max(.35, 1 - p.fall / 90);
    ctx.translate(p.x, yr); ctx.scale(s, s);
    ctx.translate(-p.x, -yr - 60 * (1 - s));
  }
  drawHero(p.x, yr, p.anim, p.dir, p.cfg, Math.max(0, p.slashT), p.moving);
  ctx.restore();
  if (p.dead) {
    shadowBlob(p.x, p.y + 6, 10);
    ctx.fillStyle = 'rgba(205,205,215,.92)';
    ctx.beginPath();
    ctx.moveTo(p.x - 10, p.y + 6); ctx.lineTo(p.x - 10, p.y - 12);
    ctx.arc(p.x, p.y - 12, 10, Math.PI, 0);
    ctx.lineTo(p.x + 10, p.y + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.font = 'bold 9px Trebuchet MS'; ctx.textAlign = 'center';
    ctx.fillText('†', p.x, p.y - 12);
  }

  // projéteis
  for (const pr of world.projectiles) {
    if (!inViewRaw(pr.x, pr.y)) continue;
    const glow = ctx.createRadialGradient(pr.x, pr.y, 1, pr.x, pr.y, 11);
    glow.addColorStop(0, '#fff'); glow.addColorStop(.45, pr.color); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(pr.x, pr.y, 11, 0, TAU); ctx.fill();
  }

  // chuva (L1)
  if (world.rainDrops) {
    ctx.strokeStyle = 'rgba(150,180,240,.4)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const d of world.rainDrops) {
      if (!inViewRaw(d.x, d.y, 0)) continue;
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 3, d.y + 12);
    }
    ctx.stroke();
  }

  // linhas de vento (L4)
  if (world.windActive && world.windStreaks) {
    ctx.strokeStyle = 'rgba(160,210,240,.35)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const s of world.windStreaks) {
      ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * .05, s.y - s.vy * .05);
    }
    ctx.stroke();
  }

  // textos flutuantes
  ctx.textAlign = 'center';
  for (const pp of pops) {
    ctx.globalAlpha = clamp(pp.life * 1.4, 0, 1);
    ctx.font = `bold ${pp.size}px 'Trebuchet MS'`;
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillText(pp.text, pp.x + 1, pp.y + 2);
    ctx.fillStyle = pp.color;
    ctx.fillText(pp.text, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // escuridão (L2)
  if (world.idx === 1) {
    ctx.fillStyle = 'rgba(3,2,8,.62)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    punchHole(p.x - cam.x, p.y - 18 - cam.y, 310);
    // halo extra de luz ambiente ao redor do herói
    punchHole(p.x - cam.x, p.y - 18 - cam.y, 480);
    for (const [tx, ty] of world.torches)
      punchHole(tx - cam.x, ty - cam.y, 165 + Math.sin(time * 5 + tx) * 12);
    ctx.restore();
    // chamas visíveis da tocha (por cima da escuridão)
    for (const [tx, ty] of world.torches) drawTorchFlame(tx - cam.x, ty - cam.y);
    // brilho do herói (por cima da escuridão)
    drawPlayerGlow(p.x - cam.x, p.y - 18 - cam.y);
  }

  // vinheta
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * .85);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function drawMenuBg() {
  // brilhos suaves ao fundo da tela inicial
  ctx.fillStyle = '#05060c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    const sx = (i * 997 + time * 8) % W, sy = (i * 613 + time * 3) % H;
    ctx.globalAlpha = .06 + Math.sin(time + i) * .04;
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(((i * 997 + time * 14) % W), sy, 2 + (i % 3), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function punchHole(x, y, r) {
  const g = ctx.createRadialGradient(x, y, 8, x, y, r);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(.7, 'rgba(0,0,0,.7)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

function drawTorchFlame(x, y) {
  const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
  g.addColorStop(0, 'rgba(255,190,80,.55)');
  g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,170,60,.9)';
  ctx.beginPath();
  ctx.ellipse(x, y, 3.4, 8 + Math.sin(time * 8 + x) * 1.6, Math.sin(time * 6 + y) * .2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,235,160,.7)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 1.7, 4.6, 0, 0, TAU);
  ctx.fill();
}

// brilho de lanterna ao redor do herói (Fase 2)
function drawPlayerGlow(px, py) {
  const g = ctx.createRadialGradient(px, py, 6, px, py, 120);
  g.addColorStop(0, 'rgba(255,210,120,.42)');
  g.addColorStop(.5, 'rgba(255,180,80,.12)');
  g.addColorStop(1, 'rgba(255,150,50,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(px, py, 120, 0, TAU); ctx.fill();
  // brilho central mais intenso
  const g2 = ctx.createRadialGradient(px, py, 2, px, py, 40);
  g2.addColorStop(0, 'rgba(255,240,200,.35)');
  g2.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.arc(px, py, 40, 0, TAU); ctx.fill();
}

function drawWall(b) {
  if (b.house) {
    ctx.fillStyle = '#4f4234';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#3a3026';
    ctx.beginPath();
    ctx.moveTo(b.x - 8, b.y); ctx.lineTo(b.x + b.w / 2, b.y - b.h * .33);
    ctx.lineTo(b.x + b.w + 8, b.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#101420';
    ctx.fillRect(b.x + b.w * .3, b.y + b.h * .3, b.w * .2, b.h * .28);
  } else if (b.shelf) {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    const cols = ['#aa2222', '#2266aa', '#228822', '#ccaa22', '#8866cc'];
    let ci = 0;
    for (let y = b.y + 8; y < b.y + b.h - 22; y += 27) {
      for (let x = b.x + 4; x < b.x + b.w - 8; x += 7) {
        ctx.fillStyle = cols[ci++ % cols.length];
        ctx.fillRect(x, y, 5.6, 20);
      }
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.fillRect(b.x, y + 21, b.w, 4);
    }
  } else {
    const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    g.addColorStop(0, '#4a4038'); g.addColorStop(1, '#332c26');
    ctx.fillStyle = g;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1;
    for (let y = b.y; y < b.y + b.h; y += 18) {
      ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke();
      const off = ((y - b.y) / 18 % 2) * 14;
      for (let x = b.x + off; x < b.x + b.w; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, Math.min(y + 18, b.y + b.h)); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(b.x, b.y, b.w, 5);
  }
}

function drawPlatform(b) {
  if (b.bridge) {
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(60,50,30,.55)'; ctx.lineWidth = 2;
    for (let x = b.x; x < b.x + b.w; x += 22) {
      ctx.beginPath(); ctx.moveTo(x, b.y); ctx.lineTo(x, b.y + b.h); ctx.stroke();
    }
    for (let y = b.y; y < b.y + b.h; y += 22) {
      ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(120,100,60,.9)'; ctx.lineWidth = 3;
    if (b.w > b.h) {
      ctx.beginPath(); ctx.moveTo(b.x, b.y + 4); ctx.lineTo(b.x + b.w, b.y + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h - 4); ctx.lineTo(b.x + b.w, b.y + b.h - 4); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(b.x + 4, b.y); ctx.lineTo(b.x + 4, b.y + b.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x + b.w - 4, b.y); ctx.lineTo(b.x + b.w - 4, b.y + b.h); ctx.stroke();
    }
  } else {
    const g = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, 10, b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) * .6);
    g.addColorStop(0, '#6a8a5a'); g.addColorStop(.75, '#4d6a44'); g.addColorStop(1, '#2e4430');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(18,40,24,.65)'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#3f6b3a';
    for (let i = 0; i < 5; i++) {
      const bx = b.x + 26 + ((i * 173) % Math.max(1, b.w - 52));
      const by = b.y + 26 + ((i * 331) % Math.max(1, b.h - 52));
      ctx.beginPath(); ctx.arc(bx, by, 9 + (i % 3) * 3, 0, TAU); ctx.fill();
    }
  }
}

function drawSpike(hz) {
  const up = (hz.t % 2.4) > 1.2;
  const yOff = up ? 0 : 18;
  ctx.save();
  ctx.globalAlpha = .5;
  ctx.fillStyle = '#1d1d1f';
  ctx.fillRect(hz.x - 26, hz.y - 12, 52, 24);
  ctx.globalAlpha = up ? 1 : .45;
  ctx.fillStyle = up ? '#cfd6de' : '#6a7076';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(hz.x + i * 13 - 5, hz.y + 8);
    ctx.lineTo(hz.x + i * 13, hz.y - 18 + yOff);
    ctx.lineTo(hz.x + i * 13 + 5, hz.y + 8);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawFire(hz) {
  const a = clamp(hz.life / 2, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  const flick = Math.sin(time * 12 + hz.x) * .3 + 1;
  const g = ctx.createRadialGradient(hz.x, hz.y - 6, 4, hz.x, hz.y - 6, 48);
  g.addColorStop(0, `rgba(255,170,60,${.55 * a})`);
  g.addColorStop(.6, `rgba(255,90,30,${.3 * a})`);
  g.addColorStop(1, 'rgba(255,60,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(hz.x, hz.y - 6, 48 * flick, 0, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const fx = hz.x + Math.cos(i * 1.9 + hz.t) * 15;
    const fh = 15 + Math.sin(time * 9 + i) * 5;
    ctx.fillStyle = i % 2 ? '#ff7722' : '#ffb03a';
    ctx.beginPath();
    ctx.moveTo(fx - 6, hz.y + 6);
    ctx.quadraticCurveTo(fx, hz.y - fh - 6, fx + 6, hz.y + 6);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawPoison(hz) {
  const { x, y } = hz; const t = hz.t;
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 3, x, y, hz.r * 1.3);
  glow.addColorStop(0, 'rgba(120,255,80,.3)'); glow.addColorStop(1, 'rgba(120,255,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, hz.r * 1.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#88ff44'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + Math.sin(t) * .4;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
    ctx.quadraticCurveTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16 - 4,
                         x + Math.cos(a) * 22, y + Math.sin(a) * 16);
    ctx.stroke();
  }
  ctx.fillStyle = '#aaff66';
  ctx.beginPath(); ctx.arc(x, y - 4, 5 + Math.sin(t * 3), 0, TAU); ctx.fill();
  ctx.restore();
}

// ============================================================
//  TELA INICIAL — seleção de personagem (previews animados)
// ============================================================
document.querySelectorAll('.charCard').forEach(card => {
  const c = card.querySelector('canvas');
  const cc = c.getContext('2d');
  const cfg = CHARS[card.dataset.char];
  (function preview() {
    cc.clearRect(0, 0, 120, 140);
    const saved = ctx;
    ctx = cc;
    drawHero(60, 96, time, 1, cfg, 0, true);
    ctx = saved;
    requestAnimationFrame(preview);
  })();
  card.onclick = () => {
    document.querySelectorAll('.charCard').forEach(x => x.classList.remove('sel'));
    card.classList.add('sel');
    charSel = card.dataset.char;
  };
});

function startLevel(i) {
  newWorld(i);
  hud.title.textContent = `RuneBound — Andar ${i + 1}: ${LEVEL_NAMES[i]}`;
  hud.hp.style.width = '100%';
  hud.keys.style.display = i === 1 ? 'block' : 'none';
  hud.keys.textContent = '';
  hud.timer.textContent = i === 4 ? '⏳ Ritual: 180s' : '';
  hud.obj.textContent = world.objective;
  state = 'play';
  shake = 0;
  particles = []; pops = [];
}

document.getElementById('startBtn').onclick = () => {
  document.getElementById('startScreen').classList.add('hidden');
  startLevel(0);
};

// gancho de depuração (também útil para testes automatizados)
window.__game = {
  get world() { return world; },
  get state() { return state; },
  startLevel, stepUpdate, CHARS,
  doSlashHit, updateEnemies, updateProjectiles, updatePickups, pTakeDamage,
};
