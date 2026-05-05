// Audio manager: preloading, BGM control and SFX playback
// Assets are expected under public/assets (e.g. /assets/bgm-loop.mp3)

let bgmAudio: HTMLAudioElement | null = null;
let bgmPath: string | null = null;

export function playSfx(path: string, volume = 0.6){
  try{
    const a = new Audio(path);
    a.volume = Math.max(0, Math.min(1, volume));
    // play and allow promise rejection to be ignored (mobile autoplay restrictions)
    a.play().catch(()=>{});
  }catch(e){/* ignore */}
}

export async function playBgm(path: string, volume = 0.2): Promise<HTMLAudioElement | null>{
  try{
    // if same track already playing, just adjust volume/play
    if(bgmAudio && bgmPath === path){
      bgmAudio.volume = Math.max(0, Math.min(1, volume));
      bgmAudio.play().catch(()=>{});
      return bgmAudio;
    }
    // stop previous
    if(bgmAudio){
      try{ bgmAudio.pause(); bgmAudio.currentTime = 0; }catch(e){}
      bgmAudio = null; bgmPath = null;
    }

    const a = new Audio(path);
    a.loop = true;
    a.volume = Math.max(0, Math.min(1, volume));
    // attempt to play; ignore if blocked
    a.play().catch(()=>{});
    bgmAudio = a; bgmPath = path;
    return bgmAudio;
  }catch(e){
    return null;
  }
}

export function stopBgm(){
  if(bgmAudio){
    try{ bgmAudio.pause(); bgmAudio.currentTime = 0; }catch(e){}
    bgmAudio = null; bgmPath = null;
  }
}

export function setBgmVolume(v: number){
  if(bgmAudio){
    bgmAudio.volume = Math.max(0, Math.min(1, v));
  }
}

export function preloadAudio(path: string): Promise<void>{
  return new Promise((resolve) => {
    try{
      const a = new Audio(path);
      const onDone = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); resolve(); };
      function cleanup(){
        a.removeEventListener('canplaythrough', onDone);
        a.removeEventListener('error', onErr);
      }
      a.addEventListener('canplaythrough', onDone);
      a.addEventListener('error', onErr);
      // start loading
      a.load();
      // safety timeout
      setTimeout(() => { cleanup(); resolve(); }, 3000);
    }catch(e){ resolve(); }
  });
}

export async function preloadAssets(paths: string[]){
  await Promise.all(paths.map(p => preloadAudio(p)));
}
