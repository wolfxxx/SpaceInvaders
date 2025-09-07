// Modern Space Invaders — rebuilt compact version (gameplay restored)
// Notes: One-file game logic to keep changes traceable. No external assets.

// ---------- Enhanced SFX + Music ----------
const Sfx = (() => {
  let ac, musicGain, muted = false;
  function ctx(){ ac = ac || new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended') ac.resume(); return ac; }
  
  // Enhanced beep with better envelope
  function beep(f=800, d=0.08, type='square', g=0.03){ 
    if(muted) return; 
    try{ 
      const a=ctx(), o=a.createOscillator(), t=a.createGain(); 
      o.type=type; o.frequency.value=f; 
      const t0=a.currentTime; 
      t.gain.setValueAtTime(0, t0); 
      t.gain.linearRampToValueAtTime(g, t0 + 0.01); // Quick attack
      t.gain.exponentialRampToValueAtTime(0.0001, t0+d); 
      o.connect(t).connect(a.destination); 
      o.start(t0); o.stop(t0+d); 
    }catch(e){} 
  }
  
  // Enhanced alien explosion with more satisfying layers and variety
  function explosion(variation = 0){ 
    if(muted) return; 
    try{ 
      const a = ctx();
      const t0 = a.currentTime;
      
      // Enhanced randomization for more variety
      const sizeVar = 1 + (Math.random() - 0.5) * 0.4;
      const pitchVar = 1 + (Math.random() - 0.5) * 0.3;
      const delayVar = Math.random() * 0.02; // Slight timing variation
      
      // Alien type variations (0=default, 1=alien1, 2=alien2, 3=alien3)
      const typeMultiplier = variation === 1 ? 1.1 : variation === 2 ? 0.9 : variation === 3 ? 1.2 : 1.0;
      const typePitch = variation === 1 ? 1.1 : variation === 2 ? 0.8 : variation === 3 ? 1.3 : 1.0;
      
      // Layer 1: More explosive low rumble with deeper bass
      const rumble = a.createOscillator();
      const rumbleGain = a.createGain();
      const rumbleFilter = a.createBiquadFilter();
      rumble.type = 'sawtooth';
      rumble.frequency.setValueAtTime(35 * pitchVar * typePitch, t0);
      rumble.frequency.exponentialRampToValueAtTime(12 * pitchVar * typePitch, t0 + 0.6 * sizeVar * typeMultiplier);
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(100 * typePitch, t0);
      rumbleFilter.Q.value = 2;
      rumbleGain.gain.setValueAtTime(0, t0);
      rumbleGain.gain.linearRampToValueAtTime(0.18 * sizeVar * typeMultiplier, t0 + 0.01); // Reduced volume
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6 * sizeVar * typeMultiplier);
      rumble.connect(rumbleFilter).connect(rumbleGain).connect(a.destination);
      rumble.start(t0); rumble.stop(t0 + 0.6 * sizeVar * typeMultiplier);
      
      // Layer 2: More explosive mid-range crack with sharper attack
      const crack = a.createOscillator();
      const crackGain = a.createGain();
      const crackFilter = a.createBiquadFilter();
      crack.type = 'square';
      crack.frequency.setValueAtTime(250 * pitchVar * typePitch, t0);
      crack.frequency.exponentialRampToValueAtTime(60 * pitchVar * typePitch, t0 + 0.2 * typeMultiplier);
      crackFilter.type = 'bandpass';
      crackFilter.frequency.setValueAtTime(400 * typePitch, t0);
      crackFilter.Q.value = 3;
      crackGain.gain.setValueAtTime(0, t0);
      crackGain.gain.linearRampToValueAtTime(0.15 * typeMultiplier, t0 + 0.005); // Reduced volume
      crackGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2 * typeMultiplier);
      crack.connect(crackFilter).connect(crackGain).connect(a.destination);
      crack.start(t0 + delayVar); crack.stop(t0 + 0.2 * typeMultiplier + delayVar);
      
      // Layer 3: More explosive high-frequency sizzle with sharper attack
      const sizzle = a.createBufferSource();
      const sizzleLen = a.sampleRate * 0.35 | 0;
      const sizzleBuf = a.createBuffer(1, sizzleLen, a.sampleRate);
      const sizzleData = sizzleBuf.getChannelData(0);
      for(let i = 0; i < sizzleLen; i++) {
        const progress = i / sizzleLen;
        const noise = (Math.random() * 2 - 1);
        const envelope = Math.pow(1 - progress, 0.8); // Less gradual decay for more impact
        sizzleData[i] = noise * envelope * (1.0 + 0.6 * Math.sin(progress * Math.PI * 12)); // More intense modulation
      }
      sizzle.buffer = sizzleBuf;
      const sizzleGain = a.createGain();
      const sizzleFilter = a.createBiquadFilter();
      sizzleFilter.type = 'highpass';
      sizzleFilter.frequency.setValueAtTime(1000, t0);
      sizzleFilter.frequency.exponentialRampToValueAtTime(3000, t0 + 0.35);
      sizzleGain.gain.setValueAtTime(0, t0);
      sizzleGain.gain.linearRampToValueAtTime(0.09, t0 + 0.003); // Reduced volume
      sizzleGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      sizzle.connect(sizzleFilter).connect(sizzleGain).connect(a.destination);
      sizzle.start(t0 + delayVar * 0.5);
      
      // Layer 4: More explosive metallic "clang" with sharper impact
      const clang = a.createOscillator();
      const clangGain = a.createGain();
      const clangFilter = a.createBiquadFilter();
      clang.type = 'triangle';
      clang.frequency.setValueAtTime(200 * pitchVar * typePitch, t0);
      clang.frequency.exponentialRampToValueAtTime(50 * pitchVar * typePitch, t0 + 0.15 * typeMultiplier);
      clangFilter.type = 'bandpass';
      clangFilter.frequency.setValueAtTime(250 * typePitch, t0);
      clangFilter.Q.value = 4;
      clangGain.gain.setValueAtTime(0, t0);
      clangGain.gain.linearRampToValueAtTime(0.09 * typeMultiplier, t0 + 0.003); // Reduced volume
      clangGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15 * typeMultiplier);
      clang.connect(clangFilter).connect(clangGain).connect(a.destination);
      clang.start(t0 + delayVar * 1.5); clang.stop(t0 + 0.15 * typeMultiplier + delayVar * 1.5);
      
      // Layer 5: More explosive spark/electrical crackle
      const spark = a.createBufferSource();
      const sparkLen = a.sampleRate * 0.1 | 0;
      const sparkBuf = a.createBuffer(1, sparkLen, a.sampleRate);
      const sparkData = sparkBuf.getChannelData(0);
      for(let i = 0; i < sparkLen; i++) {
        const progress = i / sparkLen;
        const noise = (Math.random() * 2 - 1);
        const envelope = Math.pow(1 - progress, 0.3); // Much sharper decay
        sparkData[i] = noise * envelope * 0.8; // More intense
      }
      spark.buffer = sparkBuf;
      const sparkGain = a.createGain();
      const sparkFilter = a.createBiquadFilter();
      sparkFilter.type = 'highpass';
      sparkFilter.frequency.setValueAtTime(2500, t0);
      sparkFilter.Q.value = 1.5;
      sparkGain.gain.setValueAtTime(0, t0);
      sparkGain.gain.linearRampToValueAtTime(0.06, t0 + 0.002); // Reduced volume
      sparkGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
      spark.connect(sparkFilter).connect(sparkGain).connect(a.destination);
      spark.start(t0 + delayVar * 2);
      
      // Layer 6: New explosive "boom" layer for extra impact
      const boom = a.createOscillator();
      const boomGain = a.createGain();
      const boomFilter = a.createBiquadFilter();
      boom.type = 'sawtooth';
      boom.frequency.setValueAtTime(80 * pitchVar * typePitch, t0);
      boom.frequency.exponentialRampToValueAtTime(25 * pitchVar * typePitch, t0 + 0.3 * typeMultiplier);
      boomFilter.type = 'lowpass';
      boomFilter.frequency.setValueAtTime(150 * typePitch, t0);
      boomFilter.Q.value = 1;
      boomGain.gain.setValueAtTime(0, t0);
      boomGain.gain.linearRampToValueAtTime(0.11 * typeMultiplier, t0 + 0.005); // Reduced volume
      boomGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3 * typeMultiplier);
      boom.connect(boomFilter).connect(boomGain).connect(a.destination);
      boom.start(t0 + delayVar * 0.3); boom.stop(t0 + 0.3 * typeMultiplier + delayVar * 0.3);
    }catch(e){} 
  }
  
  // Softer, more pleasant laser sound - less sharp and harsh
  function laser(variation = 0){ 
    if(muted) return;
    try {
      const a = ctx();
      const t0 = a.currentTime;
      
      // Add slight randomization
      const pitchVar = 1 + (Math.random() - 0.5) * 0.15;
      const timeVar = 1 + (Math.random() - 0.5) * 0.1;
      
      // Main laser tone - much lower and softer
      const laser = a.createOscillator();
      const laserGain = a.createGain();
      const laserFilter = a.createBiquadFilter();
      laser.type = 'triangle'; // Softer than sawtooth
      laser.frequency.setValueAtTime(800 * pitchVar, t0); // Much lower than 1800
      laser.frequency.exponentialRampToValueAtTime(600 * pitchVar, t0 + 0.1 * timeVar);
      
      // Low-pass filter to remove harsh high frequencies
      laserFilter.type = 'lowpass';
      laserFilter.frequency.setValueAtTime(1200, t0); // Cut off harsh highs
      laserFilter.Q.value = 0.5; // Gentle rolloff
      
      laserGain.gain.setValueAtTime(0, t0);
      laserGain.gain.linearRampToValueAtTime(0.04, t0 + 0.005); // Lower volume
      laserGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1 * timeVar);
      
      laser.connect(laserFilter).connect(laserGain).connect(a.destination);
      laser.start(t0); laser.stop(t0 + 0.1 * timeVar);
      
      // Softer mid-range "pew" overlay - much gentler
      const pew = a.createOscillator();
      const pewGain = a.createGain();
      const pewFilter = a.createBiquadFilter();
      pew.type = 'sine'; // Softest wave type
      pew.frequency.setValueAtTime(1200 * pitchVar, t0); // Much lower than 4000
      pew.frequency.exponentialRampToValueAtTime(900 * pitchVar, t0 + 0.06 * timeVar);
      
      // Gentle low-pass filter
      pewFilter.type = 'lowpass';
      pewFilter.frequency.setValueAtTime(1500, t0);
      pewFilter.Q.value = 0.3;
      
      pewGain.gain.setValueAtTime(0, t0);
      pewGain.gain.linearRampToValueAtTime(0.02, t0 + 0.002); // Much quieter
      pewGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06 * timeVar);
      
      pew.connect(pewFilter).connect(pewGain).connect(a.destination);
      pew.start(t0); pew.stop(t0 + 0.06 * timeVar);
      
    } catch(e) {}
  }
  
  // Dramatically improved player explosion
  function playerExplosion(){ 
    if(muted) return; 
    try { 
      const a = ctx();
      const t0 = a.currentTime;
      
      // Layer 1: Deep explosion rumble
      const deep = a.createOscillator();
      const deepGain = a.createGain();
      deep.type = 'sawtooth';
      deep.frequency.setValueAtTime(60, t0);
      deep.frequency.exponentialRampToValueAtTime(25, t0 + 0.8);
      deepGain.gain.setValueAtTime(0, t0);
      deepGain.gain.linearRampToValueAtTime(0.2, t0 + 0.1);
      deepGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.8);
      deep.connect(deepGain).connect(a.destination);
      deep.start(t0); deep.stop(t0 + 0.8);
      
      // Layer 2: Mid-range destruction
      const mid = a.createBufferSource();
      const midLen = a.sampleRate * 0.5 | 0;
      const midBuf = a.createBuffer(1, midLen, a.sampleRate);
      const midData = midBuf.getChannelData(0);
      for(let i = 0; i < midLen; i++) {
        midData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / midLen, 2.5);
      }
      mid.buffer = midBuf;
      const midGain = a.createGain();
      const midFilter = a.createBiquadFilter();
      midFilter.type = 'bandpass';
      midFilter.frequency.setValueAtTime(400, t0);
      midFilter.frequency.exponentialRampToValueAtTime(150, t0 + 0.5);
      midFilter.Q.value = 1.5;
      midGain.gain.setValueAtTime(0, t0);
      midGain.gain.linearRampToValueAtTime(0.15, t0 + 0.05);
      midGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5);
      mid.connect(midFilter).connect(midGain).connect(a.destination);
      mid.start(t0);
      
      // Layer 3: High-frequency debris
      const debris = a.createOscillator();
      const debrisGain = a.createGain();
      debris.type = 'square';
      debris.frequency.setValueAtTime(800, t0);
      debris.frequency.exponentialRampToValueAtTime(200, t0 + 0.3);
      debrisGain.gain.setValueAtTime(0, t0);
      debrisGain.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
      debrisGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      debris.connect(debrisGain).connect(a.destination);
      debris.start(t0); debris.stop(t0 + 0.3);
      
    } catch(e) {} 
  }
  
  // New: Power-up collection sound with variations
  function powerup(variation = 0){
    if(muted) return;
    try {
      const a = ctx();
      const t0 = a.currentTime;
      
      // Add slight randomization to avoid repetition
      const pitchVar = 1 + (Math.random() - 0.5) * 0.2;
      const timeVar = 1 + (Math.random() - 0.5) * 0.15;
      
      // Ascending chime
      const chime1 = a.createOscillator();
      const chime1Gain = a.createGain();
      chime1.type = 'sine';
      chime1.frequency.setValueAtTime(800 * pitchVar, t0);
      chime1.frequency.exponentialRampToValueAtTime(1200 * pitchVar, t0 + 0.15 * timeVar);
      chime1Gain.gain.setValueAtTime(0, t0);
      chime1Gain.gain.linearRampToValueAtTime(0.08, t0 + 0.02);
      chime1Gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15 * timeVar);
      chime1.connect(chime1Gain).connect(a.destination);
      chime1.start(t0); chime1.stop(t0 + 0.15 * timeVar);
      
      // Higher harmonic
      const chime2 = a.createOscillator();
      const chime2Gain = a.createGain();
      chime2.type = 'sine';
      chime2.frequency.setValueAtTime(1600 * pitchVar, t0);
      chime2.frequency.exponentialRampToValueAtTime(2400 * pitchVar, t0 + 0.12 * timeVar);
      chime2Gain.gain.setValueAtTime(0, t0);
      chime2Gain.gain.linearRampToValueAtTime(0.05, t0 + 0.02);
      chime2Gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12 * timeVar);
      chime2.connect(chime2Gain).connect(a.destination);
      chime2.start(t0); chime2.stop(t0 + 0.12 * timeVar);
    } catch(e) {}
  }
  
  // New: Boss hit sound
  function bossHit(){
    if(muted) return;
    try {
      const a = ctx();
      const t0 = a.currentTime;
      
      // Deep impact
      const impact = a.createOscillator();
      const impactGain = a.createGain();
      impact.type = 'triangle';
      impact.frequency.setValueAtTime(150, t0);
      impact.frequency.exponentialRampToValueAtTime(80, t0 + 0.2);
      impactGain.gain.setValueAtTime(0, t0);
      impactGain.gain.linearRampToValueAtTime(0.12, t0 + 0.01);
      impactGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      impact.connect(impactGain).connect(a.destination);
      impact.start(t0); impact.stop(t0 + 0.2);
      
      // Metallic ring
      const ring = a.createOscillator();
      const ringGain = a.createGain();
      ring.type = 'sine';
      ring.frequency.setValueAtTime(600, t0);
      ring.frequency.exponentialRampToValueAtTime(300, t0 + 0.3);
      ringGain.gain.setValueAtTime(0, t0);
      ringGain.gain.linearRampToValueAtTime(0.06, t0 + 0.01);
      ringGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
      ring.connect(ringGain).connect(a.destination);
      ring.start(t0); ring.stop(t0 + 0.3);
    } catch(e) {}
  }
  
  // Epic boss explosion - much more dramatic than regular explosions
  function bossExplosion(stage = 0){
    if(muted) return;
    try {
      const a = ctx();
      const t0 = a.currentTime;
      
      // Different intensities for different stages
      const intensity = [1.0, 0.8, 0.6, 0.4][stage] || 1.0;
      const duration = [1.2, 1.0, 0.8, 0.6][stage] || 1.2;
      
      // Layer 1: Massive sub-bass rumble (bigger than regular explosion)
      const rumble = a.createOscillator();
      const rumbleGain = a.createGain();
      rumble.type = 'sawtooth';
      rumble.frequency.setValueAtTime(30, t0); // Even lower than regular
      rumble.frequency.exponentialRampToValueAtTime(15, t0 + duration);
      rumbleGain.gain.setValueAtTime(0, t0);
      rumbleGain.gain.linearRampToValueAtTime(0.25 * intensity, t0 + 0.1); // Louder
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      rumble.connect(rumbleGain).connect(a.destination);
      rumble.start(t0); rumble.stop(t0 + duration);
      
      // Layer 2: Mid-range destruction (more complex than regular)
      const destruction = a.createBufferSource();
      const destLen = a.sampleRate * (duration * 0.8) | 0;
      const destBuf = a.createBuffer(1, destLen, a.sampleRate);
      const destData = destBuf.getChannelData(0);
      for(let i = 0; i < destLen; i++) {
        // More complex noise with multiple harmonics
        const t = i / destLen;
        const noise = (Math.random() * 2 - 1);
        const harmonic = Math.sin(t * Math.PI * 8) * 0.3;
        destData[i] = (noise + harmonic) * Math.pow(1 - t, 1.8);
      }
      destruction.buffer = destBuf;
      const destGain = a.createGain();
      const destFilter = a.createBiquadFilter();
      destFilter.type = 'bandpass';
      destFilter.frequency.setValueAtTime(200, t0);
      destFilter.frequency.exponentialRampToValueAtTime(80, t0 + duration * 0.8);
      destFilter.Q.value = 2;
      destGain.gain.setValueAtTime(0, t0);
      destGain.gain.linearRampToValueAtTime(0.18 * intensity, t0 + 0.05);
      destGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration * 0.8);
      destruction.connect(destFilter).connect(destGain).connect(a.destination);
      destruction.start(t0);
      
      // Layer 3: High-frequency debris and sparks
      const sparks = a.createOscillator();
      const sparksGain = a.createGain();
      sparks.type = 'square';
      sparks.frequency.setValueAtTime(1200, t0);
      sparks.frequency.exponentialRampToValueAtTime(300, t0 + duration * 0.6);
      sparksGain.gain.setValueAtTime(0, t0);
      sparksGain.gain.linearRampToValueAtTime(0.12 * intensity, t0 + 0.02);
      sparksGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration * 0.6);
      sparks.connect(sparksGain).connect(a.destination);
      sparks.start(t0); sparks.stop(t0 + duration * 0.6);
      
      // Layer 4: Metallic crash and ring (boss-specific)
      const crash = a.createOscillator();
      const crashGain = a.createGain();
      const crashFilter = a.createBiquadFilter();
      crash.type = 'triangle';
      crash.frequency.setValueAtTime(400, t0);
      crash.frequency.exponentialRampToValueAtTime(150, t0 + duration * 0.4);
      crashFilter.type = 'highpass';
      crashFilter.frequency.setValueAtTime(300, t0);
      crashFilter.Q.value = 1.5;
      crashGain.gain.setValueAtTime(0, t0);
      crashGain.gain.linearRampToValueAtTime(0.15 * intensity, t0 + 0.01);
      crashGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration * 0.4);
      crash.connect(crashFilter).connect(crashGain).connect(a.destination);
      crash.start(t0); crash.stop(t0 + duration * 0.4);
      
      // Layer 5: Deep metallic resonance (like a giant bell)
      const resonance = a.createOscillator();
      const resonanceGain = a.createGain();
      resonance.type = 'sine';
      resonance.frequency.setValueAtTime(80, t0);
      resonance.frequency.exponentialRampToValueAtTime(40, t0 + duration * 1.5);
      resonanceGain.gain.setValueAtTime(0, t0);
      resonanceGain.gain.linearRampToValueAtTime(0.08 * intensity, t0 + 0.05);
      resonanceGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration * 1.5);
      resonance.connect(resonanceGain).connect(a.destination);
      resonance.start(t0); resonance.stop(t0 + duration * 1.5);
      
    } catch(e) {}
  }
  
  function setMuted(v){ muted=!!v; }
  function toggle(){ muted=!muted; return muted; }
  function isMuted(){ return muted; }
  return { beep, explosion, laser, playerExplosion, powerup, bossHit, bossExplosion, setMuted, toggle, isMuted };
})();

