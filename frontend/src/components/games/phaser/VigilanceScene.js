import Phaser from 'phaser';

class VigilanceScene extends Phaser.Scene {
  constructor() {
    super('VigilanceScene');
  }

  init(data) {
    this.onGameEnd = data.onGameEnd || (() => {});
  }

  create() {
    // --- LIMPIEZA TOTAL ---
    this.time.removeAllEvents();
    this.tweens.killAll();

    // --- VARIABLES ---
    this.gameCompleted = false;
    this.objects = [];
    this.totalTargets = 8;          
    this.numDistractors = 45;       
    this.timeLimitMs = 90000; 
    this.targetsFound = 0;
    this.falseAlarms = 0;
    this.firstTargetTime = null;
    this.realStartTime = Date.now(); 

    // --- FONDO SUBMARINO ---
    this.cameras.main.setBackgroundColor('#001e40'); // Azul profundo
    this._createBubbles(); // En vez de estrellas
    this._createHUD();
    this._spawnObjects();

    // --- TIMER MAESTRO ---
    this.mainTimer = this.time.delayedCall(this.timeLimitMs, () => {
        this._endGame('time_up');
    });

    // --- TIMER UI ---
    this.textUpdateTimer = this.time.addEvent({
      delay: 100, loop: true,
      callback: () => {
        if (this.gameCompleted) return;
        const progress = this.mainTimer.getProgress();
        const remainingMs = this.timeLimitMs - (this.timeLimitMs * progress);
        if (this.timerText && this.timerText.active) {
            this.timerText.setText(`Oxígeno: ${(remainingMs / 1000).toFixed(0)}s`);
        }
      }
    });
  }

  _createBubbles() {
    const g = this.add.graphics();
    // Rayos de luz solar desde arriba
    g.fillGradientStyle(0x006994, 0x006994, 0x001e40, 0x001e40, 0.3);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    // Burbujas
    for (let i = 0; i < 50; i++) {
        const x = Phaser.Math.Between(0, this.scale.width);
        const y = Phaser.Math.Between(0, this.scale.height);
        const r = Phaser.Math.Between(2, 6);
        const bubble = this.add.circle(x, y, r, 0x88ccff, 0.4);
        
        this.tweens.add({
            targets: bubble,
            y: y - 100,
            alpha: 0,
            duration: Phaser.Math.Between(2000, 5000),
            loop: -1
        });
    }
  }

  _createHUD() {
    this.add.text(this.scale.width / 2, 30, 'BUSCA LOS TESOROS DORADOS', { fontFamily: 'Arial', fontSize: '24px', color: '#ffd700', fontStyle:'bold' }).setOrigin(0.5);
    this.timerText = this.add.text(20, 20, 'Oxígeno: 90s', { fontSize: '20px', color: '#fff' });
    this.targetsText = this.add.text(20, 50, `Tesoros: 0 / ${this.totalTargets}`, { fontSize: '20px', color: '#4ade80' });
  }

  _spawnObjects() {
    const margin = 60;
    const getPos = () => ({ x: Phaser.Math.Between(margin, 740), y: Phaser.Math.Between(100, 540) });
    
    // --- DISTRACTORES (PECES/ALGAS) ---
    for (let i = 0; i < this.numDistractors; i++) {
      const pos = getPos();
      // Dibujamos peces simples con gráficos
      const fishContainer = this.add.container(pos.x, pos.y);
      const body = this.add.ellipse(0, 0, 30, 15, 0x2e8b57); // Verde alga
      const tail = this.add.triangle(-15, 0, -25, -10, -25, 10, 0x2e8b57);
      fishContainer.add([tail, body]);
      
      fishContainer.setSize(40, 20);
      fishContainer.setInteractive();
      fishContainer.isTarget = false;
      fishContainer.on('pointerdown', () => this._handleClick(fishContainer));
      
      // Animación de nado suave
      this.tweens.add({
          targets: fishContainer,
          x: pos.x + Phaser.Math.Between(-30, 30),
          duration: Phaser.Math.Between(2000, 4000),
          yoyo: true, loop: -1, ease: 'Sine.easeInOut'
      });
      this.objects.push(fishContainer);
    }

    // --- OBJETIVOS (TESOROS/MONEDAS) ---
    for (let i = 0; i < this.totalTargets; i++) {
      const pos = getPos();
      const coin = this.add.star(pos.x, pos.y, 5, 8, 16, 0xffd700); // Estrella dorada
      coin.setStrokeStyle(2, 0xffffff);
      
      coin.setInteractive();
      coin.isTarget = true;
      coin.on('pointerdown', () => this._handleClick(coin));
      
      // Brillo del tesoro
      this.tweens.add({
          targets: coin, angle: 360, duration: 6000, loop: -1
      });
      this.objects.push(coin);
    }
  }

  _handleClick(obj) {
    if (this.gameCompleted) return;
    const reactionTime = Date.now() - this.realStartTime;
    
    if (obj.isTarget) {
        // --- ACIERTO ---
        if(obj.collected) return;
        obj.collected = true;
        this.targetsFound++;
        if (this.firstTargetTime === null) this.firstTargetTime = reactionTime;
        
        this.targetsText.setText(`Tesoros: ${this.targetsFound}/${this.totalTargets}`);
        
        // Animación de recolección
        this.tweens.add({targets: obj, scale: 2, alpha: 0, duration: 300, onComplete: () => obj.destroy()});
        
        // Sonido visual
        const text = this.add.text(obj.x, obj.y, "+100", { color: '#ffd700', fontSize:'20px' }).setOrigin(0.5);
        this.tweens.add({targets: text, y: obj.y-50, alpha:0, duration: 800});

        if(this.targetsFound >= this.totalTargets) this._endGame('win');
    } else {
        // --- ERROR ---
        this.falseAlarms++;
        this.cameras.main.shake(100, 0.01);
        obj.setAlpha(0.5); // Desactivar visualmente el pez erróneo
    }
  }

  _endGame(reason) {
    if (this.gameCompleted) return;
    this.gameCompleted = true;
    this.time.removeAllEvents();

    const totalTime = Date.now() - this.realStartTime;
    const omissions = this.totalTargets - this.targetsFound;
    const accuracy = this.totalTargets > 0 ? this.targetsFound / this.totalTargets : 0;
    
    let score = 100 - (omissions * 10) - (this.falseAlarms * 5);
    score = Math.max(0, Math.min(100, Math.round(score)));

    const payload = { 
        score: score, // ¡CORRECCIÓN CRÍTICA!
        detailed_metrics: { 
            vigilance_specific: { accuracy: accuracy, total_time_ms: totalTime },
            omission_errors: omissions,
            commission_errors: this.falseAlarms,
            reaction_time_avg: this.firstTargetTime || 0
        } 
    };

    this.time.delayedCall(500, () => {
        try { this.onGameEnd(payload); } catch (e) { console.error(e); }
        this.scene.stop();
    });
  }
}

export default VigilanceScene;