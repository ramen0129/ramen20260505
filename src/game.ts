import { normalizeRomaji } from './romaji';

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
  loadWordset();
  requestAnimationFrame(loop);
  window.addEventListener('keydown', onKey);
});

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
  requestAnimationFrame(loop);
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
  }
}

function onKey(ev: KeyboardEvent){
  const k = ev.key;
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
        return;
      }
      return;
    }
  }
}

export {};