// ---------- Bullet class ----------
class Bullet extends Phaser.Physics.Arcade.Sprite{
  constructor(scene){ super(scene,0,0,'bullet'); }
  fire(x,y,vy,texture='bullet'){
    this.passShieldUntil = 0;
    // Always reset special states when (re)firing from the pool
    this.piercing = false;
    this.pierceHitsLeft = 0;
    if(this.clearTint) this.clearTint();
    this.setBlendMode(Phaser.BlendModes.NORMAL);
    this.setScale(1);
    if(this._pierceEmitter){ try{ this._pierceEmitter.stop(); const mgr=this._pierceEmitter.manager||this._pierceEmitter; mgr.destroy&&mgr.destroy(); }catch(e){} this._pierceEmitter=null; }
    this.setTexture(texture);
    if (this.body && this.body.reset) this.body.reset(x,y); else this.setPosition(x,y);
    this.setActive(true).setVisible(true);
    if (this.body) {
      this.body.enable = true;
      this.body.debugShowBody = false;
      this.body.debugShowVelocity = false;
    }
    // Tight hitbox for reliable overlaps with fast movement
    if (this.body && this.body.setSize) this.body.setSize(6, 18, true);
    this.setVelocity(0,vy);
    this.setDepth(10);
  }
  preUpdate(t,dt){
    super.preUpdate(t,dt);
    if(this.y<-20 || this.y>620){
      this.setActive(false).setVisible(false);
      if(this.body) this.body.enable=false;
      try{ if(this._trail){ this._trail.stop&&this._trail.stop(); this._trail.remove&&this._trail.remove(); this._trail=null; } }catch(e){}
      try{ if(this._pierceEmitter){ const mgr=this._pierceEmitter.manager||this._pierceEmitter; mgr.destroy&&mgr.destroy(); this._pierceEmitter=null; } }catch(e){}
    }
  }
}

// ---------- Game Scene ----------
class GameScene extends Phaser.Scene{
  constructor(){ super('GameScene'); }
  preload(){
    Music.init(this);
    const mk=(n,draw)=>{ const g=this.make.graphics(); draw(g); g.generateTexture(n,32,32); g.destroy(); };
    // Player ship: sleeker neon interceptor (warm red/orange to stand out)
    mk('player',g=>{
      g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      // Central fuselage (arrowhead)
      g.fillStyle(0xff3b3b,1); g.fillTriangle(16,3, 9,16, 23,16);
      // Wings
      g.fillStyle(0xff8a33,1); g.fillTriangle(9,16, 4,28, 13,28);
      g.fillTriangle(23,16, 19,28, 28,28);
      // Tail fin
      g.fillStyle(0xcc3a1a,1); g.fillTriangle(13,28, 19,28, 16,31);
      // Cockpit
      g.fillStyle(0xffffff,1); g.fillTriangle(16,6, 13,14, 19,14);
      g.fillStyle(0xfff1cc,1); g.fillTriangle(16,7, 14,13, 18,13);
      // Accents/stripes
      g.fillStyle(0xffcc66,1); g.fillRect(15,14,2,3);
      // Outline
      g.lineStyle(1,0xff9966,0.85); g.strokeTriangle(16,3, 9,16, 23,16);
    });
    mk('bullet',g=>{ g.fillStyle(0x00ffff); g.fillRect(14,0,4,18); });
    // Cooler alien silhouettes (transparent background to avoid boxes)
    mk('alien1', g=>{ // Neon drone
      g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      g.fillStyle(0x00e5ff,1);
      // Angular hull
      g.fillTriangle(16,4, 7,16, 25,16);
      // Wings
      g.fillTriangle(7,16, 3,26, 12,26);
      g.fillTriangle(25,16, 20,26, 29,26);
      // Core glow
      g.fillStyle(0x99ffff,1); g.fillRect(15,10,2,6);
      // Outline
      g.lineStyle(1,0x66ffff,0.7); g.strokeTriangle(16,4, 7,16, 25,16);
    });
    mk('alien2', g=>{ // Saucer
      g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      // Hull
      g.fillStyle(0xffe766,1); g.fillCircle(16,14,8);
      g.fillStyle(0xffcc33,1); g.fillRect(8,16,16,4);
      // Dome
      g.fillStyle(0xffffaa,1); g.fillCircle(16,11,5);
      // Landing struts
      g.fillStyle(0xffd14a,1); g.fillRect(6,20,4,2); g.fillRect(22,20,4,2);
      // Rim outline
      g.lineStyle(1,0xfff199,0.7); g.strokeCircle(16,14,8.5);
    });
    mk('alien3', g=>{ // Beetle
      g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      // Body
      g.fillStyle(0x7a49ff,1); g.fillCircle(16,16,9);
      g.fillStyle(0x9b66ff,1); g.fillCircle(16,14,6);
      // Legs
      g.fillStyle(0x7a49ff,1);
      g.fillTriangle(6,18, 10,16, 10,22);
      g.fillTriangle(26,18, 22,16, 22,22);
      // Mandibles
      g.fillStyle(0x5522aa,1); g.fillTriangle(14,20, 16,24, 15,22); g.fillTriangle(16,24, 18,20, 17,22);
      // Outline
      g.lineStyle(1,0xbbb0ff,0.6); g.strokeCircle(16,16,9.5);
    });
    mk('particle',g=>{ g.fillStyle(0xffd700); g.fillRect(0,0,4,4); });
    // Soft round particle for subtle trails (fixes missing 'soft' texture placeholder)
    mk('soft', g=>{
      g.clear();
      // draw a soft-ish white disc by layering alpha circles
      g.fillStyle(0xffffff, 0.18); g.fillCircle(16,16,9);
      g.fillStyle(0xffffff, 0.35); g.fillCircle(16,16,6);
      g.fillStyle(0xffffff, 0.6);  g.fillCircle(16,16,3);
    });
    // Powerup: distinctive neon orb with ring to avoid alien-like shapes
    mk('powerup',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.lineStyle(3,0xffffff,0.8); g.strokeCircle(16,16,9); g.fillStyle(0xffffff,1); g.fillCircle(16,16,5); g.lineStyle(1,0xffffff,0.6); g.strokeCircle(16,16,12); });
    // Gold Star Powerup: double score powerup with golden glow
    mk('goldStar',g=>{
      g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      // Outer golden glow
      g.fillStyle(0xffd700,0.3); g.fillCircle(16,16,14);
      g.fillStyle(0xffd700,0.2); g.fillCircle(16,16,16);
      // Star shape (5-pointed star)
      g.fillStyle(0xffd700,1);
      // Main star body
      g.fillTriangle(16,4, 18,12, 26,12); // Top point
      g.fillTriangle(26,12, 20,18, 22,26); // Top right
      g.fillTriangle(22,26, 16,22, 10,26); // Bottom right
      g.fillTriangle(10,26, 12,18, 6,12); // Bottom left
      g.fillTriangle(6,12, 14,12, 16,4); // Top left
      // Inner star highlight
      g.fillStyle(0xffed4e,0.8);
      g.fillTriangle(16,6, 17,12, 24,12); // Top point
      g.fillTriangle(24,12, 19,16, 20,24); // Top right
      g.fillTriangle(20,24, 16,20, 12,24); // Bottom right
      g.fillTriangle(12,24, 13,16, 8,12); // Bottom left
      g.fillTriangle(8,12, 15,12, 16,6); // Top left
      // Center highlight
      g.fillStyle(0xffffff,0.9); g.fillCircle(16,16,3);
      // Golden outline
      g.lineStyle(1,0xffb000,0.8); g.strokeCircle(16,16,14);
    });
    mk('shieldBlock',g=>{ g.fillStyle(0x00aa00); g.fillRect(0,0,12,8); });
    // Player shield ring: layered glow (less hard lines)
    mk('shieldRing',g=>{ 
      g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      // Outer soft halo (multi-pass strokes with decreasing alpha)
      g.lineStyle(4,0x00ffaa,0.28); g.strokeCircle(16,16,13);
      g.lineStyle(3,0x00ffaa,0.22); g.strokeCircle(16,16,12);
      g.lineStyle(2,0x99ffee,0.35); g.strokeCircle(16,16,10.5);
      g.lineStyle(1,0xc8ffff,0.4); g.strokeCircle(16,16,9.5);
      // Very faint inner halo
      g.lineStyle(1,0xffffff,0.18); g.strokeCircle(16,16,8.5);
      // Minimal ticks (very faint) every 60 degrees to avoid hard look
      for(let i=0;i<6;i++){
        const ang=i*Math.PI/3; const x1=16+Math.cos(ang)*9.2, y1=16+Math.sin(ang)*9.2; const x2=16+Math.cos(ang)*13.2, y2=16+Math.sin(ang)*13.2;
        g.lineStyle(1,0x99ffee,0.25); g.lineBetween(x1,y1,x2,y2);
      }
    });
    // Boss: Enhanced alien overlord with smooth anti-aliased details (32x32 optimized)
    mk('boss',g=>{
      g.clear();
      g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      
      // Outer glow aura with smooth gradient effect
      g.fillStyle(0x4a1a6a,0.25); g.fillCircle(16,16,12);
      g.fillStyle(0x4a1a6a,0.15); g.fillCircle(16,16,13);
      g.fillStyle(0x4a1a6a,0.1); g.fillCircle(16,16,14);
      
      // Main head with smooth edges and subtle highlight
      g.fillStyle(0x0d0518,1); g.fillCircle(16,16,11);
      g.fillStyle(0x1a0a28,0.7); g.fillCircle(16,16,10.5);
      
      // Metallic forehead crown with smooth spikes
      g.fillStyle(0x2a1a40,1); g.fillTriangle(8,8, 24,8, 16,2);
      g.fillStyle(0x3a2a50,0.9); g.fillTriangle(9,7, 10,4, 11,8);
      g.fillStyle(0x3a2a50,0.9); g.fillTriangle(20,8, 21,4, 22,7);
      g.fillStyle(0x4a2a60,1); g.fillTriangle(9.5,6, 11,3, 10.5,9);
      g.fillStyle(0x4a2a60,1); g.fillTriangle(21.5,9, 22,3, 23.5,6);
      
      // Curved horns with smooth metallic tips
      g.fillStyle(0x1a0a2a,1); g.fillTriangle(5,10, 9,4, 10,12);
      g.fillStyle(0x1a0a2a,1); g.fillTriangle(22,12, 23,4, 27,10);
      g.fillStyle(0x2a1a3a,0.9); g.fillTriangle(5.5,9.5, 8.5,5, 9.5,11);
      g.fillStyle(0x2a1a3a,0.9); g.fillTriangle(22.5,11, 23.5,5, 26.5,9.5);
      g.fillStyle(0x6a4a8a,1); g.fillCircle(5.5,9,1.5); g.fillCircle(26.5,9,1.5);
      g.fillStyle(0x8a6aaa,0.8); g.fillCircle(5.5,9,1); g.fillCircle(26.5,9,1);
      
      // Enhanced cheekbone armor with smooth ridges
      g.fillStyle(0x2a1a40,1); g.fillTriangle(4,20, 10,14, 10,24);
      g.fillStyle(0x2a1a40,1); g.fillTriangle(22,14, 28,20, 22,24);
      g.fillStyle(0x3a2a50,0.9); g.fillTriangle(5,18, 8,15, 8,21);
      g.fillStyle(0x3a2a50,0.9); g.fillTriangle(24,15, 27,18, 24,21);
      g.fillStyle(0x4a2a60,1); g.fillTriangle(6,17, 7,16, 7,19);
      g.fillStyle(0x4a2a60,1); g.fillTriangle(25,16, 26,17, 25,19);
      
      // Smooth mandibles with detailed teeth
      g.fillStyle(0x2a0a1a,1); g.fillTriangle(10,22, 16,28, 13,25);
      g.fillStyle(0x2a0a1a,1); g.fillTriangle(16,28, 22,22, 19,25);
      g.fillStyle(0x3a1a2a,0.9); g.fillTriangle(11,23, 14,26, 12,27);
      g.fillStyle(0x3a1a2a,0.9); g.fillTriangle(18,26, 21,23, 20,27);
      g.fillStyle(0x4a1a2a,1); g.fillTriangle(11.5,24, 12.5,25, 12,26);
      g.fillStyle(0x4a1a2a,1); g.fillTriangle(19.5,25, 20.5,24, 20,26);
      
      // Deep eye sockets with smooth gradients
      g.fillStyle(0x000000,0.9); g.fillCircle(11,16,4); g.fillCircle(21,16,4);
      g.fillStyle(0x0a0a0a,0.8); g.fillCircle(11,16,3.5); g.fillCircle(21,16,3.5);
      g.fillStyle(0x1a0a0a,0.7); g.fillCircle(11,16,3); g.fillCircle(21,16,3);
      
      // Multi-layered glowing red eyes with smooth transitions
      g.fillStyle(0xff0044,1); g.fillCircle(11,16,2.5);
      g.fillStyle(0xff0044,1); g.fillCircle(21,16,2.5);
      g.fillStyle(0xff2255,0.9); g.fillCircle(11,16,2.2);
      g.fillStyle(0xff2255,0.9); g.fillCircle(21,16,2.2);
      g.fillStyle(0xff4488,0.8); g.fillCircle(11,16,1.8);
      g.fillStyle(0xff4488,0.8); g.fillCircle(21,16,1.8);
      g.fillStyle(0xff66aa,0.7); g.fillCircle(11,16,1.4);
      g.fillStyle(0xff66aa,0.7); g.fillCircle(21,16,1.4);
      g.fillStyle(0xffffff,0.8); g.fillCircle(11.5,15.5,0.8);
      g.fillStyle(0xffffff,0.8); g.fillCircle(21.5,15.5,0.8);
      g.fillStyle(0xffffff,0.6); g.fillCircle(11.2,15.7,0.6);
      g.fillStyle(0xffffff,0.6); g.fillCircle(21.2,15.7,0.6);
      
      // Smooth metallic chin guard
      g.fillStyle(0x3a2a50,1); g.fillTriangle(14,24, 18,24, 16,27);
      g.fillStyle(0x4a3a60,0.9); g.fillTriangle(14.5,24.5, 17.5,24.5, 16,26.5);
      
      // Smooth energy conduits with anti-aliased lines
      g.lineStyle(1,0x6a4a8a,0.7); g.lineBetween(8,12, 12,14); g.lineBetween(20,14, 24,12);
      g.lineStyle(0.8,0x7a5a9a,0.6); g.lineBetween(9,13, 11,15); g.lineBetween(21,15, 23,13);
      g.lineStyle(0.5,0x8a6aaa,0.5); g.lineBetween(9.5,13.5, 10.5,14.5); g.lineBetween(21.5,14.5, 22.5,13.5);
      
      // Enhanced outline with smooth energy field
      g.lineStyle(1.5,0x8a4aff,0.8); g.strokeCircle(16,16,11.5);
      g.lineStyle(1,0x9a5aff,0.6); g.strokeCircle(16,16,12);
      g.lineStyle(0.5,0xaa6aff,0.4); g.strokeCircle(16,16,12.5);
    });
    
    // Boss 2: Cybernetic war machine for level 6+ (32x32)
    mk('boss2',g=>{
      g.clear();
      g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      
      // Outer mechanical shell with metallic gradient
      g.fillStyle(0x2a2a2a,0.8); g.fillRect(4,6,24,20);
      g.fillStyle(0x3a3a3a,0.6); g.fillRect(6,8,20,16);
      g.fillStyle(0x4a4a4a,0.4); g.fillRect(8,10,16,12);
      
      // Central core with energy glow
      g.fillStyle(0x0066ff,0.3); g.fillCircle(16,16,8);
      g.fillStyle(0x0088ff,0.5); g.fillCircle(16,16,6);
      g.fillStyle(0x00aaff,0.7); g.fillCircle(16,16,4);
      g.fillStyle(0x00ccff,0.9); g.fillCircle(16,16,2);
      
      // Mechanical details and armor plates
      g.fillStyle(0x1a1a1a,0.9); g.fillRect(2,12,4,8); // Left armor
      g.fillStyle(0x1a1a1a,0.9); g.fillRect(26,12,4,8); // Right armor
      g.fillStyle(0x333333,0.8); g.fillRect(12,4,8,4); // Top plate
      g.fillStyle(0x333333,0.8); g.fillRect(12,24,8,4); // Bottom plate
      
      // Energy conduits
      g.fillStyle(0x00ff88,0.6); g.fillRect(14,2,4,2); // Top conduit
      g.fillStyle(0x00ff88,0.6); g.fillRect(14,28,4,2); // Bottom conduit
      g.fillStyle(0x00ff88,0.6); g.fillRect(2,14,2,4); // Left conduit
      g.fillStyle(0x00ff88,0.6); g.fillRect(28,14,2,4); // Right conduit
      
      // Weapon ports
      g.fillStyle(0xff4444,0.8); g.fillCircle(8,16,2); // Left weapon
      g.fillStyle(0xff4444,0.8); g.fillCircle(24,16,2); // Right weapon
      g.fillStyle(0xff6666,0.6); g.fillCircle(8,16,3);
      g.fillStyle(0xff6666,0.6); g.fillCircle(24,16,3);
      
      // Mechanical outline with energy highlights
      g.lineStyle(1.5,0x666666,0.8); g.strokeRect(4,6,24,20);
      g.lineStyle(1,0x888888,0.6); g.strokeRect(6,8,20,16);
      g.lineStyle(2,0x00aaff,0.7); g.strokeCircle(16,16,8);
      g.lineStyle(1,0x00ccff,0.5); g.strokeCircle(16,16,10);
    });
    
