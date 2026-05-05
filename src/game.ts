import { normalizeRomaji } from './romaji';
import { playBgm, stopBgm, playSfx, preloadAssets, setBgmVolume } from './audio';

// Core with input modes: direct typing and question->answer (QA).

type Enemy = { id: number; x: number; y: number; speed: number; word: string; answer?: string; destroyed?: boolean; destroyedAt?: number; normWord?: string; normAnswer?: string };

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
let ctx: CanvasRenderingContext2D | null = null;
const cw = 900, ch = 600;
let enemies: Enemy[] = [];
let score = 0, lives = 5;
let currentInput = '';
let combo = 0;
let multiplier = 1;
let nextId = 1;
let spawnInterval = 1600; // ms
let lastSpawn = 0;
let mode: 'direct'|'qa' = 'direct';
let WORDS: string[] = ['edo','meiji','tokyo','osaka','sapporo','chiri','rekishi','kokkai','kokka','sensu'];
let QNA: {question:string, answer:string}[] = [];

let started = false;
let sfxVolume = 0.7;
let difficulty: 'easy'|'normal'|'hard' = 'normal';
const ASSET_BGM = '/assets/bgm-loop.mp3';
const ASSET_SFX_HIT = '/assets/sfx-hit.mp3';

function applyDifficulty(){
  if(difficulty === 'easy') spawnInterval = 2000;
  else if(difficulty === 'normal') spawnInterval = 1400;
  else spawnInterval = 900;
}

async function loadWordset(){
  try{
    const res = await fetch('/src/wordsets/junior_high_social_studies.json');
    if(res.ok){
      const arr = await res.json();
      if(Array.isArray(arr) && arr.length) WORDS = arr;
    }
    const res2 = await fetch('/src/wordsets/junior_high_social_studies_qna.json');
    if(res2.ok){
      const arr2 = await res2.json();
      if(Array.isArray(arr2) && arr2.length) QNA = arr2;
    }
  }catch(e){
    // ignore - fallback to defaults
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.style.margin = '0';
  document.body.appendChild(canvas);
  canvas.width = cw; canvas.height = ch;
  ctx = canvas.getContext('2d');

  // create UI overlays
  try{ createUI(); }catch(e){}

  // preload common assets (non-blocking)
  preloadAssets([ASSET_BGM, ASSET_SFX_HIT]).catch(()=>{});

  // show start screen until user interacts
  draw();

  window.addEventListener('keydown', onKey);
  window.addEventListener('click', () => { if(!started) startGame(); });
  window.addEventListener('touchstart', () => { if(!started) startGame(); }, {passive:true});
});

function startGame(){
  if(started) return;
  started = true;
  // user gesture happened, start BGM if available
  playBgm(ASSET_BGM).catch(()=>{});

  loadWordset();
  lastTs = performance.now();
  requestAnimationFrame(loop);
}

function spawnEnemy(){
  if(mode === 'direct' || QNA.length === 0){
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const normWord = normalizeRomaji(word);
    enemies.push({ id: nextId++, x: Math.random() * (cw - 60) + 30, y: -40, speed: 0.03 + Math.random() * 0.09, word, normWord });
  } else {
    const qa = QNA[Math.floor(Math.random() * QNA.length)];
    const q = qa.question, a = qa.answer;
    const normQ = normalizeRomaji(q);
    const normA = normalizeRomaji(a);
    enemies.push({ id: nextId++, x: Math.random() * (cw - 60) + 30, y: -40, speed: 0.03 + Math.random() * 0.09, word: q, answer: a, normWord: normQ, normAnswer: normA });
  }
}

let lastTs = performance.now();
function loop(ts?: number){
  const now = ts ?? performance.now();
  const dt = now - lastTs;
  lastTs = now;

  // spawn logic
  lastSpawn += dt;
  if(lastSpawn >= spawnInterval){
    spawnEnemy();
    lastSpawn = 0;
    // gradually increase difficulty
    spawnInterval = Math.max(500, spawnInterval * 0.995);
  }

  update(dt);
  draw();
  if(started) requestAnimationFrame(loop);
}

