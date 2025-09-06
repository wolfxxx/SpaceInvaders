// Modern Space Invaders — rebuilt compact version (gameplay restored)
// Notes: One-file game logic to keep changes traceable. No external assets.

// ---------- Lightweight SFX + Music ----------
const Sfx = (() => {
  let ac, musicGain, muted = false;
  function ctx(){ ac = ac || new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended') ac.resume(); return ac; }
  function beep(f=800, d=0.08, type='square', g=0.03){ if(muted) return; try{ const a=ctx(), o=a.createOscillator(), t=a.createGain(); o.type=type; o.frequency.value=f; const t0=a.currentTime; t.gain.setValueAtTime(g,t0); t.gain.exponentialRampToValueAtTime(0.0001,t0+d); o.connect(t).connect(a.destination); o.start(t0); o.stop(t0+d); }catch(e){} }
  function explosion(){ if(muted) return; try{ const a=ctx(); const n=a.createBufferSource(); const len=a.sampleRate*0.3|0, buf=a.createBuffer(1,len,a.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2); n.buffer=buf; const g=a.createGain(); g.gain.value=.1; n.connect(g).connect(a.destination); n.start(); }catch(e){} }
  function laser(){ beep(1400,0.06,'sawtooth',0.04); }
  function playerExplosion(){ if(muted) return; try { const a = ctx(); const n = a.createBufferSource(); const len = a.sampleRate * 0.6 | 0; const buf = a.createBuffer(1, len, a.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < len; i++) { d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.5); } n.buffer = buf; const g = a.createGain(); g.gain.setValueAtTime(0.4, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.6); const filter = a.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(1200, a.currentTime); filter.frequency.exponentialRampToValueAtTime(100, a.currentTime + 0.6); filter.Q.value = 1; n.connect(filter).connect(g).connect(a.destination); n.start(); const o = a.createOscillator(); const g2 = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(120, a.currentTime); o.frequency.exponentialRampToValueAtTime(40, a.currentTime + 0.3); g2.gain.setValueAtTime(0.2, a.currentTime); g2.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.3); o.connect(g2).connect(a.destination); o.start(); o.stop(a.currentTime + 0.3); } catch(e) {} }
  function setMuted(v){ muted=!!v; }
  function toggle(){ muted=!muted; return muted; }
  function isMuted(){ return muted; }
  return { beep, explosion, laser, playerExplosion, setMuted, toggle, isMuted };
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
    // Neon ship (nose + wings + cockpit)
    mk('player',g=>{ g.clear(); g.fillStyle(0x39ff14); g.fillTriangle(16,2, 8,14, 24,14); g.fillStyle(0x00ff88); g.fillTriangle(8,14, 4,30, 12,30); g.fillTriangle(24,14, 20,30, 28,30); g.fillStyle(0xffff66); g.fillRect(15,10,2,6); });
    mk('bullet',g=>{ g.fillStyle(0x00ffff); g.fillRect(14,0,4,18); });
    mk('alien1',g=>{ g.fillStyle(0x00ffff); g.fillRect(6,8,20,16); g.fillRect(4,24,8,4); g.fillRect(20,24,8,4); });
    mk('alien2',g=>{ g.fillStyle(0xffff66); g.fillRect(4,8,24,16); g.fillRect(0,12,4,8); g.fillRect(28,12,4,8); });
    mk('alien3',g=>{ g.fillStyle(0x8844ff); g.fillCircle(16,16,12); g.fillRect(8,28,16,4); });
    mk('particle',g=>{ g.fillStyle(0xffd700); g.fillRect(0,0,4,4); });
    // Powerup: distinctive neon orb with ring to avoid alien-like shapes
    mk('powerup',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.lineStyle(3,0xffffff,0.8); g.strokeCircle(16,16,9); g.fillStyle(0xffffff,1); g.fillCircle(16,16,5); g.lineStyle(1,0xffffff,0.6); g.strokeCircle(16,16,12); });
    mk('shieldBlock',g=>{ g.fillStyle(0x00aa00); g.fillRect(0,0,12,8); });
    mk('shieldRing',g=>{ g.lineStyle(2,0x00ffaa,1); g.strokeCircle(16,16,14); });
    mk('boss',g=>{ g.fillStyle(0x222222); g.fillRect(0,0,32,16); g.fillStyle(0xff4444); g.fillRect(2,2,28,12); g.fillStyle(0xffff00); g.fillRect(8,6,16,4); });
    mk('bossBullet',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.fillStyle(0xffaa00); g.fillCircle(16,16,6); });
    // Dedicated alien bullet sprite (small opaque amber orb, no halo)
    mk('alienBullet',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.fillStyle(0xffaa00,1); g.fillCircle(16,16,4); });
    mk('pierceBullet',g=>{ g.clear(); g.fillStyle(0x000000,0); g.fillRect(0,0,32,32); g.lineStyle(3,0xff66ff,1); g.strokeCircle(16,12,8); g.fillStyle(0xffb3ff,1); g.fillCircle(16,12,4); g.lineStyle(1,0xffffff,0.6); g.strokeCircle(16,12,12); });
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

    // HUD
    const f={ fontFamily:'monospace', fontSize:'18px', color:'#fff' };
    this.score=0; this.lives=3; this.level=1; this.combo=0; this.comboMult=1;
    // High score persistence
    try{ this.highScore=parseInt(localStorage.getItem('si_highscore')||'0',10)||0; }catch(e){ this.highScore=0; }
    this.scoreText=this.add.text(16,12,'Score: 0',f);
    this.livesText=this.add.text(680,12,'Lives: 3',f);
    this.levelText=this.add.text(400,12,'Level: 1',{...f}).setOrigin(0.5,0);
    // High score shown under level
    this.highText=this.add.text(400,32,'Best: '+this.highScore,{...f,fontSize:'16px',color:'#bbb'}).setOrigin(0.5,0);
    // Combo HUD near score
    this.comboText=this.add.text(16,34,'', {...f, fontSize:'16px', color:'#0ff'});
    this.infoText=this.add.text(400,300,'',{...f,fontSize:'28px'}).setOrigin(0.5);
    this.muteText=this.add.text(780,12,'',f).setOrigin(1,0).setAlpha(0.8);
    // Piercing ready HUD tag (shown during boss only)
    this.pierceReadyText=this.add.text(16,52,'', {...f, fontSize:'16px', color:'#ff66ff'});
    this.updateMuteText(Sfx.isMuted());

    // Visuals
    // Regenerate shields each level; boss gets a minimal bunker
    if(this.level%3!==0) this.createShields(); else this.createBossShields();
    // Player shield visual
    this.shieldSprite=this.add.image(this.player.x,this.player.y,'shieldRing').setVisible(false).setDepth(3);
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

  // ---------- Stars ----------
  initStars(){
    const add=(tint,speed,lifespan,qty)=> this.add.particles(0,0,'particle',{
      x:{min:0,max:800}, y:0, lifespan, speedY:{min:speed*0.6,max:speed}, scale:{start:0.6,end:0}, alpha:{start:0.3,end:0}, quantity:qty, tint, blendMode:'ADD' });
    this.starFar=add(0x99ffff,18,6000,2);
    this.starMid=add(0x55ffff,40,4500,2);
    this.starNear=add(0x11ffff,90,3200,2);
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
    this.boss=this.physics.add.sprite(400,140,'boss').setImmovable(true).setDepth(5);
    this.boss.setScale(4,3); if(this.boss.body&&this.boss.body.setSize) this.boss.body.setSize(120,70,true);
    this.bossHp=Math.floor(60*(1+(this.level-1)*0.25)); this.bossMaxHp=this.bossHp;
    // Core movement params
    this.bossHomeY = 140; // ensure defined to avoid NaN Y
    this.bossMinX=60; this.bossMaxX=740; this.bossSpeedX=110; this.bossMoveDir=1; this.bossStartAt=this.time.now; this.bossPhase=0; this.bossBulletSpeedBase=260; this.bossFireScale=1.0;
    // Dash system (occasional speed bursts without teleporting)
    this._bossDashing = false;
    this.bossDashMult = 2.1; // speed multiplier during dash
    this.bossDashUntil = 0;
    this.bossNextDashAt = this.time.now + Phaser.Math.Between(2200, 5200);
    this.bossHealth=this.add.graphics(); this.updateBossHealthBar();
    // Overcharge (piercing) meter for boss fights
    this.bossCharge=0; this.bossChargeMax=12; this.pierceReady=false;
    this.bossChargeBar=this.add.graphics(); this.updateBossChargeBar();
    this.bossHit=this.add.rectangle(this.boss.x,this.boss.y,120,70,0x00ff00,0); this.physics.add.existing(this.bossHit,true);
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
    this.infoText.setText('Level Complete!');
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
    if(this.shieldSprite) this.shieldSprite.setVisible(false);
    this.doubleUntil=0; this.spreadUntil=0; this.rapidUntil=0; this.shieldUntil=0; this.shieldHits=0;
    // Reset firing cadence
    this.lastFired=0;
    // Remove old boss artifacts if any
    try{ if(this.bossHit){ this.bossHit.destroy(); this.bossHit=null; } }catch(e){}
    try{ if(this.bossHealth){ this.bossHealth.clear(); } }catch(e){}
    try{ if(this.bossChargeBar){ this.bossChargeBar.clear(); } }catch(e){}
    this.pierceReady=false; this.bossCharge=0;
    try{ if(this.bossDashEmitter){ this.bossDashEmitter.stop&&this.bossDashEmitter.stop(); const mgr=this.bossDashEmitter.manager||this.bossDashEmitter; mgr.destroy&&mgr.destroy(); this.bossDashEmitter=null; } }catch(e){}
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
      this.player.setVelocityX( (left&&!right)?-300 : (right&&!left)?300 : 0 );
    } else {
      try{ this.player.setVelocity(0,0); }catch(e){}
    }
    // Keep shield sprite aligned
    if(this.shieldSprite) this.shieldSprite.setPosition(this.player.x,this.player.y).setVisible((this.shieldHits||0)>0 && (this.time.now<(this.shieldUntil||0)));
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
          L.fire(this.player.x-18, baseY, -620, 'bullet'); L.owner='player'; L.passShieldUntil=this.time.now+300;
          R.fire(this.player.x+18, baseY, -620, 'bullet'); R.owner='player'; R.passShieldUntil=this.time.now+300;
          // Apply pierce to the first available muzzle
          tryApplyPierce(L); tryApplyPierce(R);
          fired+=2;
        } else if(pair.length===1){
          const b=pair[0];
          // Fallback: alternate single muzzle if pool somehow constrained
          this._muzzleRightFirst=!this._muzzleRightFirst; const x=this._muzzleRightFirst?this.player.x+18:this.player.x-18;
          b.fire(x, baseY, -620, 'bullet'); b.owner='player'; b.passShieldUntil=this.time.now+300; tryApplyPierce(b); fired++;
        }
      } else {
        const b=this.allocBulletUnique(used); if(b){ b.fire(this.player.x, baseY, -600, 'bullet'); b.owner='player'; b.passShieldUntil=this.time.now+300; tryApplyPierce(b); fired++; }
      }
      // Spread pair (ensure two distinct bullets like double-shot)
      if(spread){
        const pair = this.twoFreshBullets(used);
        if(pair.length>=2){
          let [l2,r2]=pair;
          if(l2===r2){ r2=this.playerBullets.create(0,0,'bullet'); }
          l2.fire(this.player.x-16, baseY+4, -600,'bullet'); l2.owner='player'; l2.setVelocityX(-200); l2.passShieldUntil=this.time.now+450;
          r2.fire(this.player.x+16, baseY+4, -600,'bullet'); r2.owner='player'; r2.setVelocityX(200);  r2.passShieldUntil=this.time.now+450;
          tryApplyPierce(l2); tryApplyPierce(r2);
          fired+=2;
        } else if(pair.length===1){
          // Fallback: alternate which angled side gets the single slot
          this._spreadRightFirst = !this._spreadRightFirst;
          const b = pair[0];
          const xoff = this._spreadRightFirst ? 16 : -16;
          const vx   = this._spreadRightFirst ? 200 : -200;
          b.fire(this.player.x + xoff, baseY+4, -600,'bullet'); b.owner='player'; b.setVelocityX(vx); b.passShieldUntil=this.time.now+450; tryApplyPierce(b); fired++;
        }
      }
      if(fired>0){ Sfx.beep(900,0.06,'square',0.03); this.lastFired = time + fireDelay; }
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
      }
      if(this._bossDashing && time > this.bossDashUntil){
        this._bossDashing = false;
      }
      const dashMul = this._bossDashing ? this.bossDashMult : 1.0;
      this.boss.x += (this.bossSpeedX*dashMul*(delta/1000))*this.bossMoveDir;
      if(this.boss.x>=this.bossMaxX){ this.boss.x=this.bossMaxX; this.bossMoveDir=-1; }
      if(this.boss.x<=this.bossMinX){ this.boss.x=this.bossMinX; this.bossMoveDir=1; }
      // Ensure visible/active
      if(!this.boss.visible) this.boss.setVisible(true);
      if(!this.boss.active) this.boss.setActive(true);
      if(this.bossHit){ this.bossHit.setPosition(this.boss.x,this.boss.y); if(this.bossHit.body&&this.bossHit.body.updateFromGameObject) this.bossHit.body.updateFromGameObject(); }
      // Fire
      if(time>(this.bossFireTimer||0)){
        const pattern=(Math.floor(time/2000)%2);
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
      this.infoPopup(alien.x, alien.y-10, 'HIT', '#ffaaaa');
      this.time.delayedCall(120,()=>alien.clearTint());
      return;
    }
    // Kill
    alien.disableBody(true,true);
    // Combo bump then score with multiplier
    const prevMult=this.comboMult;
    this.bumpCombo();
    const base=10; const pts=base*this.comboMult;
    this.addScore(pts, alien.x, alien.y-12, '#ffee88');
    if(this.comboMult>prevMult){ this.infoPopup(alien.x, alien.y-28, 'x'+this.comboMult, '#ffdd55'); }
    const p=this.add.particles(alien.x,alien.y,'particle',{speed:{min:-100,max:100}, lifespan:400, scale:{start:1,end:0}, emitting:false, blendMode:'ADD'}); p.explode(20);
    Sfx.explosion();
    if(Math.random()<0.14) this.dropPowerup(alien.x, alien.y);
    if(this.aliens.countActive(true)===0) this.beginNextLevel();
  }
  
  // Drop power-ups sometimes
  dropPowerup(x,y){
    const tRand=Math.random(); let type='double';
    if(tRand<0.25) type='spread'; else if(tRand<0.5) type='rapid'; else if(tRand<0.65) type='shield';
    const p=this.powerups.create(x,y,'powerup');
    p.setVelocity(0, Phaser.Math.Between(140,180));
    p.setBounce(0).setCollideWorldBounds(false);
    p.setData('type', type);
    const tintMap={double:0x00ffff, spread:0xffaa00, rapid:0xff00ff, shield:0x00ffaa};
    const tint=tintMap[type]||0xffffff;
    p.setTint(tint);
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
    if((this.shieldHits||0)>0 && this.time.now < (this.shieldUntil||0)){ this.shieldHits--; this.burst(player.x,player.y,'particle',{speed:{min:-120,max:120},lifespan:300,scale:{start:1,end:0}},18,500); Sfx.beep(500,0.08,'triangle',0.03); this.playerInvincibleUntil=this.time.now+300; if(this.shieldHits<=0 && this.shieldSprite) this.shieldSprite.setVisible(false); return; }
    // Real hit: reset combo
    this.resetCombo();
    this.lives--; this.livesText.setText('Lives: '+this.lives); this.burst(player.x,player.y,'particle',{speed:200, lifespan:600, scale:{start:1.4,end:0}},30,800); Sfx.playerExplosion(); if(this.lives>0){ player.disableBody(true,true); this.time.delayedCall(900,()=>{ player.enableBody(true,400,550,true,true); this.playerInvincibleUntil=this.time.now+1500; player.setAlpha(0.35);             this.tweens.add({targets:player, alpha:{from:0.35,to:1}, yoyo:true, duration:120, repeat:10, onComplete:()=>{ player.setAlpha(1.0); }}); }); } else this.gameOver('You have been defeated!'); }

  hitShield(bullet, block){
    if(!block||!block.active) return;
    // Let freshly fired player bullets pass for a brief window
    if(bullet.owner==='player' && bullet.passShieldUntil && this.time.now<bullet.passShieldUntil) return;
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
      Sfx.beep(1400, 0.06, 'triangle', 0.035);
      this.time.delayedCall(40, () => Sfx.beep(900, 0.04, 'triangle', 0.02));
    } else {
      Sfx.beep(820, 0.045, 'triangle', 0.03);
      this.time.delayedCall(35, () => Sfx.beep(1000, 0.03, 'triangle', 0.02));
    }
    if(this.boss.setTint){ this.boss.setTint(0xff8888); this.time.delayedCall(80,()=>{ if(this.boss&&this.boss.active) this.boss.clearTint(); }); }
    if(this.bossHp<=0) this.killBoss();
  }

  killBoss(){
    if(!this.boss || !this.boss.active) return;
    this.boss.disableBody(true, true);
    const centerX = this.boss.x;
    const centerY = this.boss.y;
    // Award extra life with a clear celebration
    this.awardExtraLife();
    this.time.delayedCall(0, () => { Sfx.explosion(); this.add.particles(centerX, centerY, 'particle', {speed: 200, lifespan: 800, scale: {start: 2, end: 0}, emitting: false, blendMode: 'ADD'}).explode(40); });
    this.time.delayedCall(300, () => { Sfx.explosion(); this.add.particles(centerX + 40, centerY - 20, 'particle', {speed: 200, lifespan: 800, scale: {start: 1.8, end: 0}, emitting: false, blendMode: 'ADD'}).explode(30); });
    this.time.delayedCall(600, () => { Sfx.explosion(); this.add.particles(centerX - 40, centerY + 20, 'particle', {speed: 200, lifespan: 800, scale: {start: 1.8, end: 0}, emitting: false, blendMode: 'ADD'}).explode(30); });
    this.time.delayedCall(900, () => { Sfx.playerExplosion(); this.add.particles(centerX, centerY, 'particle', {speed: 300, lifespan: 1000, scale: {start: 2.5, end: 0}, emitting: false, blendMode: 'ADD'}).explode(50); });
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
    }
    Sfx.beep(1000,0.06,'square',0.03);
  }

  infoPopup(x,y,text,color='#0ff'){
    const t=this.add.text(x,y,text,{fontFamily:'monospace',fontSize:'16px',color}).setOrigin(0.5);
    this.tweens.add({targets:t,y:y-28,alpha:0,duration:700,onComplete:()=>t.destroy()});
  }

  // ---------- Game over / Restart ----------
  gameOver(message){
    if(this.isGameOver) return; this.isGameOver=true; this.player.disableBody(true,true);
    const wasHigh=this.maybeUpdateHighScore();
    const summary = wasHigh ? 'New High Score! '+this.score : 'Score: '+this.score+'  Best: '+this.highScore;
    this.infoText.setText(message+'\n'+summary+'\nClick to Restart');
    this.input.once('pointerdown',()=>this.restartGame()); Music.stop();
    // Global leaderboard submit (optional): delay to let explosions/FX play first
    this._scorePrompted = false;
    this.time.delayedCall(1100, ()=>{
      if(this._scorePrompted || this.isRestarting) return;
      this._scorePrompted = true;
      // Prefer a custom in-game name entry overlay over a blocking prompt
      if(window.Leaderboard && typeof window.Leaderboard.submitScore==='function'){
        this.showNameEntryOverlay && this.showNameEntryOverlay();
      }
    });
  }

  // ---------- In-game Name Entry Overlay (for leaderboard) ----------
  showNameEntryOverlay(){
    if(this._nameOverlayRoot) return;
    const w=this.scale.width, h=this.scale.height;
    const root=this.add.container(0,0).setDepth(1000);
    const dim=this.add.rectangle(w/2,h/2,w,h,0x000000,0.6).setInteractive();
    const boxW=Math.min(560, w-80), boxH=240;
    const panel=this.add.rectangle(w/2,h/2, boxW, boxH, 0x101018, 0.96).setStrokeStyle(2,0x00ffaa,0.9);
    const title=this.add.text(w/2, h/2 - 80, 'SUBMIT SCORE', {fontFamily:'monospace', fontSize:'24px', color:'#00ffaa'}).setOrigin(0.5);
    const hint=this.add.text(w/2, h/2 - 50, 'Enter your name (max 24):', {fontFamily:'monospace', fontSize:'16px', color:'#bbb'}).setOrigin(0.5);
    // Input box visuals
    const ibW = boxW - 80, ibH = 40;
    const ibox=this.add.rectangle(w/2, h/2 - 5, ibW, ibH, 0x0b0b12, 1).setStrokeStyle(1,0x00ffff,0.7);
    this._nameInputValue = this._nameInputValue || '';
    const nameStyle = {fontFamily:'monospace', fontSize:'22px', color:'#ffffff'};
    const nameText=this.add.text(ibox.x - ibW/2 + 10, ibox.y, this._nameInputValue||'', nameStyle).setOrigin(0,0.5);
    const caret=this.add.text(0,0,'|',{...nameStyle, color:'#00ffff'}).setOrigin(0,0.5);
    const place=this.add.text(ibox.x - ibW/2 + 10, ibox.y, 'YOUR NAME',{...nameStyle, color:'#666'}).setOrigin(0,0.5);
    // Buttons
    const btnStyle={fontFamily:'monospace', fontSize:'18px', color:'#000'};
    const btnSubmitBg=this.add.rectangle(w/2+90, h/2+55, 120, 34, 0x00ffaa, 1).setInteractive({useHandCursor:true});
    const btnSubmitTx=this.add.text(btnSubmitBg.x, btnSubmitBg.y, 'SUBMIT', btnStyle).setOrigin(0.5);
    const btnSkipBg=this.add.rectangle(w/2-90, h/2+55, 120, 34, 0x222, 1).setStrokeStyle(1,0x888,0.8).setInteractive({useHandCursor:true});
    const btnSkipTx=this.add.text(btnSkipBg.x, btnSkipBg.y, 'SKIP', {fontFamily:'monospace', fontSize:'18px', color:'#ccc'}).setOrigin(0.5);
    root.add([dim,panel,title,hint,ibox,nameText,caret,place,btnSubmitBg,btnSubmitTx,btnSkipBg,btnSkipTx]);
    this._nameOverlayRoot=root; this._nameOverlayRefs={nameText, place, caret, ibox, btnSubmitBg, btnSkipBg};
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
  restartGame(){ if(this.isRestarting) return; this.isRestarting=true; try{ if(this.bossHit) this.bossHit.destroy(); }catch(e){} try{ if(this.bossHealth) this.bossHealth.destroy(); }catch(e){} try{ if(this.bossDashEmitter){ this.bossDashEmitter.stop&&this.bossDashEmitter.stop(); const mgr=this.bossDashEmitter.manager||this.bossDashEmitter; mgr.destroy&&mgr.destroy(); this.bossDashEmitter=null; } }catch(e){} this.scene.start('StartScene'); }
  // Quick afterimage sprite for boss dashes
  spawnBossAfterimage(){ if(!this.boss || !this.boss.active) return; const img=this.add.image(this.boss.x,this.boss.y,'boss').setScale(4,3).setAlpha(0.35).setDepth(4).setTint(0xfff3a0); this.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: ()=> img.destroy() }); }

  togglePause(){ this.isPaused=!this.isPaused; if(this.isPaused){ this.physics.world.pause(); this.infoText.setText('Paused'); } else { this.physics.world.resume(); this.infoText.setText(''); } this.postTogglePause&&this.postTogglePause(); }
  // After toggling pause above, also gate long-running emitters to avoid flicker while paused
  postTogglePause(){
    const setEmit=(mgr,on)=>{ try{ if(mgr&&mgr.emitters){ mgr.emitters.each(e=>{ if(e) e.on = on; }); } }catch(e){} };
    const on = !this.isPaused;
    setEmit(this.starFar,on); setEmit(this.starMid,on); setEmit(this.starNear,on);
    setEmit(this.bossDashEmitter,on);
    // Shared aura manager
    setEmit(this.powerupAura,on);
  }
  updateMuteText(m){ this.muteText.setText(m?'MUTED':''); }

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
    this.score += points;
    this.scoreText.setText('Score: '+this.score);
    if(typeof x==='number' && typeof y==='number'){
      this.infoPopup(x,y,'+'+points, color||'#ffee88');
    }
    this.maybeUpdateHighScore();
  }
  maybeUpdateHighScore(){
    if(this.score>(this.highScore||0)){
      this.highScore=this.score;
      if(this.highText) this.highText.setText('Best: '+this.highScore);
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
const config={ type:Phaser.AUTO, width:800, height:600, backgroundColor:'#000', physics:{ default:'arcade', arcade:{ gravity:{y:0}, debug:false } }, pixelArt:true, scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH }, scene:[StartScene, GameScene] };
new Phaser.Game(config);