    // Boss 3: Dragon-inspired boss for level 9+ (32x32)
    mk('boss3',g=>{
      g.clear();
      g.fillStyle(0x000000,0); g.fillRect(0,0,32,32);
      
      // Dragon head with traditional colors
      // Main head shape - elongated and angular
      g.fillStyle(0xcc0000,0.9); g.fillRect(8,12,16,12); // Red head base
      g.fillStyle(0xff0000,0.7); g.fillRect(10,14,12,8); // Brighter red center
      
      // Dragon snout - pointed and fierce
      g.fillStyle(0xaa0000,0.9); g.fillRect(6,16,8,6); // Darker red snout
      g.fillStyle(0xcc0000,0.8); g.fillRect(7,17,6,4); // Snout highlight
      
      // Dragon eyes - glowing and menacing
      g.fillStyle(0xffaa00,0.8); g.fillCircle(12,18,2); // Left eye
      g.fillStyle(0xffaa00,0.8); g.fillCircle(20,18,2); // Right eye
      g.fillStyle(0xffff00,0.9); g.fillCircle(12,18,1); // Left eye core
      g.fillStyle(0xffff00,0.9); g.fillCircle(20,18,1); // Right eye core
      
      // Dragon horns - curved and sharp
      g.fillStyle(0x666666,0.9); g.fillRect(10,10,2,4); // Left horn
      g.fillStyle(0x666666,0.9); g.fillRect(20,10,2,4); // Right horn
      g.fillStyle(0x888888,0.7); g.fillRect(10,11,2,2); // Left horn highlight
      g.fillStyle(0x888888,0.7); g.fillRect(20,11,2,2); // Right horn highlight
      
      // Dragon mane - flowing energy
      g.fillStyle(0xff6600,0.6); g.fillRect(4,14,4,8); // Left mane
      g.fillStyle(0xff6600,0.6); g.fillRect(24,14,4,8); // Right mane
      g.fillStyle(0xff8800,0.4); g.fillRect(3,15,2,6); // Left mane glow
      g.fillStyle(0xff8800,0.4); g.fillRect(27,15,2,6); // Right mane glow
      
      // Dragon scales - textured pattern
      g.fillStyle(0xaa0000,0.5); g.fillRect(12,20,2,2); // Scale 1
      g.fillStyle(0xaa0000,0.5); g.fillRect(15,21,2,2); // Scale 2
      g.fillStyle(0xaa0000,0.5); g.fillRect(18,20,2,2); // Scale 3
      
      // Mystical energy aura
      g.fillStyle(0x00ff88,0.3); g.fillCircle(16,16,14); // Outer aura
      g.fillStyle(0x00ffaa,0.2); g.fillCircle(16,16,16); // Extended aura
      
      // Dragon outline with energy highlights
      g.lineStyle(1.5,0xcc0000,0.8); g.strokeRect(8,12,16,12); // Head outline
      g.lineStyle(1,0xff0000,0.6); g.strokeRect(10,14,12,8); // Inner outline
      g.lineStyle(2,0x00ff88,0.6); g.strokeCircle(16,16,14); // Energy aura outline
      g.lineStyle(1,0x00ffaa,0.4); g.strokeCircle(16,16,16); // Extended aura outline
    });
    