function update(dt:number){
  const now = performance.now();
  enemies.forEach(e => {
    if(e.destroyed){
      // simple float-away effect
      if(e.destroyedAt){
        e.y -= 0.05 * dt;
      }
      return;
    }
    e.y += e.speed * dt;
    if(e.y > ch - 40){
      // enemy reached bottom
      e.destroyed = true;
      e.destroyedAt = now;
      combo = 0;
      multiplier = 1;
      lives -= 1;
      // play sfx for miss
      try{ playSfx(ASSET_SFX_HIT, 0.5); }catch(e){}
    }
  });
  // remove destroyed and offscreen
  enemies = enemies.filter(e => !(e.destroyed && e.y < -200));
}

function draw(){
  if(!ctx) return;
  const c = ctx;
  // background
  c.fillStyle = '#0b1020';
  c.fillRect(0,0,cw,ch);

  if(!started){
    // start screen
    c.fillStyle = '#fff';
    c.font = '36px sans-serif';
    c.fillText('迫り来るラーメン: タイピングゲーム', cw/2 - 300, ch/2 - 20);
    c.font = '18px sans-serif';
    c.fillText('Press any key or click/tap to start', cw/2 - 160, ch/2 + 20);
    return;
  }

  // HUD
  c.fillStyle = '#fff';
  c.font = '18px sans-serif';
  c.fillText(`Score: ${score}`, 16, 28);
  c.fillText(`Lives: ${lives}`, 140, 28);
  c.fillText(`Combo: ${combo} x${multiplier}`, 260, 28);
  c.fillText(`Mode: ${mode === 'direct' ? '直接打ち' : '問題→解答'}`, 420, 28);
  c.fillText(`Input: ${currentInput}`, 16, ch - 12);

  enemies.forEach(e => {
    // draw ramen emoji
    c.font = '40px serif';
    c.fillText('🍜', e.x, e.y);
    // draw word/question above
    c.font = '18px monospace';
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.fillText(e.word, e.x - 20, e.y - 30);
    if(e.answer){
      c.font = '12px monospace';
      c.fillStyle = 'rgba(200,200,200,0.8)';
      c.fillText('(answer)', e.x + 30, e.y - 15);
    }
    c.fillStyle = '#fff';
  });

  if(lives <= 0){
    c.fillStyle = 'rgba(0,0,0,0.6)';
    c.fillRect(0,0,cw,ch);
    c.fillStyle = '#fff';
    c.font = '48px sans-serif';
    c.fillText('Game Over', cw/2 - 120, ch/2);
    c.font = '20px sans-serif';
    c.fillText(`Final Score: ${score}`, cw/2 - 70, ch/2 + 40);

    // stop bgm on game over
    try{ stopBgm(); }catch(e){}
  }
}

