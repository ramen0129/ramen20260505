import * as wanakana from 'wanakana';

export default class InputHandler {
  constructor(scene, {romajiMode=true}={}){
    this.scene = scene;
    this.romajiMode = romajiMode;
    this.buffer = '';
    this.isComposing = false;

    // invisible input to capture IME on desktop/mobile
    this.inputEl = document.createElement('input');
    this.inputEl.style.position='absolute';
    this.inputEl.style.opacity='0';
    this.inputEl.style.pointerEvents='none';
    this.inputEl.autocapitalize='off';
    this.inputEl.autocomplete='off';
    this.inputEl.spellcheck=false;
    document.body.appendChild(this.inputEl);

    this.inputEl.addEventListener('compositionstart', ()=>{ this.isComposing=true; });
    this.inputEl.addEventListener('compositionend', (e)=>{ this.isComposing=false; this.buffer += e.data; this.scene.events.emit('input:update', this.buffer); });

    this.inputEl.addEventListener('input', (e)=>{
      if(this.isComposing) return; // handled by compositionend
      const v = e.target.value;
      // for convenience, keep last char
      this.buffer = v;
      this.scene.events.emit('input:update', this.buffer);
    });

    // capture keydown for backspace etc.
    window.addEventListener('keydown', (e)=>{
      if(e.key === 'Backspace'){
        this.buffer = this.buffer.slice(0,-1);
        this.scene.events.emit('input:update', this.buffer);
      } else if(e.key.length===1 && !e.ctrlKey && !e.metaKey){
        // let inputEl handle visible input; focus it
        if(document.activeElement !== this.inputEl) this.inputEl.focus();
      }
    });

    // focus input on scene click
    scene.input.on('pointerdown', ()=>{ this.inputEl.focus(); });
  }

  clear(){ this.buffer=''; this.inputEl.value=''; this.scene.events.emit('input:update', this.buffer); }

  normalizeForCompare(s){
    if(!s) return '';
    // convert full-width to halfwidth, trim
    let t = s.normalize('NFKC');
    if(this.romajiMode){
      // convert romaji to hiragana then normalize
      t = wanakana.toHiragana(t);
    } else {
      t = wanakana.toHiragana(t); // ensure kana form for consistent compare
    }
    // remove punctuation and whitespace
    t = t.replace(/[\u3000\s\p{P}\p{S}]+/gu,'');
    return t;
  }

  matches(target){
    const inp = this.normalizeForCompare(this.buffer);
    const tgt = this.normalizeForCompare(target);
    return inp === tgt;
  }
}