    mk('bossBullet',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.fillStyle(0xffaa00); g.fillCircle(16,16,6); });
    // Dedicated alien bullet sprite (small opaque amber orb, no halo)
    mk('alienBullet',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.fillStyle(0xffaa00,1); g.fillCircle(16,16,4); });
    mk('pierceBullet',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.lineStyle(3,0xff66ff,1); g.strokeCircle(16,12,8); g.fillStyle(0xffb3ff,1); g.fillCircle(16,12,4); g.lineStyle(1,0xffffff,0.6); g.strokeCircle(16,12,12); });
    // Shockwave ring for juicy kills
    mk('shock', g=>{ g.clear(); g.lineStyle(2,0x00ffff,0.85); g.strokeCircle(16,16,10); });
  }

  // Spawn a one-shot particle burst that cleans itself up
  burst(x, y, textureKey='particle', config={}, quantity=20, ttl=1000){
    try{
      const mgr = this.add.particles(x, y, textureKey, { emitting:false, blendMode:'ADD', ...config });
      if(mgr && mgr.explode) mgr.explode(quantity);
      this._tempBursts = this._tempBursts || [];
      this._tempBursts.push(mgr);
      this.time.delayedCall(ttl, ()=>{ try{ const arr=this._tempBursts||[]; const i=arr.indexOf(mgr); if(i>=0) arr.splice(i,1); mgr.destroy&&mgr.destroy(); }catch(e){} });
      return mgr;
    }catch(e){ return null; }
  }

  create(){
    this.isGameOver = false;
    this.isRestarting = false;
    // Begin with countdown gate active to prevent any early movement
    this.isCountingDown = true;
    this.physics.world.setBoundsCollision(true,true,true,true);
    // Hard-disable any Arcade Physics debug overlays (green boxes) just in case
    try{
      // Force all known flags off
      if(this.physics && this.physics.config) this.physics.config.debug = false;
      if(this.sys && this.sys.game && this.sys.game.config && this.sys.game.config.physics && this.sys.game.config.physics.arcade){
        this.sys.game.config.physics.arcade.debug = false;
      }
      const w = this.physics.world;
      w.drawDebug = false;
      w.debug = false;
      if(w.defaults){ w.defaults.debugShowBody=false; w.defaults.debugShowVelocity=false; }
      // Nuke the debug graphic entirely if it exists
      if(w.debugGraphic){ w.debugGraphic.clear(); w.debugGraphic.setVisible(false); w.debugGraphic.destroy(); w.debugGraphic=null; }
    }catch(e){}
    // Help Arcade overlap detection for fast bullets
    try { this.physics.world.OVERLAP_BIAS = 8; } catch(e) {}

    // Player & input
    this.player=this.physics.add.sprite(400,550,'player').setCollideWorldBounds(true);
    // Ensure no velocity before countdown finishes
    try{ this.player.setVelocity(0,0); }catch(e){}
    this.cursors=this.input.keyboard.createCursorKeys();
    this.keySpace=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyP=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyP.on('down',()=>this.togglePause());
    this.keyM=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyM.on('down',()=>this.updateMuteText(Sfx.toggle()));

    // Groups
    this.playerBullets=this.physics.add.group({ classType: Bullet, runChildUpdate:true, maxSize:-1 });
    this.alienBullets=this.physics.add.group({ classType: Bullet, runChildUpdate:true, maxSize:120 });
    this.powerups=this.physics.add.group();
    this.shields=this.physics.add.staticGroup();

    // Player cosmetics: engine exhaust + wingtip beacons
    try{
      // Engine exhaust (soft additive particles following player)
      this.playerExhaust = this.add.particles(0,0,'soft');
      this.playerExhaustEm = this.playerExhaust.createEmitter({
        follow: this.player,
        speedY: { min: 90, max: 150 },
        speedX: { min: -18, max: 18 },
        lifespan: 320,
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.6, end: 0 },
        frequency: 55,
        quantity: 1,
        tint: 0xff7a33,
        blendMode: 'ADD'
      });
      // Manual offset behind ship (fallback if followOffset unsupported)
      this._playerExhaustOffset = { x:0, y: 16 };
      // Wingtip beacons
      this.playerBeaconL = this.add.image(this.player.x-10, this.player.y+4, 'soft').setBlendMode('ADD').setTint(0xffdd88).setAlpha(0.7).setScale(0.35).setDepth(4);
      this.playerBeaconR = this.add.image(this.player.x+10, this.player.y+4, 'soft').setBlendMode('ADD').setTint(0xffdd88).setAlpha(0.7).setScale(0.35).setDepth(4);
      // Cockpit inner glow (flares while firing)
      this._playerCockpitOffset = { x:0, y:-8 };
      this.playerCockpitGlow = this.add.image(this.player.x, this.player.y-8, 'soft').setBlendMode('ADD').setTint(0xfff1aa).setAlpha(0.25).setScale(0.4).setDepth(5);
      // Heat shimmer under the ship (gentle rising glow)
      this.playerHeat = this.add.particles(0,0,'soft');
      this.playerHeatEm = this.playerHeat.createEmitter({
        speedY: { min: -20, max: -8 },
        speedX: { min: -10, max: 10 },
        lifespan: 260,
        scale: { start: 0.55, end: 0 },
        alpha: { start: 0.25, end: 0 },
        frequency: 38,
        quantity: 1,
        blendMode: 'ADD',
        tint: 0xffbb77
      });
      this._playerHeatOffset = { x:0, y: 12 };
      // Golden aura for double score effect
      this.playerGoldenAura = this.add.particles(0,0,'soft');
      this.playerGoldenAuraEm = this.playerGoldenAura.createEmitter({
        follow: this.player,
        speed: { min: -40, max: 40 },
        lifespan: 1200,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        frequency: 40,
        blendMode: 'ADD',
        tint: 0xffd700,
        emitting: false // Start disabled
      });
      this._playerGoldenOffset = { x:0, y: 0 };
    }catch(e){}

    // HUD
    const f={ fontFamily:'monospace', fontSize:'18px', color:'#fff' };
    this.score=0; this.lives=3; this.level=1; this.combo=0; this.comboMult=1;
    // High score persistence
    try{ this.highScore=parseInt(localStorage.getItem('si_highscore')||'0',10)||0; }catch(e){ this.highScore=0; }
    this.highGlobal = null;
    this.scoreText=this.add.text(16,12,'Score: 0',f);
    this.livesText=this.add.text(680,12,'Lives: 3',f);
    this.levelText=this.add.text(400,12,'Level: 1',{...f}).setOrigin(0.5,0);
    // High score shown under level (local + global)
    this.highText=this.add.text(400,32,'', {...f,fontSize:'16px',color:'#bbb'}).setOrigin(0.5,0);
    this.updateBestHudText && this.updateBestHudText();
    // Combo HUD near score
    this.comboText=this.add.text(16,34,'', {...f, fontSize:'16px', color:'#0ff'});
    this.infoText=this.add.text(400,300,'',{...f,fontSize:'28px'}).setOrigin(0.5);
    this.muteText=this.add.text(780,12,'',f).setOrigin(1,0).setAlpha(0.8);
    // Piercing ready HUD tag (shown during boss only)
    this.pierceReadyText=this.add.text(16,52,'', {...f, fontSize:'16px', color:'#ff66ff'});
    // Double score HUD indicator
    this.doubleScoreText=this.add.text(16,70,'', {...f, fontSize:'16px', color:'#ffd700'});
    // Golden screen tint for double score effect
    this.goldenTint=this.add.rectangle(400,300,800,600,0xffd700,0).setDepth(10).setBlendMode('ADD');
    // Subtle neon stroke + shadow for readability
    try{ this.scoreText.setStroke('#00ffaa', 1).setShadow(0,1,'#002222',2,true,true); }catch(e){}
    try{ this.livesText.setStroke('#00ffaa', 1).setShadow(0,1,'#002222',2,true,true); }catch(e){}
    try{ this.levelText.setStroke('#00ffaa', 1).setShadow(0,1,'#002222',2,true,true); }catch(e){}
    try{ this.highText.setStroke('#00ffaa', 1).setShadow(0,1,'#002222',2,true,true); }catch(e){}
    // Fetch global top score once and reflect in HUD
    try{
      if(window.Leaderboard && window.Leaderboard.getTop10){
        window.Leaderboard.getTop10().then(list=>{
          const arr = Array.isArray(list)? list : [];
          const top = arr.length ? (arr[0].score||0) : 0;
          this.highGlobal = top>0 ? top : null;
          this.updateBestHudText && this.updateBestHudText();
        }).catch(()=>{});
      }
    }catch(e){}
    try{ this.comboText.setStroke('#00ffaa', 1).setShadow(0,1,'#002222',2,true,true); }catch(e){}
    try{ this.infoText.setStroke('#00ffaa', 2).setShadow(0,2,'#002222',4,true,true); }catch(e){}
    try{ this.muteText.setStroke('#00ffaa', 1).setShadow(0,1,'#002222',2,true,true); }catch(e){}
    try{ this.pierceReadyText.setStroke('#ff66ff', 1).setShadow(0,1,'#220022',2,true,true); }catch(e){}
    try{ this.doubleScoreText.setStroke('#ffd700', 1).setShadow(0,1,'#222200',2,true,true); }catch(e){}
    this.updateMuteText(Sfx.isMuted());

    // Visuals
    // Regenerate shields each level; boss gets a minimal bunker
    if(this.level%3!==0) this.createShields(); else this.createBossShields();
    // Player shield visual (additive + semi-transparent for glow)
    this.shieldSprite=this.add.image(this.player.x,this.player.y,'shieldRing')
      .setVisible(false).setDepth(6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
    // Aura manager for shield (disabled by default)
    try{
      this.playerShieldAura = this.add.particles(0,0,'soft', {
        follow: this.player,
        speed: { min: -30, max: 30 },
        lifespan: 420,
        scale: { start: 1.05, end: 0 },
        alpha: { start: 0.3, end: 0 },
        frequency: 100,
        quantity: 1,
        blendMode: 'ADD',
        tint: 0x00ffaa,
        emitting: false
      });
      // Soft shield glow image that breathes under the ring
      this.playerShieldGlow = this.add.image(this.player.x,this.player.y,'soft')
        .setVisible(false).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0x99ffee).setAlpha(0.2).setScale(0.9).setDepth(5);
    }catch(e){}
    this.initStars();

    // Start wave or boss + countdown
    if(this.level%3===0) this.createBoss(); else this.createAlienGrid();
    this.startLevelCountdown();

    // Colliders (built after entities exist)
    this.time.delayedCall(0,()=>this.setupColliders());

    // Volume control
    const volumeSlider = document.getElementById('volume');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (event) => {
        // Halved mapping: midpoint (50) now equals prior half volume
        const volume = parseFloat(event.target.value) / 3200;
        Music.setVolume(volume);
      });
      // Set initial volume using halved mapping
      Music.setVolume(parseFloat(volumeSlider.value) / 3200);
    }
  }

  // Quick muzzle flash at given point using soft sprite
  spawnMuzzle(x, y){
    try{
      const img = this.add.image(x, y, 'soft').setBlendMode('ADD').setTint(0xffb266).setDepth(9).setAlpha(0.95).setScale(0.55);
      this.tweens.add({ targets: img, alpha: {from:0.95,to:0}, scale: {from:0.55,to:1.25}, duration:120, ease:'Cubic.Out', onComplete:()=>img.destroy() });
    }catch(e){}
  }

  // ---------- Stars ----------
  initStars(){
    const add=(tint,speed,lifespan,qty)=> this.add.particles(0,0,'particle',{
      x:{min:0,max:800}, y:0, lifespan, speedY:{min:speed*0.6,max:speed}, scale:{start:0.6,end:0}, alpha:{start:0.3,end:0}, quantity:qty, tint, blendMode:'ADD' });
    this.starFar=add(0x99ffff,18,6000,2);
    this.starMid=add(0x55ffff,40,4500,2);
    this.starNear=add(0x11ffff,90,3200,2);
    // Occasional shooting star streaks for extra motion parallax
    try{
      this.time.addEvent({ delay: 2800, loop: true, callback: ()=>{ if(Math.random()<0.6) this.spawnShootingStar(); } });
    }catch(e){}
  }

  // One-off fast streak across the sky
  spawnShootingStar(){
    try{
      const y = Phaser.Math.Between(40, 320);
      const p = this.add.particles(-10, y, 'particle', {
        speedX: { min: 420, max: 620 },
        speedY: { min: -40, max: 40 },
        lifespan: 900,
        scale: { start: 1.2, end: 0 },
        quantity: 1,
        emitting: false,
        blendMode: 'ADD',
        tint: 0x99ffff
      });
      p.explode(1);
      this.time.delayedCall(1400, ()=>{ try{ p.destroy(); }catch(e){} });
    }catch(e){}
  }

  // ---------- Waves ----------
  createAlienGrid(){
    this.aliens=this.physics.add.group();
    const rows=Math.min(4+Math.floor((this.level-1)/2),6), cols=10, x0=100, y0=80;
    const types=['alien1','alien2','alien3'];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const t=types[r%types.length];
      const a=this.aliens.create(x0+c*60, y0+r*50, t);
      a.setImmovable(true);
      a.type=t;
      a.health=(t==='alien3'?2:1);
      a._homeY = a.y; // remember nominal row height for smooth recovery after dives
      // Idle animation state
      a._idleSeed = Math.random()*Math.PI*2;
      a._baseScaleX = 1; a._baseScaleY = 1;
      a._yOffsetPrev = 0;
    }
    this.aliensTotal=rows*cols; this.alienDir=1; this.alienTimer=0; this.alienMoveDelay=Math.max(200,1000-(this.level-1)*100);
    this.alienShootTimer=this.time.now+800; this.isBossFight=false;
    // Barrage stream control: insert periodic breaks to avoid no-escape streams
    this.alienStreamCount = 0;
    this.alienBreakAfterN = Phaser.Math.Between(4,7);
    // Divers: schedule first dive (less frequent)
    this.diverNextAt = this.time.now + Phaser.Math.Between(2600, 4200);
    this.time.delayedCall(0,()=>this.setupColliders());
  }

  // ---------- Boss ----------
  createBoss(){
    this.isBossFight=true;
    
    // Choose different boss based on level
    let bossType = 'boss'; // Default
    if(this.level >= 9) bossType = 'boss3'; // Dragon boss for level 9+
    else if(this.level >= 6) bossType = 'boss2'; // Cybernetic boss for level 6-8
    this.boss=this.physics.add.sprite(400,140,bossType).setImmovable(true).setDepth(5);
    
    // Enhanced boss scale for maximum intimidation factor
    this.boss.setScale(5.2,3.8);
    // Enable smooth rendering (Phaser 3 automatically uses anti-aliasing when pixelArt is false)
    this.boss.setTexture(bossType);
    if(this.boss.body&&this.boss.body.setSize) this.boss.body.setSize(135,70,true);
    this.bossHp=Math.floor(60*(1+(this.level-1)*0.25)); this.bossMaxHp=this.bossHp;
    // Core movement params - different for different boss types
    this.bossHomeY = 140; // ensure defined to avoid NaN Y
    if(this.level >= 9) {
      // Boss 3 (Level 9+) - Dragon boss with serpentine movement
      this.bossMinX=60; this.bossMaxX=740; this.bossSpeedX=160; this.bossMoveDir=1; this.bossStartAt=this.time.now; this.bossPhase=0; this.bossBulletSpeedBase=320; this.bossFireScale=0.7;
      // Dragon-specific movement parameters
      this.dragonWaveAmplitude = 30; // How much the dragon weaves
      this.dragonWaveSpeed = 0.008; // How fast the weaving is
    } else if(this.level >= 6) {
      // Boss 2 (Level 6-8) - More aggressive movement
      this.bossMinX=60; this.bossMaxX=740; this.bossSpeedX=140; this.bossMoveDir=1; this.bossStartAt=this.time.now; this.bossPhase=0; this.bossBulletSpeedBase=300; this.bossFireScale=0.8;
    } else {
      // Original boss (Level 3) - Standard movement
      this.bossMinX=60; this.bossMaxX=740; this.bossSpeedX=110; this.bossMoveDir=1; this.bossStartAt=this.time.now; this.bossPhase=0; this.bossBulletSpeedBase=260; this.bossFireScale=1.0;
    }
    // Dash system (occasional speed bursts without teleporting)
    this._bossDashing = false;
    this.bossDashMult = 2.1; // speed multiplier during dash
    this.bossDashUntil = 0;
    this.bossNextDashAt = this.time.now + Phaser.Math.Between(2200, 5200);
    this.bossHealth=this.add.graphics(); this.updateBossHealthBar();
    // Overcharge (piercing) meter for boss fights
    this.bossCharge=0; this.bossChargeMax=12; this.pierceReady=false;
    this.bossChargeBar=this.add.graphics(); this.updateBossChargeBar();
    // Match logical hit area to new width
    this.bossHit=this.add.rectangle(this.boss.x,this.boss.y,135,70,0x00ff00,0); this.physics.add.existing(this.bossHit,true);
    this.bossIsEnraged = false;
    this.bossEnrageTimer = 0;
    this.time.delayedCall(0,()=>this.setupColliders());
    // Retarget + watchdog timers
    this.bossNextRetargetAt = this.time.now + Phaser.Math.Between(3000, 6000);
    this.lastBossX = this.boss.x; this.lastBossXCheckAt = this.time.now + 900;
    // Dash visual emitter (follows boss; enabled only during dashes)
    this.bossDashEmitter = this.add.particles(0,0,'particle', {
      follow: this.boss,
      speed: { min: -80, max: 80 },
      angle: { min: 80, max: 100 },
      lifespan: 420,
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.7, end: 0 },
      frequency: 45,
      quantity: 3,
      tint: 0xfff3a0,
      blendMode: 'ADD',
      emitting: false
    });
    // Constant, subtle exhaust glow while boss moves (boosted during dashes)
    try{
      const mgr = this.add.particles(0,0,'soft');
      const em = mgr.createEmitter({
        follow: this.boss,
        speed: { min: -20, max: 20 },
        angle: { min: 80, max: 100 },
        lifespan: 500,
        scale: { start: 1.2, end: 0 },
        alpha: { start: 0.4, end: 0 },
        frequency: 110,
        quantity: 1,
        tint: 0xfff3a0,
        blendMode: 'ADD'
      });
      this.bossExhaust = mgr; this.bossExhaustEm = em;
    }catch(e){}
    // Enhanced evil eye glows with multiple layers for dramatic effect
    try{
      const sx=this.boss.scaleX||1, sy=this.boss.scaleY||1;
      // Eye positions inside 32x32 texture space
      this._bossEyeDX = 5; // distance from center in texture space (slightly wider)
      this._bossEyeDY = 0; // relative to center vertically (centered)
      
      // Outer glow layer (larger, more subtle)
      this.bossEyeL_outer = this.add.image(this.boss.x - this._bossEyeDX*sx, this.boss.y + this._bossEyeDY*sy, 'soft')
        .setBlendMode('ADD').setTint(0xff0044).setAlpha(0.4).setScale(1.2).setDepth(5);
      this.bossEyeR_outer = this.add.image(this.boss.x + this._bossEyeDX*sx, this.boss.y + this._bossEyeDY*sy, 'soft')
        .setBlendMode('ADD').setTint(0xff0044).setAlpha(0.4).setScale(1.2).setDepth(5);
      
      // Main eye glow (medium intensity)
      this.bossEyeL = this.add.image(this.boss.x - this._bossEyeDX*sx, this.boss.y + this._bossEyeDY*sy, 'soft')
        .setBlendMode('ADD').setTint(0xff4488).setAlpha(0.8).setScale(0.7).setDepth(6);
      this.bossEyeR = this.add.image(this.boss.x + this._bossEyeDX*sx, this.boss.y + this._bossEyeDY*sy, 'soft')
        .setBlendMode('ADD').setTint(0xff4488).setAlpha(0.8).setScale(0.7).setDepth(6);
      
      // Inner core (bright white center)
      this.bossEyeL_core = this.add.image(this.boss.x - this._bossEyeDX*sx, this.boss.y + this._bossEyeDY*sy, 'soft')
        .setBlendMode('ADD').setTint(0xffffff).setAlpha(0.9).setScale(0.3).setDepth(7);
      this.bossEyeR_core = this.add.image(this.boss.x + this._bossEyeDX*sx, this.boss.y + this._bossEyeDY*sy, 'soft')
        .setBlendMode('ADD').setTint(0xffffff).setAlpha(0.9).setScale(0.3).setDepth(7);
    }catch(e){}
  }

  updateBossHealthBar(){ if(!this.bossHealth) return; const g=this.bossHealth; g.clear(); const x=100,y=70,w=600,h=10; g.fillStyle(0x222222,0.6).fillRect(x,y,w,h); const pct=this.bossMaxHp>0?this.bossHp/this.bossMaxHp:0; g.fillStyle(0xff5555,1).fillRect(x+1,y+1,Math.floor((w-2)*pct),h-2); g.lineStyle(1,0xffffff,0.6).strokeRect(x,y,w,h); }

  updateBossChargeBar(){
    if(!this.bossChargeBar) return;
    const g=this.bossChargeBar; g.clear();
    const x=100, y=86, w=600, h=6;
    g.fillStyle(0x111111,0.6).fillRect(x,y,w,h);
    const pct=this.bossChargeMax>0?Phaser.Math.Clamp((this.bossCharge||0)/this.bossChargeMax,0,1):0;
    const color = this.pierceReady ? 0xff66ff : 0x9b59ff;
    g.fillStyle(color,1).fillRect(x+1,y+1,Math.floor((w-2)*pct),h-2);
    g.lineStyle(1,0xffffff,0.4).strokeRect(x,y,w,h);
    if(this.pierceReadyText){ this.pierceReadyText.setText(this.pierceReady && this.isBossFight ? 'PIERCE READY' : ''); }
  }

  updateDoubleScoreEffects(){
    // Update double score indicator and visual effects
    if(this.doubleScoreText){ 
      const doubleScoreActive = this.time.now < (this.doubleScoreUntil||0);
      this.doubleScoreText.setText(doubleScoreActive ? 'DOUBLE SCORE' : '');
      
      // Debug logging
      if(doubleScoreActive && Math.random() < 0.01) { // Log occasionally when active
        console.log('Double score active:', doubleScoreActive, 'Time left:', (this.doubleScoreUntil - this.time.now));
      }
      
      // Golden screen tint effect - much more visible
      if(this.goldenTint) {
        if(doubleScoreActive) {
          this.goldenTint.setVisible(true);
          // More noticeable pulsing effect
          const pulse = 0.15 + 0.08 * Math.sin(this.time.now * 0.012);
          this.goldenTint.setAlpha(pulse);
        } else {
          this.goldenTint.setVisible(false);
        }
      }
      
      // Golden aura around player - much more visible
      if(this.playerGoldenAuraEm) {
        if(doubleScoreActive) {
          this.playerGoldenAuraEm.emitting = true;
          // The emitter follows the player automatically, no need to set position
        } else {
          this.playerGoldenAuraEm.emitting = false;
        }
      }
      
      // Make score text golden and pulsing when double score is active
      if(this.scoreText) {
        if(doubleScoreActive) {
          this.scoreText.setColor('#ffd700');
          this.scoreText.setStroke('#ffaa00', 3);
          // More dramatic pulsing effect
          const pulse = 1.0 + 0.15 * Math.sin(this.time.now * 0.015);
          this.scoreText.setScale(pulse);
        } else {
          this.scoreText.setColor('#fff');
          this.scoreText.setStroke('#00ffaa', 1);
          this.scoreText.setScale(1.0);
        }
      }
    }
  }

  // ---------- Shields ----------
  createShields(){
    this.shields.clear(true,true);
    // Hard mode: fewer bunkers as levels progress
    let bases=[];
    if(this.level<=2) bases=[240,560];
    else if(this.level<=4) bases=[400];
    else bases=[]; // from level 5+, no shields
    if(!bases.length) return;
    // Build bunkers slightly higher and with larger central gaps; blocks have 1 HP
    bases.forEach(bx=>{
      for(let r=0;r<4;r++){
        for(let c=0;c<8;c++){
          // Bigger central gap in all rows
          if(c===3 || c===4) continue;
          // Trim bottom corners for a classic bunker shape
          if(r===3 && (c<2 || c>5)) continue;
          const x=bx+(c-4)*14;
          const y=470+r*10; // 30px higher than before
          const block=this.shields.create(x,y,'shieldBlock');
          block.hp=2;
        }
      }
    });
  }

  // Minimal shields for boss fights: one small fragile center bunker
  createBossShields(){
    this.shields.clear(true,true);
    const buildBunker=(bx,rows,cols)=>{
      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          // Central gaps (wider for larger bunker)
          if((cols===8 && (c===3 || c===4)) || (cols===6 && (c===2 || c===3))) continue;
          // Trim bottom corners
          if(r===rows-1){
            if((cols===8 && (c<2 || c>5)) || (cols===6 && (c===0 || c===cols-1))) continue;
          }
          const x = bx + (c - (cols/2)) * 14;
          const y = 470 + r*10;
          const block=this.shields.create(x,y,'shieldBlock');
          block.hp=2;
        }
      }
    };
    // Center large bunker + two smaller side bunkers for more cover
    buildBunker(400, 4, 8);
    buildBunker(240, 3, 6);
    buildBunker(560, 3, 6);
  }

  // ---------- Level flow ----------
  // (removed duplicate simple startLevelCountdown; consolidated below)
  
  // More defensive countdown: store end time and auto-resume if needed
  startLevelCountdown(){
    // Only manage the visible label; gating derives from it in update()
    const seq = [[0,`Level ${this.level}`],[700,'3'],[1400,'2'],[2100,'1'],[2800,'GO!']];
    seq.forEach(([delay,label])=> this.time.delayedCall(delay,()=>{
      this.infoText.setText(label);
      Sfx.beep(800+delay/10,0.06,'square',0.03);
    }));
    this.time.delayedCall(3200,()=>{ 
      this.infoText.setText('');
      if(this.level%3===0) {
        Music.play(this, 'boss', 0.25);
      } else {
        Music.play(this, this.level % 2 === 0 ? 'level2' : 'level1', 0.25);
      }
    });
  }

  beginNextLevel(){
    // Do not pause physics; gating is handled by countdown label in update()
    this.isStartingLevel=false; 
    try{ this.physics.world.resume(); }catch(e){}
    
    // Award level completion bonus
    const levelBonus = this.level * 100;
    this.addScore(levelBonus, this.scale.width/2, this.scale.height/2 - 50, '#00ffaa');
    
    // Gentle level bonus sound effect - soft chime (comment out for silence)
    /*
    try{
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    }catch(e){}
    */
    
    // Special level bonus popup - make it more prominent and longer lasting
    const bonusText = this.add.text(this.scale.width/2, this.scale.height/2 - 100, `LEVEL ${this.level} BONUS: +${levelBonus}`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#00ffaa'
    }).setOrigin(0.5);
    this.tweens.add({
      targets: bonusText,
      y: this.scale.height/2 - 120,
      alpha: 0,
      duration: 3000, // Much longer display time
      onComplete: () => bonusText.destroy()
    });
    
    // Delay the "Level Complete!" text to let the bonus show first
    this.time.delayedCall(1000, () => {
      this.infoText.setText('Level Complete!');
    });
    // Immediately make the player safe and clear stray bullets during transition
    this.inLevelTransition = true;
    this.playerInvincibleUntil = Math.max(this.playerInvincibleUntil||0, this.time.now + 4000);
    this.clearBullets && this.clearBullets();
    Music.stop();
    this.time.delayedCall(1000,()=>{
      this.resetForNextLevel();
      this.level++; this.levelText.setText('Level: '+this.level);
      if(this.level%3===0) {
        // Boss levels: spawn minimal shields
        this.createBossShields();
        this.createBoss(); 
      } else {
        // Non-boss levels: regenerate shields using hard-mode layout
        this.createShields();
        this.createAlienGrid();
      }
      // Ensure colliders are re-established for new groups
      this.time.delayedCall(0,()=>this.setupColliders());
      this.startLevelCountdown();
      // End transition shortly after countdown completes
      this.time.delayedCall(3300,()=>{ this.inLevelTransition=false; });
    });
  }

  // Clear transient objects and state before building the next level
  resetForNextLevel(){
    // Clear bullets (player + alien)
    this.clearBullets && this.clearBullets();
    // Remove any remaining powerups (and their aura emitters + labels)
    if(this.powerups){
      this.powerups.children.each(p=>{
        if(!p) return;
        try{ if(p._aura){ p._aura.stop&&p._aura.stop(); const em=p._aura; this.time.delayedCall(0, ()=>{ try{ em.remove&&em.remove(); }catch(e){} }); p._aura=null; } }catch(e){}
        try{ if(p._label){ p._label.destroy(); p._label=null; } }catch(e){}
        if(p.destroy) p.destroy();
      });
    }
    // Hide/clear shield visuals + powerup timers
    if(this.shieldSprite) this.shieldSprite.setVisible(false).setScale(1).setAngle(0).setAlpha(0.75);
    try{ if(this._shieldPulse){ this._shieldPulse.stop(); this._shieldPulse=null; } }catch(e){}
    try{ if(this.playerShieldAura){ const mgr=this.playerShieldAura; try{ mgr.emitters.each(e=>{ try{ e.on=false; e.stop&&e.stop(); e.remove&&e.remove(); }catch(_){} }); }catch(_){} } }catch(e){}
    try{ if(this.playerShieldGlow){ this.playerShieldGlow.setVisible(false).setAlpha(0.28).setScale(0.95); } }catch(e){}
    this.doubleUntil=0; this.spreadUntil=0; this.rapidUntil=0; this.shieldUntil=0; this.shieldHits=0; this.doubleScoreUntil=0;
    // Reset firing cadence
    this.lastFired=0;
    // Remove old boss artifacts if any
    try{ if(this.bossHit){ this.bossHit.destroy(); this.bossHit=null; } }catch(e){}
    try{ if(this.bossEyeL){ this.bossEyeL.destroy(); this.bossEyeL=null; } }catch(e){}
    try{ if(this.bossEyeR){ this.bossEyeR.destroy(); this.bossEyeR=null; } }catch(e){}
    try{ if(this.bossEyeL_outer){ this.bossEyeL_outer.destroy(); this.bossEyeL_outer=null; } }catch(e){}
    try{ if(this.bossEyeR_outer){ this.bossEyeR_outer.destroy(); this.bossEyeR_outer=null; } }catch(e){}
    try{ if(this.bossEyeL_core){ this.bossEyeL_core.destroy(); this.bossEyeL_core=null; } }catch(e){}
    try{ if(this.bossEyeR_core){ this.bossEyeR_core.destroy(); this.bossEyeR_core=null; } }catch(e){}
    try{ if(this.bossHealth){ this.bossHealth.clear(); } }catch(e){}
    try{ if(this.bossChargeBar){ this.bossChargeBar.clear(); } }catch(e){}
    this.pierceReady=false; this.bossCharge=0;
    try{ if(this.bossDashEmitter){ this.bossDashEmitter.stop&&this.bossDashEmitter.stop(); const mgr=this.bossDashEmitter.manager||this.bossDashEmitter; mgr.destroy&&mgr.destroy(); this.bossDashEmitter=null; } }catch(e){}
    try{ if(this.bossExhaust){ const mgr=this.bossExhaust; try{ mgr.emitters.each(e=>{ try{ e.stop&&e.stop(); e.remove&&e.remove(); }catch(_){} }); }catch(_){} mgr.destroy&&mgr.destroy(); this.bossExhaust=null; this.bossExhaustEm=null; } }catch(e){}
    try{ if(this._bossAfterTimer){ this._bossAfterTimer.remove(false); this._bossAfterTimer=null; } }catch(e){}
    // Destroy old colliders so new groups can register cleanly
    if(this._colliders){ this._colliders.forEach(c=>{ try{ c.destroy(); }catch(e){} }); this._colliders=[]; }
    // Reset combo between levels
    this.resetCombo();
    // Cleanup any lingering one-shot particle bursts
    if(this._tempBursts){
      try{ this._tempBursts.forEach(m=>{ try{ m&&m.destroy&&m.destroy(); }catch(e){} }); }catch(e){}
      this._tempBursts = [];
    }
    // Clear all powerup aura emitters and kill any active particles
    try{
      if(this.powerupAura){
        const mgr=this.powerupAura;
        try{ mgr.emitters.each(e=>{ try{ e.stop&&e.stop(); e.remove&&e.remove(); }catch(_){} }); }catch(_){ }
        try{ mgr.clear&&mgr.clear(); }catch(_){ }
      }
    }catch(e){}
  }

  // ---------- Colliders ----------
  setupColliders(){ try{
    this.physics.add.overlap(this.playerBullets, this.shields, this.hitShield, null, this);
    this.physics.add.overlap(this.alienBullets, this.shields, this.hitShield, null, this);
    if(this.aliens) this.physics.add.overlap(this.playerBullets, this.aliens, this.hitAlien, null, this);
    if(this.bossHit) this.physics.add.overlap(this.playerBullets, this.bossHit, this.hitBoss, null, this);
    this.physics.add.overlap(this.alienBullets, this.player, this.hitPlayer, null, this);
    this.physics.add.overlap(this.powerups, this.player, this.collectPowerup, null, this);
  }catch(e){} }

  // ---------- Update ----------
  update(time, delta){
    const now = this.time.now;
    // Safety: force-hide any Arcade debug overlay that might have been toggled
    try{
      const w=this.physics&&this.physics.world; const g=w&&w.debugGraphic;
      if(w && (w.drawDebug || (g&&g.visible))){ w.drawDebug=false; if(g){ g.clear(); g.setVisible(false); } }
    }catch(e){}
    
    // Update double score visual effects every frame
    this.updateDoubleScoreEffects();
    // Derive countdown state strictly from the on-screen label
    try{
      const label = (this.infoText && this.infoText.text) || '';
      const counting = (label==='3' || label==='2' || label==='1' || (label && label.startsWith('Level ')));
      if (this.isCountingDown !== counting){
        this.isCountingDown = counting;
        // When countdown just ended, seed enemy timers if needed
        if (!this.isCountingDown){
          if (this.isBossFight){ const base=Phaser.Math.Between(800,1100); this.bossFireTimer = now + Math.max(300, Math.floor(base*(this.bossFireScale||1))); }
          else { this.alienShootTimer = now + 800; }
        }
      }
    }catch(e){}
    // Simple gate: do nothing while counting down or paused
    if(this.isGameOver || this.isRestarting || this.isCountingDown || this.isPaused){ this.player.setVelocity(0,0); return; }
    // Expire combo if timer ran out
    if((this.combo||0)>0 && now>(this.comboExpireAt||0)) this.resetCombo();
    // Player input (only while player is active/alive)
    const playerAlive = !!(this.player && this.player.active && (!this.player.body || this.player.body.enable!==false));
    const left=this.cursors.left.isDown, right=this.cursors.right.isDown, fire=this.keySpace.isDown;
    if(playerAlive){
      const vx = (left&&!right)?-300 : (right&&!left)?300 : 0;
      this.player.setVelocityX(vx);
      // Subtle banking based on velocity
      try{ this.player.setAngle(Phaser.Math.Clamp(-vx/300*6, -6, 6)); }catch(e){}
      // Keep exhaust offset aligned (manual follow offset)
      try{
        if(this.playerExhaustEm){
          const off=this._playerExhaustOffset||{x:0,y:16};
          this.playerExhaust.setPosition(this.player.x+off.x, this.player.y+off.y);
          // Reactive exhaust intensity: stronger while moving; stronger still during brief fire boost window
          const boosting = (this.exhaustBoostUntil||0) > this.time.now;
          if(boosting){
            this.playerExhaustEm.frequency = 30;
            this.playerExhaustEm.speedY = {min:140,max:200};
            this.playerExhaustEm.alpha = { start: 0.8, end: 0 };
          } else {
            this.playerExhaustEm.frequency = (Math.abs(vx)>1) ? 45 : 70;
            this.playerExhaustEm.speedY = (Math.abs(vx)>1) ? {min:110,max:170} : {min:80,max:130};
          this.playerExhaustEm.alpha = { start: 0.6, end: 0 };
          }
        }
        if(this.playerHeatEm && this.playerHeat){
          const hoff=this._playerHeatOffset||{x:0,y:12};
          this.playerHeat.setPosition(this.player.x+hoff.x, this.player.y+hoff.y);
          // Slightly stronger shimmer while boosting
          const boosting = (this.exhaustBoostUntil||0) > this.time.now;
          this.playerHeatEm.frequency = boosting ? 28 : 38;
          this.playerHeatEm.alpha = boosting ? { start: 0.3, end: 0 } : { start: 0.25, end: 0 };
        }
        if(this.playerBeaconL && this.playerBeaconR){
          const bx = 11, by = 5;
          this.playerBeaconL.setPosition(this.player.x - bx, this.player.y + by).setAlpha(0.55 + 0.25*Math.sin(this.time.now*0.01));
          this.playerBeaconR.setPosition(this.player.x + bx, this.player.y + by).setAlpha(0.55 + 0.25*Math.cos(this.time.now*0.011));
        }
        if(this.playerCockpitGlow){
          const o=this._playerCockpitOffset||{x:0,y:-8};
          this.playerCockpitGlow.setPosition(this.player.x+o.x, this.player.y+o.y);
          if(!((this.exhaustBoostUntil||0) > this.time.now)){
            const base = 0.22 + 0.12*Math.sin(this.time.now*0.015);
            this.playerCockpitGlow.setAlpha(base);
          }
        }
      }catch(e){}
      // Speed afterimage streaks while moving fast
      try{
        if(Math.abs(vx) > 220 && time > (this._nextPlayerAfterAt||0)){
          this.spawnPlayerAfterimage && this.spawnPlayerAfterimage();
          this._nextPlayerAfterAt = time + 120;
        }
      }catch(e){}
    } else {
      try{ this.player.setVelocity(0,0); }catch(e){}
    }
    // Keep shield sprite aligned
    const shieldActive = (this.shieldHits||0)>0 && (this.time.now<(this.shieldUntil||0));
    if(this.shieldSprite) this.shieldSprite.setPosition(this.player.x,this.player.y).setVisible(shieldActive);
    if(this.playerShieldGlow) this.playerShieldGlow.setPosition(this.player.x,this.player.y).setVisible(shieldActive);
    // Drive shield aura emitters + gentle ring/glow pulse while active
    try{
      if(this.playerShieldAura && this.playerShieldAura.emitters){ this.playerShieldAura.emitters.each(e=>{ if(e) e.on = shieldActive; }); }
      if(shieldActive){
        if(!this._shieldPulse){ this._shieldPulse = this.tweens.add({ targets: this.shieldSprite, scale: { from: 1.0, to: 1.06 }, alpha: { from: 0.45, to: 0.75 }, angle: '+=60', duration: 950, yoyo: true, repeat: -1, ease: 'Sine.InOut' }); }
        // Breathing glow under the ring (subtle)
        if(this.playerShieldGlow){ const t = this.time.now*0.006; const a = 0.18 + 0.09*Math.sin(t); const s = 0.94 + 0.06*Math.sin(t); this.playerShieldGlow.setAlpha(a).setScale(s); }
      } else {
        if(this._shieldPulse){ try{ this._shieldPulse.stop(); }catch(e){} this._shieldPulse=null; try{ this.shieldSprite.setScale(1).setAngle(0).setAlpha(0.6); }catch(e){} }
        if(this.playerShieldGlow){ this.playerShieldGlow.setVisible(false).setAlpha(0.2).setScale(0.9); }
      }
    }catch(e){}
    // Update powerup labels + despawn off-screen (and cleanup aura/label)
    if(this.powerups){
      try{
        const t=this.time.now;
        this.powerups.children.each(p=>{
          if(!p) return;
          if(p.active && p._label){ const bob=Math.sin((t/350)+(p._labelPhase||0))*2; p._label.setPosition(p.x, p.y-18+bob); }
          if(p.active && p.y>620){
            try{ if(p._aura){ p._aura.stop&&p._aura.stop(); const em=p._aura; this.time.delayedCall(400, ()=>{ try{ em.remove&&em.remove(); }catch(e){} }); p._aura=null; } }catch(e){}
            try{ if(p._label){ p._label.destroy(); p._label=null; } }catch(e){}
            p.destroy();
          }
        });
      }catch(e){}
    }
    // Firing with power-ups
    const rapid = this.time.now < (this.rapidUntil||0);
    const dbl   = this.time.now < (this.doubleUntil||0);
    const spread= this.time.now < (this.spreadUntil||0);
    const fireDelay = rapid ? 120 : 250;
    if(playerAlive && fire && time > (this.lastFired||0)){
      let fired=0; const baseY=this.player.y-22; const used=[];
      let applyPierce = this.isBossFight && !!this.pierceReady; let pierceUsed=false;
      const tryApplyPierce=(b)=>{
        if(!b || pierceUsed || !applyPierce) return;
        b.piercing=true; b.pierceHitsLeft=1;
        // Visuals: distinct texture, glow trail, additive blend, slightly larger
        if(b.setTexture) b.setTexture('pierceBullet');
        b.setBlendMode(Phaser.BlendModes.ADD);
        b.setScale(1.25);
        // Magenta trail that follows the bullet
        try{ if(b._pierceEmitter){ b._pierceEmitter.stop(); const mgr=b._pierceEmitter.manager||b._pierceEmitter; mgr.destroy&&mgr.destroy(); }
          b._pierceEmitter = this.add.particles(0,0,'particle', {
            follow: b,
            speed: { min: 40, max: 120 },
            angle: { min: 240, max: 300 },
            lifespan: 260,
            scale: { start: 1.1, end: 0 },
            alpha: { start: 0.9, end: 0 },
            frequency: 18,
            quantity: 2,
            tint: 0xff66ff,
            blendMode: 'ADD'
          });
        }catch(e){}
        pierceUsed=true; this.pierceReady=false; this.bossCharge=0; this.updateBossChargeBar();
        this.infoPopup(this.player.x, this.player.y-34, 'PIERCE!', '#ff66ff');
        Sfx.beep(1300,0.05,'sawtooth',0.03);
      };
      // Base shots
      if(dbl){
        // Always attempt to fire both muzzles; ensure two distinct instances
        const pair=this.twoFreshBullets(used);
        if(pair.length>=2){
          let [L,R]=pair; if(L===R){ R=this.playerBullets.create(0,0,'bullet'); }
          L.fire(this.player.x-18, baseY, -620, 'bullet'); L.owner='player'; L.passShieldUntil=this.time.now+300; this.spawnMuzzle(this.player.x-18, baseY+3);
          R.fire(this.player.x+18, baseY, -620, 'bullet'); R.owner='player'; R.passShieldUntil=this.time.now+300; this.spawnMuzzle(this.player.x+18, baseY+3);
          // Apply pierce to the first available muzzle
          tryApplyPierce(L); tryApplyPierce(R);
          fired+=2;
        } else if(pair.length===1){
          const b=pair[0];
          // Fallback: alternate single muzzle if pool somehow constrained
          this._muzzleRightFirst=!this._muzzleRightFirst; const x=this._muzzleRightFirst?this.player.x+18:this.player.x-18;
          b.fire(x, baseY, -620, 'bullet'); b.owner='player'; b.passShieldUntil=this.time.now+300; this.spawnMuzzle(x, baseY+3); tryApplyPierce(b); fired++;
        }
      } else {
        const b=this.allocBulletUnique(used); if(b){ b.fire(this.player.x, baseY, -600, 'bullet'); b.owner='player'; b.passShieldUntil=this.time.now+300; this.spawnMuzzle(this.player.x, baseY+3); tryApplyPierce(b); fired++; }
      }
      // Spread pair (ensure two distinct bullets like double-shot)
      if(spread){
        const pair = this.twoFreshBullets(used);
        if(pair.length>=2){
          let [l2,r2]=pair;
          if(l2===r2){ r2=this.playerBullets.create(0,0,'bullet'); }
          l2.fire(this.player.x-16, baseY+4, -600,'bullet'); l2.owner='player'; l2.setVelocityX(-200); l2.passShieldUntil=this.time.now+450; this.spawnMuzzle(this.player.x-16, baseY+6);
          r2.fire(this.player.x+16, baseY+4, -600,'bullet'); r2.owner='player'; r2.setVelocityX(200);  r2.passShieldUntil=this.time.now+450; this.spawnMuzzle(this.player.x+16, baseY+6);
          tryApplyPierce(l2); tryApplyPierce(r2);
          fired+=2;
        } else if(pair.length===1){
          // Fallback: alternate which angled side gets the single slot
          this._spreadRightFirst = !this._spreadRightFirst;
          const b = pair[0];
          const xoff = this._spreadRightFirst ? 16 : -16;
          const vx   = this._spreadRightFirst ? 200 : -200;
          const mx = this.player.x + xoff;
          b.fire(mx, baseY+4, -600,'bullet'); b.owner='player'; b.setVelocityX(vx); b.passShieldUntil=this.time.now+450; this.spawnMuzzle(mx, baseY+6); tryApplyPierce(b); fired++;
        }
      }
      if(fired>0){
        Sfx.laser(); this.lastFired = time + fireDelay;
        // Brief afterburner + cockpit flare
        try{ this.exhaustBoostUntil = time + 220; }catch(e){}
        try{ if(this.playerCockpitGlow){ this.playerCockpitGlow.setAlpha(0.95); this.tweens.add({targets:this.playerCockpitGlow, alpha:{from:0.95,to:0.3}, duration:220, ease:'Cubic.Out'}); } }catch(e){}
      }
    }

    // Aliens movement + shooting when not boss
    if(!this.isBossFight && this.aliens && this.aliens.countActive(true)>0){
      this.alienTimer+=delta;
      const alive=this.aliens.countActive(true), total=this.aliensTotal||alive;
      const frac = alive/total;
      const speedFactor=Phaser.Math.Linear(1,0.35,1-frac);
      const targetDelay=Math.max(110,this.alienMoveDelay*speedFactor);
      // Spawn divers periodically (less often)
      if(time > (this.diverNextAt||0)){
        const pool = this.aliens.getChildren().filter(a=>a.active && !a._diving);
        if(pool.length){
          // Usually 1 diver; occasional second diver
          const pickCount = 1 + ((pool.length>1 && Math.random()<0.25)?1:0);
          for(let i=0;i<pickCount;i++){
            const a = Phaser.Utils.Array.RemoveRandomElement(pool) || null; if(!a) break;
            a._diving = true;
            a._diveStart = time;
            // Aim roughly towards player
            const dx = (this.player? (this.player.x - a.x) : 0);
            a._dvx = Phaser.Math.Clamp(dx*0.45, -220, 220);
            a._dvy = Phaser.Math.Between(160, 230);
            a._diveDur = Phaser.Math.Between(900, 1400);
          }
        }
        // Next dive window later to reduce frequency overall
        this.diverNextAt = time + Phaser.Math.Between(2600, 4200);
      }
      // Update grid step and divers
      if(this.alienTimer>=targetDelay){
        this.alienTimer=0; let hitEdge=false;
        this.aliens.getChildren().forEach(a=>{
          if(!a.active) return;
          if(a._diving){ return; }
          a.x+=14*this.alienDir; if(a.x>=770||a.x<=30) hitEdge=true;
        });
        if(hitEdge){
          this.alienDir*=-1;
          this.aliens.getChildren().forEach(a=>{
            if(!a.active || a._diving) return;
            a.y+=28;
            // keep each alien's homeY in sync with the formation descent
            if(typeof a._homeY==='number') a._homeY += 28;
            if(a.y>520) this.gameOver('Invaders reached the base!');
          });
        }
      }
      // Per-frame diver motion and recovery
      this.aliens.getChildren().forEach(a=>{
        if(!a.active) return;
        const dt = delta/1000;
        if(a._diving){
          // Dive motion with slight tracking
          const track = this.player? Phaser.Math.Clamp((this.player.x - a.x)*0.2, -140, 140) : 0;
          a.x += (a._dvx + track)*dt; a.y += a._dvy*dt;
          if( (time - (a._diveStart||0)) > (a._diveDur||1200) || a.y>=520 ){
            // Smooth recovery: clear diving, then lerp back to homeY over time
            a._diving=false; a._recovering=true; a._dvx=0; a._dvy=0; a._diveStart=0;
          }
        } else if(a._recovering){
          // Ease back toward nominal row height without snapping
          const home = (typeof a._homeY==='number') ? a._homeY : a.y;
          // simple exponential approach
          a.y = Phaser.Math.Linear(a.y, home, Math.min(1, dt*3.0));
          if(Math.abs(a.y - home) < 1.5){ a.y = home; a._recovering = false; }
        }
      });
      // Subtle per-type idle effects (visual only)
      this.aliens.getChildren().forEach(a=>{
        if(!a || !a.active) return;
        const seed = a._idleSeed||0;
        const dtv = delta/1000;
        if(a.type==='alien2'){
          // Saucer: gentle vertical bob without drift
          const yoff = Math.sin(time*0.0035 + seed) * 1.2;
          const prev = a._yOffsetPrev||0;
          a.y += (yoff - prev);
          a._yOffsetPrev = yoff;
          // Rare dome shine flash
          if(Math.random() < 0.18*dtv){
            try{
              const img=this.add.image(a.x, a.y-3, 'soft').setTint(0xfff3a0).setBlendMode('ADD').setAlpha(0.85).setScale(0.6).setDepth(6);
              this.tweens.add({ targets: img, alpha:{from:0.85,to:0}, scale:{from:0.6,to:1.4}, duration:180, ease:'Cubic.Out', onComplete:()=>img.destroy() });
            }catch(e){}
          }
        } else if(a.type==='alien3'){
          // Beetle: tiny skitter scale pulse
          const s = 1 + 0.04*Math.sin(time*0.008 + seed);
          a.setScale((a._baseScaleX||1)*s, (a._baseScaleY||1));
          // Occasional mandible snap (quick angle pop)
          if(!a._snapActive && Math.random() < 0.12*dtv){
            try{
              a._snapActive = true; const dir = (Math.random()<0.5?-1:1);
              this.tweens.add({ targets: a, angle:{from:0,to:dir*6}, yoyo:true, duration:70, ease:'Sine.Out', onComplete:()=>{ try{ a.setAngle(0); }catch(_){} a._snapActive=false; } });
            }catch(e){ a._snapActive=false; }
          }
        } else if(a.type==='alien1'){
          // Drone: slight rocking
          const ang = Math.sin(time*0.005 + seed) * 3; // degrees
          a.setAngle(ang);
          // Occasional engine flicker burst beneath the drone
          if(Math.random() < 0.22*dtv){
            try{
              const p=this.add.particles(a.x, a.y+8, 'soft', { speedY:{min:20,max:60}, lifespan:220, scale:{start:0.6,end:0}, alpha:{start:0.5,end:0}, quantity:1, emitting:false, blendMode:'ADD', tint:0x00e5ff });
              p.explode(1);
              this.time.delayedCall(300, ()=>{ try{ p.destroy(); }catch(e){} });
            }catch(e){}
          }
        }
      });
      // Barrage: increase firing cadence and shoot multiple when endgame (<30% alive)
      if(time>(this.alienShootTimer||0)){
        const active=this.aliens.getChildren().filter(a=>a.active);
        if(active.length){
          const endgame = frac < 0.3;
          const shooters = endgame ? Math.min(3, active.length) : 1;
          for(let i=0;i<shooters;i++){
            const src=Phaser.Utils.Array.GetRandom(active);
            const b=this.alienBullets.get(); if(!b) continue;
            const vy = 300 + (endgame? 60:0);
            b.fire(src.x, src.y+20, vy, 'alienBullet'); b.owner='alien';
            // Light aiming to pressure the player
            if(this.player){ b.setVelocityX(Phaser.Math.Clamp((this.player.x - src.x)*0.6, -220, 220)); }
            // Visual polish: subtle trail only (keep bullet in normal blend to avoid square halos)
            try{
              if(b._trail){ b._trail.stop&&b._trail.stop(); b._trail.remove&&b._trail.remove(); }
              b._trail = this.add.particles(0,0,'soft',{
                follow: b, speed:{min:10,max:30}, lifespan:180, quantity:1, frequency:40,
                scale:{start:0.8,end:0}, alpha:{start:0.35,end:0}, tint:0xffaa00, blendMode:'ADD'
              });
            }catch(e){}
          }
          const base=Phaser.Math.Clamp(900-(this.level-1)*110,220,900);
          const mult=Phaser.Math.Linear(1,0.55,1-frac) * (endgame? 0.65:1.0);
          let nextDelay = Math.max(200, Math.floor(base*mult));
          // Insert small breathing gaps to allow escapes from corners
          if(endgame){
            this.alienStreamCount = (this.alienStreamCount||0) + 1;
            // After several volleys, force a brief break
            if(this.alienStreamCount >= (this.alienBreakAfterN||5)){
              nextDelay += Phaser.Math.Between(320, 620);
              this.alienStreamCount = 0;
              this.alienBreakAfterN = Phaser.Math.Between(4,7);
            } else if(Math.random() < 0.18){
              // Occasional micro-pause even within a stream
              nextDelay += Phaser.Math.Between(180, 360);
            }
          } else {
            // Reset stream counter when not in barrage phase
            this.alienStreamCount = 0;
          }
          this.alienShootTimer = time + nextDelay;
        }
      }
    }

    // Boss logic
    if(this.isBossFight && this.boss && this.boss.active){
      // Ramp with time
      const elapsed=time-(this.bossStartAt||time); if(this.bossPhase<1&&elapsed>=20000){ this.bossPhase=1; this.bossSpeedX=Math.min(this.bossSpeedX*1.3,170); this.bossFireScale=0.8; }
      if(this.bossPhase<2&&elapsed>=35000){ this.bossPhase=2; this.bossSpeedX=Math.min(this.bossSpeedX*1.15,190); this.bossBulletSpeedBase=300; this.bossFireScale=0.7; if(!this.bossEnrageTimer) this.bossEnrageTimer = time + 8000; }

      // Enrage cycling
      if(this.bossPhase>=2 && this.bossEnrageTimer && time > this.bossEnrageTimer){
        this.bossIsEnraged = !this.bossIsEnraged;
        if(this.bossIsEnraged){
          this.bossEnrageTimer = time + 5000; // 5s enrage
          if(this.boss && this.boss.setTint) this.boss.setTint(0xffaaaa);
        } else {
          this.bossEnrageTimer = time + 8000; // 8s cooldown
          if(this.boss && this.boss.clearTint) this.boss.clearTint();
        }
      }
      // Horizontal sweep
      if(!Number.isFinite(this.bossHomeY)) this.bossHomeY = this.boss.y;
      this.boss.y = this.bossHomeY + Math.sin(time*0.004)*18;
      // Dash handling: occasional bursts that increase speed smoothly for a short time
      if(!this._bossDashing && time >= (this.bossNextDashAt||0)){
        this._bossDashing = true;
        this.bossDashUntil = time + Phaser.Math.Between(450, 800);
        this.bossNextDashAt = time + Phaser.Math.Between(2800, 5600);
        // Subtle cue
        Sfx.beep(1100, 0.03, 'triangle', 0.025);
        // Enable dash trail and boost exhaust
        try{
          if(this.bossDashEmitter && this.bossDashEmitter.emitters){ this.bossDashEmitter.emitters.each(e=>{ if(e) e.on = true; }); }
          if(this.bossExhaustEm){ this.bossExhaustEm.frequency = 65; this.bossExhaustEm.alpha = { start: 0.6, end: 0 }; }
        }catch(e){}
      }
      if(this._bossDashing && time > this.bossDashUntil){
        this._bossDashing = false;
        // Disable dash trail and restore exhaust
        try{
          if(this.bossDashEmitter && this.bossDashEmitter.emitters){ this.bossDashEmitter.emitters.each(e=>{ if(e) e.on = false; }); }
          if(this.bossExhaustEm){ this.bossExhaustEm.frequency = 110; this.bossExhaustEm.alpha = { start: 0.4, end: 0 }; }
        }catch(e){}
      }
      const dashMul = this._bossDashing ? this.bossDashMult : 1.0;
      
      // Dragon boss gets serpentine movement
      if(this.level >= 9) {
        // Serpentine movement - weaving pattern
        const baseX = this.boss.x + (this.bossSpeedX*dashMul*(delta/1000))*this.bossMoveDir;
        const waveOffset = Math.sin(time * this.dragonWaveSpeed) * this.dragonWaveAmplitude;
        this.boss.x = baseX + waveOffset;
        
        // Keep within bounds
        if(this.boss.x>=this.bossMaxX){ this.boss.x=this.bossMaxX; this.bossMoveDir=-1; }
        if(this.boss.x<=this.bossMinX){ this.boss.x=this.bossMinX; this.bossMoveDir=1; }
      } else {
        // Standard movement for other bosses
        this.boss.x += (this.bossSpeedX*dashMul*(delta/1000))*this.bossMoveDir;
        if(this.boss.x>=this.bossMaxX){ this.boss.x=this.bossMaxX; this.bossMoveDir=-1; }
        if(this.boss.x<=this.bossMinX){ this.boss.x=this.bossMinX; this.bossMoveDir=1; }
      }
      // Ensure visible/active
      if(!this.boss.visible) this.boss.setVisible(true);
      if(!this.boss.active) this.boss.setActive(true);
      if(this.bossHit){ this.bossHit.setPosition(this.boss.x,this.boss.y); if(this.bossHit.body&&this.bossHit.body.updateFromGameObject) this.bossHit.body.updateFromGameObject(); }
      // Update enhanced eye glow positions with dramatic pulsing effects
      try{
        if(this.bossEyeL && this.bossEyeR){
          const sx=this.boss.scaleX||1, sy=this.boss.scaleY||1;
          const basePulse = 0.7 + 0.25*Math.sin(time*0.008); // Main pulse
          const corePulse = 0.8 + 0.15*Math.sin(time*0.012); // Faster core pulse
          const outerPulse = 0.3 + 0.15*Math.sin(time*0.005); // Slower outer pulse
          const dy = (this._bossEyeDY||0) + Math.sin(time*0.004+1.8)*0.3; // Enhanced bob
          
          // Update all eye layers
          if(this.bossEyeL_outer && this.bossEyeR_outer) {
            this.bossEyeL_outer.setPosition(this.boss.x - (this._bossEyeDX||5)*sx, this.boss.y + dy*sy).setAlpha(outerPulse);
            this.bossEyeR_outer.setPosition(this.boss.x + (this._bossEyeDX||5)*sx, this.boss.y + dy*sy).setAlpha(outerPulse);
          }
          this.bossEyeL.setPosition(this.boss.x - (this._bossEyeDX||5)*sx, this.boss.y + dy*sy).setAlpha(basePulse);
          this.bossEyeR.setPosition(this.boss.x + (this._bossEyeDX||5)*sx, this.boss.y + dy*sy).setAlpha(basePulse);
          if(this.bossEyeL_core && this.bossEyeR_core) {
            this.bossEyeL_core.setPosition(this.boss.x - (this._bossEyeDX||5)*sx, this.boss.y + dy*sy).setAlpha(corePulse);
            this.bossEyeR_core.setPosition(this.boss.x + (this._bossEyeDX||5)*sx, this.boss.y + dy*sy).setAlpha(corePulse);
          }
        }
      }catch(e){}
      // Fire - different patterns for different boss types
      if(time>(this.bossFireTimer||0)){
        const isBoss3 = this.level >= 9;
        const isBoss2 = this.level >= 6 && this.level < 9;
        const pattern=(Math.floor(time/2000)%(isBoss3 ? 4 : (isBoss2 ? 3 : 2)));
        
        if(isBoss3) {
          // Boss 3 (Level 9+) - Dragon boss with mystical attacks
          if(pattern===0){
            // Dragon breath - wide spread of fire
            for(let i=-3;i<=3;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||340)+Math.abs(i)*20;
              b.fire(this.boss.x+i*12, this.boss.y+40, vy, 'alienBullet'); b.owner='alien';
            }
            const base=Phaser.Math.Between(500,800); this.bossFireTimer=time+Math.max(200,Math.floor(base*(this.bossFireScale||1)));
          } else if(pattern===1){
            // Dragon claws - rapid triple strike
            for(let i=-1;i<=1;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||360);
              b.fire(this.boss.x+i*25, this.boss.y+40, vy, 'alienBullet'); b.owner='alien';
            }
            const base=Phaser.Math.Between(300,600); this.bossFireTimer=time+Math.max(150,Math.floor(base*(this.bossFireScale||1)));
          } else if(pattern===2){
            // Mystical energy orbs - curved projectiles
            for(let i=-2;i<=2;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||320);
              b.fire(this.boss.x, this.boss.y+40, vy, 'alienBullet'); b.owner='alien'; b.setVelocityX(i*80);
            }
            const base=Phaser.Math.Between(700,1000); this.bossFireTimer=time+Math.max(250,Math.floor(base*(this.bossFireScale||1)));
          } else {
            // Dragon fury - massive spread
            for(let i=-4;i<=4;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||300)+Math.abs(i)*15;
              b.fire(this.boss.x+i*10, this.boss.y+40, vy, 'alienBullet'); b.owner='alien';
            }
            const base=Phaser.Math.Between(900,1300); this.bossFireTimer=time+Math.max(300,Math.floor(base*(this.bossFireScale||1)));
          }
        } else if(isBoss2) {
          // Boss 2 (Level 6+) - More aggressive patterns
          if(pattern===0){
            // Triple spread pattern
            for(let i=-2;i<=2;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||320)+Math.abs(i)*30;
              b.fire(this.boss.x+i*15, this.boss.y+40, vy, 'alienBullet'); b.owner='alien';
            }
            const base=Phaser.Math.Between(600,900); this.bossFireTimer=time+Math.max(250,Math.floor(base*(this.bossFireScale||1)));
          } else if(pattern===1){
            // Rapid fire burst
            for(let i=-1;i<=1;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||350);
              b.fire(this.boss.x+i*20, this.boss.y+40, vy, 'alienBullet'); b.owner='alien';
            }
            const base=Phaser.Math.Between(400,700); this.bossFireTimer=time+Math.max(200,Math.floor(base*(this.bossFireScale||1)));
          } else {
            // Wide spread pattern
            for(let i=-3;i<=3;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||300);
              b.fire(this.boss.x, this.boss.y+40, vy, 'alienBullet'); b.owner='alien'; b.setVelocityX(i*100);
            }
            const base=Phaser.Math.Between(800,1200); this.bossFireTimer=time+Math.max(300,Math.floor(base*(this.bossFireScale||1)));
          }
        } else {
          // Original boss (Level 3) - Original patterns
          if(pattern===0){
            for(let i=-1;i<=1;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||280)+Math.abs(i)*40;
              b.fire(this.boss.x+i*12, this.boss.y+40, vy, 'alienBullet'); b.owner='alien';
            }
            const base=Phaser.Math.Between(800,1100); this.bossFireTimer=time+Math.max(300,Math.floor(base*(this.bossFireScale||1)));
          } else {
            for(let i=-2;i<=2;i++){
              const b=this.alienBullets.get(); if(!b) continue; const vy=(this.bossBulletSpeedBase||300);
              b.fire(this.boss.x, this.boss.y+40, vy, 'alienBullet'); b.owner='alien'; b.setVelocityX(i*120);
            }
            const base=Phaser.Math.Between(1000,1300); this.bossFireTimer=time+Math.max(350,Math.floor(base*(this.bossFireScale||1)));
          }
        }
         if(this.bossIsEnraged){
           for(let k=-3;k<=3;k++){
             const b2=this.alienBullets.get(); if(!b2) continue;
             b2.fire(this.boss.x,this.boss.y+36,(this.bossBulletSpeedBase||320)+Phaser.Math.Between(0,60),'alienBullet'); b2.owner='alien'; b2.setVelocityX(k*80+Phaser.Math.Between(-20,20));
           }
         }
      }
      // Random mode retarget: wide vs narrow sweep bands
      if(!this.bossNextRetargetAt) this.bossNextRetargetAt = time + 3500;
      if(time >= this.bossNextRetargetAt){
        // Pick a mode, but build a band that always includes the current X to avoid jumps
        this.bossMoveMode = (Math.random() < 0.5) ? 'narrow' : 'wide';
        const narrow = this.bossMoveMode === 'narrow';
        let w = narrow ? Phaser.Math.Between(180, 260) : Phaser.Math.Between(480, 660);
        // Center near current position, with a small random offset
        let center = this.boss.x + Phaser.Math.Between(-60, 60);
        center = Phaser.Math.Clamp(center, 60 + w/2, 740 - w/2);
        this.bossMinX = Math.floor(center - w/2);
        this.bossMaxX = Math.ceil(center + w/2);
        const baseSpeed = narrow ? Phaser.Math.Between(120, 180) : Phaser.Math.Between(90, 150);
        this.bossSpeedX = Math.min(baseSpeed * (1 + this.bossPhase * 0.12), 240);
        // Maintain direction; only flip if sitting very close to an edge
        if (Math.abs(this.boss.x - this.bossMinX) < 2) this.bossMoveDir = 1;
        else if (Math.abs(this.boss.x - this.bossMaxX) < 2) this.bossMoveDir = -1;
        this.bossNextRetargetAt = time + Phaser.Math.Between(2500, 6000);
      }
      // Stuck watchdog
      if(!this.lastBossXCheckAt) { this.lastBossXCheckAt = time + 900; this.lastBossX = this.boss.x; }
      if(time >= this.lastBossXCheckAt){
        const moved = Math.abs(this.boss.x - this.lastBossX);
        this.lastBossX = this.boss.x; this.lastBossXCheckAt = time + 900;
        if(moved < 4){
          // Flip direction and rebuild a band centered on current X to ensure continuity
          this.bossMoveDir *= -1;
          this.bossMoveMode = (Math.random()<0.5)?'narrow':'wide';
          const narrow = this.bossMoveMode==='narrow';
          let w = narrow ? Phaser.Math.Between(180, 260) : Phaser.Math.Between(480, 660);
          let center = Phaser.Math.Clamp(this.boss.x, 60 + w/2, 740 - w/2);
          this.bossMinX = Math.floor(center - w/2);
          this.bossMaxX = Math.ceil(center + w/2);
          this.bossSpeedX = narrow ? Phaser.Math.Between(120, 180) : Phaser.Math.Between(100, 160);
          this.bossNextRetargetAt = time + Phaser.Math.Between(1800, 3500);
        }
      }
    }
  }

  // ---------- Bullet allocation helpers (ensure unique instances) ----------
  allocBullet(){ let b=this.playerBullets.get(); if(!b){ b=this.playerBullets.create(0,0,'bullet'); } return b; }
  allocBulletUnique(used){ const seen=new Set(used); let tries=0; let b=this.allocBullet(); while(b && seen.has(b) && tries<4){ b=this.playerBullets.get(); if(!b) b=this.playerBullets.create(0,0,'bullet'); tries++; } if(b) used.push(b); return b; }
  allocBulletsUnique(n, used){ const arr=[]; for(let i=0;i<n;i++){ const b=this.allocBulletUnique(used); if(!b) break; arr.push(b); } return arr; }

  twoFreshBullets(used){
    const res=this.allocBulletsUnique(2, used);
    if(res.length===2) return res;
    const uniq=new Set(res);
    while(res.length<2){ const nb=this.playerBullets.create(0,0,'bullet'); if(!nb || uniq.has(nb)) break; uniq.add(nb); used.push(nb); res.push(nb); }
    return res;
  }

  // ---------- Hit handlers ----------
  hitAlien(bullet, alien){
    if(!bullet.active||!alien.active) return;
    if(bullet.disableBody) bullet.disableBody(true,true);
    bullet.setActive(false).setVisible(false);
    // Damage and feedback
    alien.health=(alien.health||1)-1;
    if(alien.health>0){
      alien.setTint(0xff6666);
      // Quick scale punch + subtle camera tick
      try{ this.tweens.add({ targets: alien, scaleX:{from:1,to:1.12}, scaleY:{from:1,to:1.12}, yoyo:true, duration:80, ease:'Sine.Out' }); }catch(e){}
      try{ this.cameras.main.shake(60, 0.0015); }catch(e){}
      this.infoPopup(alien.x, alien.y-10, 'HIT', '#ffaaaa');
      this.time.delayedCall(120,()=>alien.clearTint());
      return;
    }
    // Kill
    alien.disableBody(true,true);
    // Shockwave ring + mild camera shake
    try{ const ring=this.add.image(alien.x, alien.y, 'shock').setBlendMode('ADD').setDepth(8).setAlpha(0.85).setScale(0.6); this.tweens.add({ targets:ring, alpha:0, scale:2.0, duration:280, ease:'Cubic.Out', onComplete:()=>ring.destroy() }); }catch(e){}
    try{ this.cameras.main.shake(80, 0.002); }catch(e){}
    // Combo bump then score with multiplier
    const prevMult=this.comboMult;
    this.bumpCombo();
    const base=10; const pts=base*this.comboMult;
    this.addScore(pts, alien.x, alien.y-12, '#ffee88');
    if(this.comboMult>prevMult){
      this.infoPopup(alien.x, alien.y-28, 'x'+this.comboMult, '#ffdd55');
      try{ this.tweens.add({ targets: this.comboText, scale: { from: 1.0, to: 1.2 }, yoyo: true, duration: 120 }); }catch(e){}
    }
    // Color-tinted shards by alien type for flavor
    let _tint=0xffffff; let alienType=0; 
    try{ 
      const t=alien.type || (alien.texture && alien.texture.key); 
      if(t==='alien1') { _tint=0x00e5ff; alienType=1; } 
      else if(t==='alien2') { _tint=0xffe766; alienType=2; } 
      else if(t==='alien3') { _tint=0x7a49ff; alienType=3; } 
    }catch(e){}
    const p=this.add.particles(alien.x,alien.y,'particle',{speed:{min:-120,max:120}, lifespan:450, scale:{start:1.1,end:0}, emitting:false, blendMode:'ADD', tint:_tint}); p.explode(24);
    // Enhanced explosion sound with variety based on alien type
    Sfx.explosion(alienType);
    if(Math.random()<0.14) this.dropPowerup(alien.x, alien.y);
    if(this.aliens.countActive(true)===0) this.beginNextLevel();
  }
  
  // Drop power-ups sometimes
  dropPowerup(x,y){
    const tRand=Math.random(); let type='double';
    if(tRand<0.2) type='spread'; else if(tRand<0.4) type='rapid'; else if(tRand<0.55) type='shield'; else if(tRand<0.7) type='goldStar';
    const spriteName = type === 'goldStar' ? 'goldStar' : 'powerup';
    const p=this.powerups.create(x,y,spriteName);
    p.setVelocity(0, Phaser.Math.Between(140,180));
    p.setBounce(0).setCollideWorldBounds(false);
    p.setData('type', type);
    const tintMap={double:0x00ffff, spread:0xffaa00, rapid:0xff00ff, shield:0x00ffaa, goldStar:0xffd700};
    const tint=tintMap[type]||0xffffff;
    if(type !== 'goldStar') p.setTint(tint); // Gold star has its own golden color
    p.setDepth(6);
    p.setBlendMode(Phaser.BlendModes.ADD);
    // Make it clearly not an alien: smaller orb, spin and gentle pulse
    p.setScale(0.9);
    try{ p.setAngularVelocity(120); }catch(e){}
    this.tweens.add({targets:p, scale:{from:0.85,to:1.15}, duration:520, yoyo:true, repeat:-1, ease:'Sine.InOut'});
    // Neon aura using shared manager emitter
    try{
      if(this.powerupAura){
        const em = this.powerupAura.createEmitter({
          follow: p,
          speed:{min:10,max:30},
          lifespan: 500,
          quantity: 1,
          frequency: 120,
          scale:{start:1.0,end:0},
          alpha:{start:0.8,end:0},
          tint
        });
        p._aura = em;
      }
    }catch(e){}

    // UI-like tag above the orb to clarify type
    try{
      const labelMap = { double:'2X', spread:'SPR', rapid:'RPD', shield:'SHD' };
      const colorMap = { double:'#00ffff', spread:'#ffaa00', rapid:'#ff00ff', shield:'#00ffaa' };
      const txt = labelMap[type]||'PWR';
      const col = colorMap[type]||'#ffffff';
      const tag = this.add.text(p.x, p.y-18, txt, { fontFamily:'monospace', fontSize:'12px', color: col })
        .setOrigin(0.5).setDepth(7);
      try{ tag.setStroke('#000000', 3); }catch(e){}
      p._label = tag; p._labelPhase = Math.random()*Math.PI*2;
    }catch(e){}
  }

  hitPlayer(player, bullet){ bullet.setActive(false).setVisible(false); if(this.time.now<(this.playerInvincibleUntil||0)) return; // shield absorbs
    // Ignore all hits during countdowns/level transitions/gameover
    if(this.isCountingDown || this.inLevelTransition || this.isGameOver || this.isRestarting) return;
    if((this.shieldHits||0)>0 && this.time.now < (this.shieldUntil||0)){
      this.shieldHits--;
      this.burst(player.x,player.y,'particle',{speed:{min:-120,max:120},lifespan:300,scale:{start:1,end:0}},18,500);
      // Shield impact flare (subtle)
      try{ const ring=this.add.image(player.x, player.y, 'shock').setBlendMode('ADD').setTint(0x00ffaa).setAlpha(0.6).setScale(0.5); this.tweens.add({ targets:ring, alpha:0, scale:1.7, duration:220, ease:'Cubic.Out', onComplete:()=>ring.destroy() }); }catch(e){}
      // Brief shield ring flash (reduced)
      try{ if(this.shieldSprite){ this.shieldSprite.setAlpha(0.9); this.tweens.add({targets:this.shieldSprite, alpha:{from:0.9,to:0.7}, duration:160, yoyo:true}); } }catch(e){}
      Sfx.beep(500,0.08,'triangle',0.03);
      this.playerInvincibleUntil=this.time.now+300;
      if(this.shieldHits<=0 && this.shieldSprite) this.shieldSprite.setVisible(false);
      return;
    }
    // Real hit: reset combo
    this.resetCombo();
    this.lives--; this.livesText.setText('Lives: '+this.lives); this.burst(player.x,player.y,'particle',{speed:200, lifespan:600, scale:{start:1.4,end:0}},30,800); Sfx.playerExplosion(); if(this.lives>0){ player.disableBody(true,true); this.time.delayedCall(900,()=>{ player.enableBody(true,400,550,true,true); this.playerInvincibleUntil=this.time.now+1500; player.setAlpha(0.35);             this.tweens.add({targets:player, alpha:{from:0.35,to:1}, yoyo:true, duration:120, repeat:10, onComplete:()=>{ player.setAlpha(1.0); }}); }); } else this.gameOver('You have been defeated!'); }

  hitShield(bullet, block){
    if(!block||!block.active) return;
    // Let freshly fired player bullets pass for a brief window
    if(bullet.owner==='player' && bullet.passShieldUntil && this.time.now<bullet.passShieldUntil) return;
    // Immediately kill bullet and any attached effects to avoid lingering visuals
    try{
      if(bullet._trail){ bullet._trail.stop&&bullet._trail.stop(); bullet._trail.remove&&bullet._trail.remove(); bullet._trail=null; }
    }catch(e){}
    try{
      if(bullet._pierceEmitter){ const mgr=bullet._pierceEmitter.manager||bullet._pierceEmitter; mgr.stop&&mgr.stop(); mgr.destroy&&mgr.destroy(); bullet._pierceEmitter=null; }
    }catch(e){}
    if(bullet.disableBody) bullet.disableBody(true,true);
    bullet.setActive(false).setVisible(false);
    block.hp=(block.hp||1)-1;
    if(block.hp<=0) block.destroy(); else { block.setTint(0x00ffff); this.time.delayedCall(80,()=>block.clearTint()); }
    // Hard mode: alien splash damage erodes nearby blocks
    if(bullet.owner==='alien' && this.shields && this.shields.children){
      const splash=16;
      try{
        this.shields.children.each(s=>{
          if(!s||!s.active||s===block) return;
          if(Math.abs(s.x-block.x)<=splash && Math.abs(s.y-block.y)<=splash){
            s.hp=(s.hp||1)-1;
            if(s.hp<=0) s.destroy(); else { s.setTint(0x00ffff); this.time.delayedCall(80,()=>{ if(s&&s.clearTint) s.clearTint(); }); }
          }
        });
      }catch(e){}
    }
  }

  hitBoss(objA, objB){
    const bullet=(objA&&objA.owner==='player')?objA : (objB&&objB.owner==='player')?objB : null;
    if(!bullet||!this.boss||!this.boss.active) return;
    // Cooldown per bullet to avoid multi-hits in a single overlap streak
    const now=this.time.now;
    if(bullet._lastBossHitAt && (now - bullet._lastBossHitAt) < 120) return;
    bullet._lastBossHitAt = now;
    if(!bullet.piercing){ if(bullet.disableBody) bullet.disableBody(true,true); bullet.setActive(false).setVisible(false);} 
    const dmg=bullet.piercing?10:1;
    this.bossHp=Math.max(0,this.bossHp-dmg);
    this.updateBossHealthBar();
    // Build overcharge only from normal hits
    if(!bullet.piercing) this.addBossCharge(1);
    // If piercing, consume its remaining hit(s)
    if(bullet.piercing){
      // Impact VFX and camera punch
      try{ this.cameras.main.shake(120, 0.01); this.cameras.main.flash(120, 255, 102, 255); }catch(e){}
      const burst=this.add.particles(this.boss.x, this.boss.y, 'particle', {speed:{min:-220,max:220}, lifespan:500, scale:{start:2.2,end:0}, alpha:{start:1,end:0}, quantity:40, emitting:false, blendMode:'ADD', tint:0xff66ff});
      burst.explode(40);
      bullet.pierceHitsLeft = (bullet.pierceHitsLeft||1)-1;
      if(bullet._pierceEmitter){ try{ bullet._pierceEmitter.stop(); const mgr=bullet._pierceEmitter.manager||bullet._pierceEmitter; mgr.destroy&&mgr.destroy(); }catch(e){} bullet._pierceEmitter=null; }
      if(bullet.disableBody) bullet.disableBody(true,true); bullet.setActive(false).setVisible(false);
    }
    // Boss hit cue (slightly more present)
    if (bullet.piercing) {
      Sfx.bossHit();
      this.time.delayedCall(40, () => Sfx.bossHit());
    } else {
      Sfx.bossHit();
    }
    if(this.boss.setTint){ this.boss.setTint(0xff8888); this.time.delayedCall(80,()=>{ if(this.boss&&this.boss.active) this.boss.clearTint(); }); }
    if(this.bossHp<=0) this.killBoss();
  }

  killBoss(){
    if(!this.boss || !this.boss.active) return;
    this.boss.disableBody(true, true);
    try{ if(this.bossEyeL){ this.bossEyeL.destroy(); this.bossEyeL=null; } }catch(e){}
    try{ if(this.bossEyeR){ this.bossEyeR.destroy(); this.bossEyeR=null; } }catch(e){}
    try{ if(this.bossEyeL_outer){ this.bossEyeL_outer.destroy(); this.bossEyeL_outer=null; } }catch(e){}
    try{ if(this.bossEyeR_outer){ this.bossEyeR_outer.destroy(); this.bossEyeR_outer=null; } }catch(e){}
    try{ if(this.bossEyeL_core){ this.bossEyeL_core.destroy(); this.bossEyeL_core=null; } }catch(e){}
    try{ if(this.bossEyeR_core){ this.bossEyeR_core.destroy(); this.bossEyeR_core=null; } }catch(e){}
    const centerX = this.boss.x;
    const centerY = this.boss.y;
    // Award extra life with a clear celebration
    this.awardExtraLife();
    this.time.delayedCall(0, () => { Sfx.bossExplosion(0); this.add.particles(centerX, centerY, 'particle', {speed: 200, lifespan: 800, scale: {start: 2, end: 0}, emitting: false, blendMode: 'ADD'}).explode(40); });
    this.time.delayedCall(300, () => { Sfx.bossExplosion(1); this.add.particles(centerX + 40, centerY - 20, 'particle', {speed: 200, lifespan: 800, scale: {start: 1.8, end: 0}, emitting: false, blendMode: 'ADD'}).explode(30); });
    this.time.delayedCall(600, () => { Sfx.bossExplosion(2); this.add.particles(centerX - 40, centerY + 20, 'particle', {speed: 200, lifespan: 800, scale: {start: 1.8, end: 0}, emitting: false, blendMode: 'ADD'}).explode(30); });
    this.time.delayedCall(900, () => { Sfx.bossExplosion(3); this.add.particles(centerX, centerY, 'particle', {speed: 300, lifespan: 1000, scale: {start: 2.5, end: 0}, emitting: false, blendMode: 'ADD'}).explode(50); });
    if(this.bossHealth) this.bossHealth.clear();
    if(this.bossChargeBar) this.bossChargeBar.clear();
    this.pierceReady=false; this.bossCharge=0; this.updateBossChargeBar&&this.updateBossChargeBar();
    if(this.bossDashEmitter) this.bossDashEmitter.stop();
    this.time.delayedCall(2500, () => { this.beginNextLevel(); });
  }

  // Celebration + award for extra life on boss defeat
  awardExtraLife(){
    this.lives = (this.lives||0) + 1;
    if(this.livesText) this.livesText.setText('Lives: '+this.lives);
    // Centerpiece text
    const w=this.scale.width, h=this.scale.height;
    const txt=this.add.text(w/2, h/2, 'EXTRA LIFE!', {fontFamily:'monospace', fontSize:'44px', color:'#00ffaa'}).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: txt, scale: {from:0.7,to:1.15}, alpha:{from:0,to:1}, duration:380, ease:'Sine.Out', yoyo:true, onComplete:()=>{
      this.tweens.add({ targets: txt, alpha:0, duration:520, delay:300, onComplete:()=>txt.destroy()});
    }});
    // Confetti burst
    try{
      const colors=[0x00ffaa,0x66ffcc,0xffffff,0x99ffee];
      const p=this.add.particles(w/2, h/2, 'particle', { speed:{min:-320,max:320}, angle:{min:0,max:360}, lifespan:900, scale:{start:2.1,end:0}, quantity:80, emitting:false, blendMode:'ADD', tint: colors });
      p.explode(80);
    }catch(e){}
    // Camera flash and cheerful beeps
    try{ this.cameras.main.flash(160, 0, 255, 170); }catch(e){}
    Sfx.beep(900,0.06,'triangle',0.03); this.time.delayedCall(70,()=>Sfx.beep(1100,0.06,'triangle',0.03)); this.time.delayedCall(140,()=>Sfx.beep(1300,0.06,'triangle',0.03));
    // Brief slow-motion to let the moment land (approx ~2s real time)
    this.applySlowmo && this.applySlowmo(0.35, 700);
  }

  // ---------- Utility: temporary global slow-motion ----------
  applySlowmo(factor=0.4, durationMs=600){
    try{
      this._prevTimeScale = this.time.timeScale || 1;
      this._prevPhysTimeScale = (this.physics&&this.physics.world&&this.physics.world.timeScale)||1;
      this._prevTweenTimeScale = (this.tweens&&this.tweens.timeScale)||1;
      this._prevAnimTimeScale = (this.anims&&this.anims.globalTimeScale)||1;
      if(this.time) this.time.timeScale = factor;
      if(this.physics&&this.physics.world) this.physics.world.timeScale = factor;
      if(this.tweens) this.tweens.timeScale = factor;
      if(this.anims) this.anims.globalTimeScale = factor;
      this.time.delayedCall(durationMs, ()=>{
        try{ if(this.time) this.time.timeScale = this._prevTimeScale||1; }catch(e){}
        try{ if(this.physics&&this.physics.world) this.physics.world.timeScale = this._prevPhysTimeScale||1; }catch(e){}
        try{ if(this.tweens) this.tweens.timeScale = this._prevTweenTimeScale||1; }catch(e){}
        try{ if(this.anims) this.anims.globalTimeScale = this._prevAnimTimeScale||1; }catch(e){}
      });
    }catch(e){}
  }

  collectPowerup(player,p){
    const t=p.getData('type')||'double';
    const x=player.x, y=player.y-28;
    // Clean up visual attachments (aura emitter + label) before removing sprite
    try{ if(p._aura){ p._aura.stop&&p._aura.stop(); const em=p._aura; this.time.delayedCall(0, ()=>{ try{ em.remove&&em.remove(); }catch(e){} }); p._aura=null; } }catch(e){}
    try{ if(p._label){ p._label.destroy(); p._label=null; } }catch(e){}
    p.destroy();
    if(t==='double'){
      this.doubleUntil=Math.max(this.doubleUntil||0,this.time.now+8000);
      this.infoPopup(x,y,'DOUBLE SHOT','#00ffff');
    } else if(t==='spread'){
      this.spreadUntil=Math.max(this.spreadUntil||0,this.time.now+8000);
      this.infoPopup(x,y,'SPREAD SHOT','#ffaa00');
    } else if(t==='rapid'){
      this.rapidUntil=Math.max(this.rapidUntil||0,this.time.now+8000);
      this.infoPopup(x,y,'RAPID FIRE','#ff00ff');
    } else if(t==='shield'){
      this.shieldUntil=this.time.now+10000; this.shieldHits=1;
      this.infoPopup(x,y,'SHIELD','#00ffaa');
      // Activation flare
      try{ const ring=this.add.image(x, y, 'shock').setBlendMode('ADD').setTint(0x00ffaa).setAlpha(0.65).setScale(0.6); this.tweens.add({ targets:ring, alpha:0, scale:1.9, duration:420, ease:'Cubic.Out', onComplete:()=>ring.destroy() }); }catch(e){}
    } else if(t==='goldStar'){
      this.doubleScoreUntil=Math.max(this.doubleScoreUntil||0,this.time.now+8000);
      console.log('Gold star collected! Double score until:', this.doubleScoreUntil, 'Current time:', this.time.now);
      this.infoPopup(x,y,'DOUBLE SCORE','#ffd700');
      // More dramatic golden activation flare
      try{ 
        const ring=this.add.image(x, y, 'shock').setBlendMode('ADD').setTint(0xffd700).setAlpha(0.9).setScale(1.2); 
        this.tweens.add({ targets:ring, alpha:0, scale:3.0, duration:600, ease:'Cubic.Out', onComplete:()=>ring.destroy() }); 
        // Add multiple rings for more dramatic effect
        const ring2=this.add.image(x, y, 'shock').setBlendMode('ADD').setTint(0xffaa00).setAlpha(0.6).setScale(0.8); 
        this.tweens.add({ targets:ring2, alpha:0, scale:2.5, duration:500, ease:'Cubic.Out', onComplete:()=>ring2.destroy() }); 
      }catch(e){}
      // Ensure shield ring becomes visible immediately
      try{ if(this.shieldSprite) this.shieldSprite.setVisible(true).setScale(1).setAlpha(1); }catch(e){}
    }
    // Special sound for double score powerup
    if(t==='goldStar'){
      Sfx.powerup(); // Play the normal powerup sound
      // Add a special golden chime effect
      try{
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      }catch(e){}
    } else {
      Sfx.powerup();
    }
  }

  infoPopup(x,y,text,color='#0ff'){
    const t=this.add.text(x,y,text,{fontFamily:'monospace',fontSize:'16px',color}).setOrigin(0.5);
    this.tweens.add({targets:t,y:y-28,alpha:0,duration:700,onComplete:()=>t.destroy()});
  }

  // ---------- Game over / Restart ----------
  gameOver(message){
    if(this.isGameOver) return; this.isGameOver=true; this.player.disableBody(true,true);
    const wasHigh=this.maybeUpdateHighScore();
    const gbest = (typeof this.highGlobal==='number' && this.highGlobal>0) ? this.highGlobal : '—';
    const summary = wasHigh ?
      ('New High Score! '+this.score) :
      ('Score: '+this.score+'  Best Local: '+this.highScore+'  Best Global: '+gbest);
    // Clear live bullets and freeze/hide remaining enemies for a clean end-state
    try{ this.clearBullets && this.clearBullets(); }catch(e){}
    try{ if(this.aliens){ this.aliens.getChildren().forEach(a=>{ try{ a.disableBody&&a.disableBody(true,true); a.setVisible(false); }catch(e){} }); } }catch(e){}
    try{ if(this.boss && this.boss.active){ this.boss.disableBody(true,true); } }catch(e){}
    // Dim background and draw a panel behind the message for clarity
    try{
      if(this._gameOverDim) this._gameOverDim.destroy();
      if(this._gameOverPanel) this._gameOverPanel.destroy();
      this._gameOverDim = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000, 0.45).setDepth(998);
    }catch(e){}
    // Place text on top with a subtle panel (smaller font for readability)
    try{ this.infoText.setStyle({ fontSize:'22px' }); }catch(e){}
    this.infoText.setText(message+'\n'+summary).setDepth(1001);
    try{
      const padX=28, padY=18; const w=Math.min(760, (this.infoText.width||0)+padX); const h=(this.infoText.height||0)+padY;
      this._gameOverPanel = this.add.rectangle(this.infoText.x, this.infoText.y, w||520, h||120, 0x0b0b12, 0.88)
        .setOrigin(0.5).setDepth(1000).setStrokeStyle(1,0x00ffaa,0.85);
    }catch(e){}
    this.input.once('pointerdown',()=>this.restartGame()); Music.stop();
    // Global leaderboard submit (optional): delay to let explosions/FX play first
    this._scorePrompted = false;
    this.time.delayedCall(1100, ()=>{
      if(this._scorePrompted || this.isRestarting) return;
      // Only consider prompting if a positive score and leaderboard available
      if(this.score>0 && window.Leaderboard && typeof window.Leaderboard.getTop10==='function'){
        try{
          window.Leaderboard.getTop10().then(list=>{
            if(this._scorePrompted || this.isRestarting) return;
            const arr = Array.isArray(list)? list : [];
            // Qualify if fewer than 10 scores or score >= 10th score
            const qualifies = (arr.length<10) || (this.score >= (arr[arr.length-1]?.score||0));
            if(qualifies && this.showNameEntryOverlay){
              this._scorePrompted = true;
              this.showNameEntryOverlay();
            } else {
              // Player doesn't qualify for high score, show restart instructions
              this._scorePrompted = true;
              this.showRestartInstructions();
            }
          }).catch(()=>{
            // If leaderboard fails, show restart instructions
            if(!this._scorePrompted && !this.isRestarting){
              this._scorePrompted = true;
              this.showRestartInstructions();
            }
          });
        }catch(e){
          // If leaderboard error, show restart instructions
          if(!this._scorePrompted && !this.isRestarting){
            this._scorePrompted = true;
            this.showRestartInstructions();
          }
        }
      } else {
        // No leaderboard available or score is 0, show restart instructions
        this._scorePrompted = true;
        this.showRestartInstructions();
      }
    });
  }

  // ---------- In-game Name Entry Overlay (for leaderboard) ----------
  showNameEntryOverlay(){
    if(this._nameOverlayRoot) return;
    const w=this.scale.width, h=this.scale.height;
    const root=this.add.container(0,0).setDepth(1000);
    const dim=this.add.rectangle(w/2,h/2,w,h,0x000000,0.8).setInteractive();
    const boxW=Math.min(500, w-60), boxH=280;
    const panel=this.add.rectangle(w/2,h/2, boxW, boxH, 0x0a0a12, 0.98).setStrokeStyle(3,0x00ffaa,1);
    
    // Clean title and score display
    const title=this.add.text(w/2, h/2 - 100, 'NEW HIGH SCORE!', {fontFamily:'monospace', fontSize:'26px', color:'#00ffaa'}).setOrigin(0.5);
    const scoreText=this.add.text(w/2, h/2 - 70, `Score: ${this.score}`, {fontFamily:'monospace', fontSize:'20px', color:'#ffd700'}).setOrigin(0.5);
    const hint=this.add.text(w/2, h/2 - 40, 'Enter your name:', {fontFamily:'monospace', fontSize:'16px', color:'#ccc'}).setOrigin(0.5);
    
    // Input box visuals
    const ibW = boxW - 60, ibH = 45;
    const ibox=this.add.rectangle(w/2, h/2 - 5, ibW, ibH, 0x1a1a1a, 1).setStrokeStyle(2,0x00ffff,0.8);
    this._nameInputValue = this._nameInputValue || '';
    const nameStyle = {fontFamily:'monospace', fontSize:'20px', color:'#ffffff'};
    const nameText=this.add.text(ibox.x - ibW/2 + 15, ibox.y, this._nameInputValue||'', nameStyle).setOrigin(0,0.5);
    const caret=this.add.text(0,0,'|',{...nameStyle, color:'#00ffff'}).setOrigin(0,0.5);
    const place=this.add.text(ibox.x - ibW/2 + 15, ibox.y, 'Type your name here...',{...nameStyle, color:'#666'}).setOrigin(0,0.5);
    
    // Buttons
    const btnStyle={fontFamily:'monospace', fontSize:'18px', color:'#000'};
    const btnSubmitBg=this.add.rectangle(w/2+80, h/2+70, 140, 40, 0x00ffaa, 1).setInteractive({useHandCursor:true});
    const btnSubmitTx=this.add.text(btnSubmitBg.x, btnSubmitBg.y, 'SUBMIT', btnStyle).setOrigin(0.5);
    const btnSkipBg=this.add.rectangle(w/2-80, h/2+70, 140, 40, 0x333, 1).setStrokeStyle(2,0x888,0.8).setInteractive({useHandCursor:true});
    const btnSkipTx=this.add.text(btnSkipBg.x, btnSkipBg.y, 'SKIP', {fontFamily:'monospace', fontSize:'18px', color:'#ccc'}).setOrigin(0.5);
    
    // Add restart hint at bottom
    const restartHint=this.add.text(w/2, h/2+110, 'Press SPACE or click to restart', {fontFamily:'monospace', fontSize:'14px', color:'#888'}).setOrigin(0.5);
    
    root.add([dim,panel,title,scoreText,hint,ibox,nameText,caret,place,btnSubmitBg,btnSubmitTx,btnSkipBg,btnSkipTx,restartHint]);
    this._nameOverlayRoot=root; this._nameOverlayRefs={nameText, place, caret, ibox, btnSubmitBg, btnSkipBg};
    
    // Hide the game over text when showing name entry
    if(this.infoText) this.infoText.setVisible(false);
    if(this._gameOverPanel) this._gameOverPanel.setVisible(false);
    if(this._gameOverDim) this._gameOverDim.setVisible(false);
    // Caret position + blink
    const updateCaret=()=>{
      const txt = nameText.text||'';
      place.setVisible(txt.length===0);
      const tWidth = Math.max(0, nameText.width||0);
      const left = ibox.x - ibW/2 + 10;
      const right = ibox.x + ibW/2 - 10;
      let x = left + tWidth + 2;
      if(x > right) x = right;
      // Vertically center the caret on the input box (slight nudge for crispness)
      caret.setPosition(x, ibox.y - 1);
    };
    this.tweens.add({targets:caret, alpha:{from:1,to:0.15}, duration:420, yoyo:true, repeat:-1, ease:'Sine.InOut'});
    updateCaret();
    // Keyboard input
    const allowed=/[A-Za-z0-9 _.-]/;
    this._nameKeyHandler=(ev)=>{
      if(ev.key==='Enter') { this.submitNameEntryOverlay(); return; }
      if(ev.key==='Escape'){ this.hideNameEntryOverlay(); return; }
      if(ev.key==='Backspace'){ ev.preventDefault(); if(this._nameInputValue) this._nameInputValue=this._nameInputValue.slice(0,-1); nameText.setText(this._nameInputValue); updateCaret(); return; }
      if(ev.key && ev.key.length===1 && allowed.test(ev.key)){
        if((this._nameInputValue||'').length<24){ this._nameInputValue=(this._nameInputValue||'')+ev.key; nameText.setText(this._nameInputValue); updateCaret(); }
      }
    };
    this.input.keyboard.on('keydown', this._nameKeyHandler);
    // Pointer: focus box to hint typing
    ibox.on('pointerdown',()=>{});
    // Buttons
    btnSubmitBg.on('pointerdown',()=>this.submitNameEntryOverlay());
    btnSkipBg.on('pointerdown',()=>this.hideNameEntryOverlay());
  }

  hideNameEntryOverlay(){
    try{ if(this._nameKeyHandler) this.input.keyboard.off('keydown', this._nameKeyHandler); }catch(e){}
    this._nameKeyHandler=null;
    if(this._nameOverlayRoot){ this._nameOverlayRoot.destroy(true); this._nameOverlayRoot=null; this._nameOverlayRefs=null; }
    
    // Restore the game over text when hiding name entry
    if(this.infoText) this.infoText.setVisible(true);
    if(this._gameOverPanel) this._gameOverPanel.setVisible(true);
    if(this._gameOverDim) this._gameOverDim.setVisible(true);
  }

  submitNameEntryOverlay(){
    const raw=(this._nameInputValue||'').trim();
    if(!raw){ this.hideNameEntryOverlay(); return; }
    try{
      if(window.Leaderboard && window.Leaderboard.submitScore){
        window.Leaderboard.submitScore(raw, this.score).then(()=>{
          this.infoPopup(this.scale.width/2, this.scale.height/2 - 90, 'Submitted!', '#00ffaa');
          // After a short moment, return to Start screen automatically
          this.time.delayedCall(250, ()=>{ if(!this.isRestarting) this.restartGame(); });
        }).catch(()=>{ this.time.delayedCall(250, ()=>{ if(!this.isRestarting) this.restartGame(); }); });
      }
    }catch(e){}
    this.hideNameEntryOverlay();
  }

  showRestartInstructions(){
    // Update the game over text to include restart instructions
    if(this.infoText){
      const currentText = this.infoText.text;
      if(!currentText.includes('Click to Restart')){
        this.infoText.setText(currentText + '\nClick to Restart');
      }
    }
  }

  restartGame(){ if(this.isRestarting) return; this.isRestarting=true; try{ if(this.bossHit) this.bossHit.destroy(); }catch(e){} try{ if(this.bossEyeL){ this.bossEyeL.destroy(); this.bossEyeL=null; } }catch(e){} try{ if(this.bossEyeR){ this.bossEyeR.destroy(); this.bossEyeR=null; } }catch(e){} try{ if(this.bossEyeL_outer){ this.bossEyeL_outer.destroy(); this.bossEyeL_outer=null; } }catch(e){} try{ if(this.bossEyeR_outer){ this.bossEyeR_outer.destroy(); this.bossEyeR_outer=null; } }catch(e){} try{ if(this.bossEyeL_core){ this.bossEyeL_core.destroy(); this.bossEyeL_core=null; } }catch(e){} try{ if(this.bossEyeR_core){ this.bossEyeR_core.destroy(); this.bossEyeR_core=null; } }catch(e){} try{ if(this.bossHealth) this.bossHealth.destroy(); }catch(e){} try{ if(this.bossDashEmitter){ this.bossDashEmitter.stop&&this.bossDashEmitter.stop(); const mgr=this.bossDashEmitter.manager||this.bossDashEmitter; mgr.destroy&&mgr.destroy(); this.bossDashEmitter=null; } }catch(e){} try{ if(this.bossExhaust){ const mgr=this.bossExhaust; try{ mgr.emitters.each(e=>{ try{ e.stop&&e.stop(); e.remove&&e.remove(); }catch(_){} }); }catch(_){} mgr.destroy&&mgr.destroy(); this.bossExhaust=null; this.bossExhaustEm=null; } }catch(e){} try{ if(this.playerExhaust){ const pm=this.playerExhaust; try{ pm.emitters.each(e=>{ try{ e.stop&&e.stop(); e.remove&&e.remove(); }catch(_){} }); }catch(_){} pm.destroy&&pm.destroy(); this.playerExhaust=null; this.playerExhaustEm=null; } }catch(e){} try{ if(this.playerHeat){ const hm=this.playerHeat; try{ hm.emitters.each(e=>{ try{ e.stop&&e.stop(); e.remove&&e.remove(); }catch(_){} }); }catch(_){} hm.destroy&&hm.destroy(); this.playerHeat=null; this.playerHeatEm=null; } }catch(e){} try{ if(this.playerBeaconL){ this.playerBeaconL.destroy(); this.playerBeaconL=null; } }catch(e){} try{ if(this.playerBeaconR){ this.playerBeaconR.destroy(); this.playerBeaconR=null; } }catch(e){} try{ if(this.playerCockpitGlow){ this.playerCockpitGlow.destroy(); this.playerCockpitGlow=null; } }catch(e){} this.scene.start('StartScene'); }
  // Quick afterimage sprite for boss dashes
  spawnBossAfterimage(){ if(!this.boss || !this.boss.active) return; const img=this.add.image(this.boss.x,this.boss.y,'boss').setScale(5.2,3.8).setAlpha(0.35).setDepth(4).setTint(0xfff3a0); this.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: ()=> img.destroy() }); }

  // Quick afterimage streak for the player when moving fast
  spawnPlayerAfterimage(){
    if(!this.player || !this.player.active) return;
    try{
      const img = this.add.image(this.player.x, this.player.y, 'player')
        .setScale(this.player.scaleX||1, this.player.scaleY||1)
        .setAngle(this.player.angle||0)
        .setAlpha(0.28)
        .setDepth(4)
        .setTint(0xffb266);
      const dir = (this.player.body && this.player.body.velocity && this.player.body.velocity.x) ? Math.sign(this.player.body.velocity.x) : 0;
      const dx = dir * 14;
      this.tweens.add({ targets: img, alpha: 0, x: img.x - dx, duration: 180, ease: 'Cubic.Out', onComplete: ()=> img.destroy() });
    }catch(e){}
  }

  togglePause(){ this.isPaused=!this.isPaused; if(this.isPaused){ this.physics.world.pause(); this.infoText.setText('Paused'); } else { this.physics.world.resume(); this.infoText.setText(''); } this.postTogglePause&&this.postTogglePause(); }
  // After toggling pause above, also gate long-running emitters to avoid flicker while paused
  postTogglePause(){
    const setEmit=(mgr,on)=>{ try{ if(mgr&&mgr.emitters){ mgr.emitters.each(e=>{ if(e) e.on = on; }); } }catch(e){} };
    const on = !this.isPaused;
    setEmit(this.starFar,on); setEmit(this.starMid,on); setEmit(this.starNear,on);
    setEmit(this.bossDashEmitter,on);
    setEmit(this.bossExhaust,on);
    // Shared aura manager
    setEmit(this.powerupAura,on);
    setEmit(this.playerExhaust,on);
    setEmit(this.playerHeat,on);
    setEmit(this.playerShieldAura,on);
    setEmit(this.playerGoldenAura,on);
  }
  updateMuteText(m){ this.muteText.setText(m?'MUTED':''); }
  updateBestHudText(){
    try{
      const local = this.highScore||0;
      const g = this.highGlobal;
      const gs = (typeof g==='number' && g>0) ? g : '—';
      if(this.highText) this.highText.setText('Best Local: '+local+'    Best Global: '+gs);
    }catch(e){}
  }

  // ---------- Scoring / Combo / High score helpers ----------
  clearBullets(){
    try{
      const clean=(b)=>{ if(!b) return; if(b._pierceEmitter){ try{ b._pierceEmitter.stop(); const mgr=b._pierceEmitter.manager||b._pierceEmitter; mgr.destroy&&mgr.destroy(); }catch(e){} b._pierceEmitter=null; } if(b._trail){ try{ b._trail.stop&&b._trail.stop(); b._trail.remove&&b._trail.remove(); }catch(e){} b._trail=null; } if(b.disableBody) b.disableBody(true,true); b.setActive(false).setVisible(false); };
      if(this.playerBullets){ this.playerBullets.children.each(b=>clean(b)); }
      if(this.alienBullets){ this.alienBullets.children.each(b=>clean(b)); }
    }catch(e){}
  }
  addBossCharge(amount){
    if(!this.isBossFight || this.pierceReady) return;
    this.bossCharge = Math.min(this.bossChargeMax, (this.bossCharge||0) + (amount||0));
    if(this.bossCharge >= this.bossChargeMax){
      this.pierceReady = true;
      this.updateBossChargeBar();
      this.infoPopup(this.player.x, this.player.y-40, 'OVERCHARGED', '#ff66ff');
      Sfx.beep(1200,0.06,'square',0.035);
    } else {
      this.updateBossChargeBar();
    }
  }
  addScore(points, x, y, color){
    // Apply double score if active
    const doubleScoreActive = this.time.now < (this.doubleScoreUntil||0);
    const finalPoints = doubleScoreActive ? points * 2 : points;
    
    this.score += finalPoints;
    this.scoreText.setText('Score: '+this.score);
    if(typeof x==='number' && typeof y==='number'){
      const displayPoints = doubleScoreActive ? points * 2 : points;
      const displayColor = doubleScoreActive ? '#ffd700' : (color||'#ffee88');
      this.infoPopup(x,y,'+'+displayPoints, displayColor);
    }
    this.maybeUpdateHighScore();
  }
  maybeUpdateHighScore(){
    if(this.score>(this.highScore||0)){
      this.highScore=this.score;
      this.updateBestHudText && this.updateBestHudText();
      try{ localStorage.setItem('si_highscore', String(this.highScore)); }catch(e){}
      return true;
    }
    return false;
  }
  bumpCombo(){
    const now=this.time.now;
    if(now <= (this.comboExpireAt||0)) this.combo++; else this.combo=1;
    const prev=this.comboMult||1;
    // Mult increases every 4 kills: 1,1,1,1,2,2,2,2,3..., cap 5
    this.comboMult=Math.min(5, 1+Math.floor((this.combo-1)/4));
    this.comboExpireAt = now + 2500;
    if(this.comboText){ const t=this.comboMult>1?('COMBO x'+this.comboMult):''; this.comboText.setText(t); }
    return this.comboMult>prev;
  }
  resetCombo(){ this.combo=0; this.comboMult=1; this.comboExpireAt=0; if(this.comboText) this.comboText.setText(''); }
}