function createUI(){
  const container = document.createElement('div');
  container.id = 'game-ui';
  container.style.position = 'fixed';
  container.style.right = '12px';
  container.style.top = '12px';
  container.style.background = 'rgba(10,12,20,0.6)';
  container.style.color = '#fff';
  container.style.padding = '8px';
  container.style.borderRadius = '8px';
  container.style.zIndex = '1000';
  container.style.fontFamily = 'sans-serif';
  container.style.fontSize = '13px';

  // BGM volume
  const bgmLabel = document.createElement('div');
  bgmLabel.textContent = 'BGM Volume';
  const bgmRange = document.createElement('input');
  bgmRange.type = 'range'; bgmRange.min = '0'; bgmRange.max = '1'; bgmRange.step = '0.01'; bgmRange.value = '0.2';
  bgmRange.addEventListener('input', () => { setBgmVolume(parseFloat(bgmRange.value)); });
  container.appendChild(bgmLabel);
  container.appendChild(bgmRange);

  // SFX volume
  const sfxLabel = document.createElement('div');
  sfxLabel.textContent = 'SFX Volume';
  const sfxRange = document.createElement('input');
  sfxRange.type = 'range'; sfxRange.min = '0'; sfxRange.max = '1'; sfxRange.step = '0.01'; sfxRange.value = String(sfxVolume);
  sfxRange.addEventListener('input', () => { sfxVolume = parseFloat(sfxRange.value); });
  container.appendChild(sfxLabel);
  container.appendChild(sfxRange);

  // Difficulty
  const diffLabel = document.createElement('div');
  diffLabel.textContent = 'Difficulty';
  const diffSelect = document.createElement('select');
  ['easy','normal','hard'].forEach(d => { const o = document.createElement('option'); o.value = d; o.text = d; diffSelect.appendChild(o); });
  diffSelect.value = difficulty;
  diffSelect.addEventListener('change', () => { difficulty = diffSelect.value as any; applyDifficulty(); });
  container.appendChild(diffLabel);
  container.appendChild(diffSelect);

  // Retry button
  const retryBtn = document.createElement('button');
  retryBtn.textContent = 'Retry';
  retryBtn.style.display = 'block';
  retryBtn.style.marginTop = '8px';
  retryBtn.addEventListener('click', () => { resetGame(); startGame(); });
  container.appendChild(retryBtn);

  document.body.appendChild(container);
}

function resetGame(){
  try{ stopBgm(); }catch(e){}
  started = false;
  enemies = [];
  score = 0;
  lives = 5;
  combo = 0;
  multiplier = 1;
  currentInput = '';
  lastSpawn = 0;
  nextId = 1;
  applyDifficulty();
  draw();
}

function onKey(ev: KeyboardEvent){
  const k = ev.key;
  if(!started){
    // start on first key
    startGame();
  }
  if(k === 'Tab'){
    ev.preventDefault();
    mode = mode === 'direct' ? 'qa' : 'direct';
    currentInput = '';
    return;
  }
  if(k === 'Backspace'){
    currentInput = currentInput.slice(0, -1);
    return;
  }
  if(k === 'Escape'){
    currentInput = '';
    return;
  }
  if(k.length === 1 && /^[a-zA-Z0-9' ]$/.test(k)){
    currentInput += k.toLowerCase();
    checkInput();
  }
}

function checkInput(){
  const norm = normalizeRomaji(currentInput.trim());
  // prioritize enemies with answers if in qa mode
  const candidates = enemies.filter(e => {
    if(e.destroyed) return false;
    if(e.answer) return (e.normAnswer ?? normalizeRomaji(e.answer)).startsWith(norm);
    return (e.normWord ?? normalizeRomaji(e.word)).startsWith(norm);
  });
  if(candidates.length > 0){
    candidates.sort((a,b) => b.y - a.y);
    const e = candidates[0];
    if(e.answer){
      const target = e.normAnswer ?? normalizeRomaji(e.answer);
      if(target === norm){
        e.destroyed = true;
        e.destroyedAt = performance.now();
        combo += 1;
        multiplier = Math.min(5, 1 + Math.floor(combo / 5));
        score += 150 * multiplier;
        currentInput = '';
        try{ playSfx(ASSET_SFX_HIT, 0.7); }catch(e){}
        return;
      }
      return;
    } else {
      const target = e.normWord ?? normalizeRomaji(e.word);
      if(target === norm){
        e.destroyed = true;
        e.destroyedAt = performance.now();
        combo += 1;
        multiplier = Math.min(5, 1 + Math.floor(combo / 5));
        score += 100 * multiplier;
        currentInput = '';
        try{ playSfx(ASSET_SFX_HIT, 0.7); }catch(e){}
        return;
      }
      return;
    }
  }
}

export {};
