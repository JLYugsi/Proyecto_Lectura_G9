import Phaser from 'phaser';

class TMTScene extends Phaser.Scene {
  constructor() {
    super('TMTScene');
  }

  init(data) {
    this.onGameEnd = data.onGameEnd || (() => { });
  }

  create() {
    // --- ESTADO INTERNO ---
    this.liveScore = 0;

    this.nodes = [];
    this.lineGraphics = this.add.graphics();
    this.currentIndex = 0;
    this.sequenceErrors = 0;
    this.reactionTimes = [];
    this.gameCompleted = false;
    this.totalNodes = 10; // Reducido a 10 para niños (menos frustrante)
    // --- LIMPIEZA TOTAL (evita timers duplicados si re-entras) ---
    this.time.removeAllEvents();
    this.tweens.killAll();

    // ✅ TIEMPO REAL (se resetea siempre)
    this.startTimeMs = Date.now();
    this.lastClickTimeMs = this.startTimeMs;


    // --- VISUALES: ESPACIO PROFUNDO ---
    this.cameras.main.setBackgroundColor('#050b14'); // Azul muy oscuro
    this._createDeepSpace();

    // --- HUD ---
    this._createHUD();

    // --- GENERAR NODOS (ESTRELLAS) ---
    this._createNodes();

    // --- TIMER ---
    this.time.addEvent({
      delay: 100, loop: true,
      callback: () => {
        if (this.gameCompleted) return;
        const elapsedMs = Date.now() - this.startTimeMs;
        this.timerText.setText(`Tiempo: ${(elapsedMs / 1000).toFixed(1)} s`);

      }
    });
  }

  _createDeepSpace() {
    // Nebulosa de fondo
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x1a237e, 0x0d47a1, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    // Estrellas parpadeantes
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      const size = Phaser.Math.FloatBetween(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));