// ---------- Start Scene ----------
class StartScene extends Phaser.Scene{ constructor(){ super('StartScene'); } create(){ const w=this.scale.width,h=this.scale.height; const t={fontFamily:'monospace', color:'#fff'}; this.add.text(w/2,h/2-120,'SPACE INVADERS',{...t,fontSize:'52px',color:'#0ff'}).setOrigin(0.5); this.add.text(w/2,h/2-70,'Modern Phaser Edition',{...t,fontSize:'18px',color:'#ccc'}).setOrigin(0.5); const best=(()=>{ try{ return parseInt(localStorage.getItem('si_highscore')||'0',10)||0; }catch(e){ return 0; } })(); this.add.text(w/2,h/2-30,'Best (local): '+best,{...t,fontSize:'18px',color:'#bbb'}).setOrigin(0.5); const lbTitle=this.add.text(w/2, h/2+70, 'Global Top 10', {...t,fontSize:'18px',color:'#0ff'}).setOrigin(0.5);
const listX = Math.max(40, Math.floor(w/2 - 220));
const lbText=this.add.text(listX, lbTitle.y+26, 'Loading leaderboard...', {...t,fontSize:'14px',color:'#bbb'}).setOrigin(0,0);
 // Simple toast helper for user-visible notes
 const toast=(msg)=>{ const g=this.add.container(w/2,h-60).setDepth(2000); const bg=this.add.rectangle(0,0, Math.min(660, w-60), 34, 0x000000, 0.75).setStrokeStyle(1,0x00ffaa,0.8); const tx=this.add.text(0,0,msg,{fontFamily:'monospace',fontSize:'16px',color:'#0ff'}).setOrigin(0.5); g.add([bg,tx]); this.tweens.add({targets:g, alpha:{from:1,to:0}, duration:1400, delay:1400, onComplete:()=>g.destroy()}); };
 const renderList=(list)=>{ if(!list||!list.length){ lbText.setText('No scores yet'); lbText.setOrigin(0,0); return; } const lines=list.map((r,i)=>{ const d=r.createdAt? new Date(r.createdAt): new Date(); const ds=d.toLocaleDateString(); return `${String(i+1).padStart(2,' ')}. ${r.name.slice(0,16).padEnd(16,' ')}  ${String(r.score).padStart(6,' ')}  ${ds}`; }); lbText.setText(lines.join('\n')); lbText.setOrigin(0,0); };
 const loadOnce=()=>{ try{ if(window.Leaderboard && window.Leaderboard.getTop10){ window.Leaderboard.getTop10().then(renderList).catch(()=> lbText.setText('Leaderboard unavailable')); } else { lbText.setText('Enable leaderboard in index.html'); } }catch(e){ lbText.setText('Leaderboard unavailable'); } }; loadOnce(); // Retry shortly to catch serverTimestamp propagation
 setTimeout(()=>{ if(lbText.text.indexOf('\n')<0 && lbText.text!=='Leaderboard unavailable') loadOnce(); }, 1500);
 // Refresh Leaderboard button
 const rbx = Math.min(w-80, w/2 + 220), rby = h/2 + 70;
 const refreshBg=this.add.rectangle(rbx, rby, 120, 28, 0x0b0b12, 1)
   .setStrokeStyle(1,0x00ffaa,0.9)
   .setInteractive({useHandCursor:true});
 const refreshTx=this.add.text(rbx, rby, 'Refresh', {...t,fontSize:'14px',color:'#0ff'}).setOrigin(0.5);
 const doRefresh=()=>{ lbText.setText('Loading leaderboard...'); lbText.setOrigin(0.5); loadOnce(); };
 refreshBg.on('pointerdown', (pointer, lx, ly, event)=>{ if(event&&event.stopPropagation) event.stopPropagation(); doRefresh(); });
 refreshBg.on('pointerover',()=>{ refreshBg.setFillStyle(0x111522,1); });
 refreshBg.on('pointerout',()=>{ refreshBg.setFillStyle(0x0b0b12,1); });
 // If leaderboard is disabled, show a one-time toast explaining why (dev helper)
 try{
   if(!(window.Leaderboard) || (window.LeaderboardDisabledReason)){
     const reason = window.LeaderboardDisabledReason||'not_initialized';
     if(reason==='no_config') toast('Leaderboard disabled: missing FIREBASE_CONFIG.');
     else if(reason==='auth_failed') toast('Leaderboard auth failed. Enable Anonymous Auth.');
     else if(reason==='init_failed') toast('Leaderboard init failed. Check App Check/site key.');
     else toast('Leaderboard not available.');
   }
 }catch(e){}
 this.add.text(w/2,h/2+10,'Press SPACE or TAP to start',{...t,fontSize:'18px'}).setOrigin(0.5); this.add.text(w/2,h/2+40,'Controls: <- -> move, Space fire, P pause, M mute',{...t,fontSize:'16px',color:'#bbb'}).setOrigin(0.5); this.input.keyboard.once('keydown-SPACE',()=>this.scene.start('GameScene')); this.input.once('pointerdown',()=>this.scene.start('GameScene')); } }

// ---------- Phaser Boot ----------
const config={ type:Phaser.AUTO, width:800, height:600, backgroundColor:'#000', physics:{ default:'arcade', arcade:{ gravity:{y:0}, debug:false } }, pixelArt:false, antialias:true, antialiasGL:true, scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH }, scene:[StartScene, GameScene] };
new Phaser.Game(config);