      this.tweens.add({
        targets: star, alpha: 1, scale: 1.5,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true, repeat: -1
      });
    }
  }

  _createHUD() {
    this.add.text(this.scale.width / 2, 40, 'CONECTA LAS ESTRELLAS EN ORDEN (1 → 2 → 3...)',
      { fontFamily: 'Arial', fontSize: '22px', color: '#ffd700', fontStyle: 'bold' }
    ).setOrigin(0.5).setShadow(0, 0, '#ff0000', 10);

    this.timerText = this.add.text(20, 20, 'Tiempo: 0.0 s', { fontSize: '18px', color: '#fff' });
    this.progressText = this.add.text(20, 50, `Progreso: 0 / ${this.totalNodes}`, { fontSize: '18px', color: '#4ade80' });
  }

  _createNodes() {
    const margin = 100;
    const labels = Array.from({ length: this.totalNodes }, (_, i) => i + 1);

    labels.forEach((label) => {
      const pos = this._getNonOverlappingPosition(margin);

      // La "Estrella" interactiva
      const starContainer = this.add.container(pos.x, pos.y);

      // Brillo exterior
      const glow = this.add.circle(0, 0, 30, 0xffffff, 0.1);
      this.tweens.add({ targets: glow, scale: 1.2, alpha: 0, duration: 1500, loop: -1 });

      // Cuerpo de la estrella
      const starBody = this.add.star(0, 0, 5, 12, 24, 0xffd700); // Amarillo dorado

      // Texto del número
      const text = this.add.text(0, 0, String(label), {
        fontFamily: 'Arial', fontSize: '24px', color: '#000000', fontStyle: 'bold'
      }).setOrigin(0.5);

      starContainer.add([glow, starBody, text]);

      // Física e Interacción
      starBody.setInteractive({ useHandCursor: true });
      starBody.on('pointerdown', () => this._handleNodeClick(label, starContainer));

      this.nodes.push({ label, x: pos.x, y: pos.y, object: starContainer });
    });
  }

  _getNonOverlappingPosition(margin) {
    let x, y, tries = 0;
    do {
      x = Phaser.Math.Between(margin, this.scale.width - margin);
      y = Phaser.Math.Between(margin + 60, this.scale.height - margin);
      tries++;
    } while (this.nodes.some(n => Phaser.Math.Distance.Between(n.x, n.y, x, y) < 90) && tries < 200);
    return { x, y };
  }

  _handleNodeClick(clickedLabel, container) {
    if (this.gameCompleted) return;

    const expectedLabel = this.currentIndex + 1;
    const now = this.time.now;

    if (clickedLabel === expectedLabel) {
      // --- CORRECTO ---
      this.currentIndex++;
      // ✅ SUMAR SCORE POR ACIERTO
      const rt = now - this.lastClickTime;
      let gained = 10;

      // bonus por rapidez
      if (rt < 700) gained = 15;
      else if (rt < 1200) gained = 12;

      this.liveScore += gained;


      this.reactionTimes.push(rt);
      this.lastClickTime = now;

      // Efecto Visual: Estrella activada
      const starShape = container.list[1]; // El objeto star
      starShape.setFillStyle(0x00ff00); // Verde
      this.tweens.add({ targets: container, scale: 1.3, duration: 100, yoyo: true });

      // Dibujar línea (Rayo de luz)
      if (this.currentIndex > 1) {
        const prevNode = this.nodes[clickedLabel - 2];
        const currNode = this.nodes[clickedLabel - 1];
        this._drawBeam(prevNode.x, prevNode.y, currNode.x, currNode.y);
      }

      this.progressText.setText(`Progreso: ${this.currentIndex} / ${this.totalNodes}`);

      if (this.currentIndex >= this.totalNodes) this._endGame();

    } else {
      // --- ERROR ---
      this.liveScore = Math.max(0, this.liveScore - 5);

      this.sequenceErrors++;
      this.cameras.main.shake(200, 0.01);

      const starShape = container.list[1];
      const originalColor = 0xffd700;

      starShape.setFillStyle(0xff0000);

      this.time.delayedCall(300, () => {
        starShape.setFillStyle(originalColor);
      });
    }
  }

  // not used asset flare
  _drawBeam(x1, y1, x2, y2) {
    const line = this.add.line(0, 0, x1, y1, x2, y2, 0x00ffff).setOrigin(0).setLineWidth(4);
    line.setAlpha(0);
    this.tweens.add({ targets: line, alpha: 1, duration: 500 });

    // Partículas en la conexión
    const particles = this.add.particles(0, 0, 'flare', {
      x: x1, y: y1,
      speed: 100, lifespan: 300, quantity: 10, scale: { start: 0.5, end: 0 }, blendMode: 'ADD'
    });
    this.tweens.add({
      targets: particles, x: x2, y: y2, duration: 300, onComplete: () => particles.destroy()
    });
  }

  _endGame() {
    if (this.gameCompleted) return;
    this.gameCompleted = true;

    const totalTime = Date.now() - this.startTimeMs;

    const avgRt = this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length || 0;

    // Normalizamos score final a 0–100 desde el score acumulado
    const maxPossibleScore = this.totalNodes * 15; // 15 por nodo rápido
    let score = Math.round((this.liveScore / maxPossibleScore) * 100);
    score = Math.max(0, Math.min(100, score));


    const payload = {
      score,
      dimension: "consistencia",
      detailed_metrics: {
        reaction_time_avg: Math.round(avgRt),
        reaction_times_raw: this.reactionTimes,
        commission_errors: this.sequenceErrors,
        omission_errors: 0,
        total_errors: this.sequenceErrors,
        tmt_specific: {
          total_time_ms: Math.round(totalTime),
          live_score: this.liveScore
        }
      }
    };

    console.log("🧠 TMT payload:", payload);



    this.time.delayedCall(1000, () => {
      this.onGameEnd(payload);
      this.scene.stop();
    });
  }
}

export default TMTScene;