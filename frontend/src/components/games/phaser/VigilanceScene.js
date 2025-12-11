import Phaser from 'phaser';

class VigilanceScene extends Phaser.Scene {
  constructor() {
    super('VigilanceScene');
  }

  init(data) {
    this.onGameEnd = data.onGameEnd || (() => {});
  }

  create() {
    // ---------- Estado Interno ----------
    this.objects = [];
    this.startTime = this.time.now;
    this.gameCompleted = false;

    this.totalTargets = 8;          // Objetivos (cristales)
    this.numDistractors = 45;       // Distractores
    this.targetsFound = 0;
    this.falseAlarms = 0;
    this.clicksLog = [];
    this.firstTargetTime = null;

    this.timeLimitMs = 90000;       // ⬅️ 90 segundos para evitar "me saca del juego"

    // ---------- Fondo ----------
    this.cameras.main.setBackgroundColor('#020820');
    this._createStarfield();

    // ---------- HUD ----------
    this._createHUD();

    // ---------- Objetos ----------
    this._spawnObjects();

    // ---------- Timer ----------
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const elapsed = this.time.now - this.startTime;
        const remaining = Math.max(0, this.timeLimitMs - elapsed);
        this.timerText.setText(`Tiempo: ${(remaining / 1000).toFixed(1)} s`);

        if (!this.gameCompleted && elapsed >= this.timeLimitMs) {
          this._endGame('time_up');
        }
      }
    });
  }

  // ===================== VISUAL ======================

  _createStarfield() {
    const g = this.add.graphics();
    for (let i = 0; i < 140; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.1, 0.8));
      g.fillCircle(x, y, Phaser.Math.Between(1, 2));
    }
  }

  _createHUD() {
    this.add.text(
      this.scale.width / 2,
      30,
      'Radar de Exploración – Encuentra los cristales azules',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#00e5ff'
      }
    ).setOrigin(0.5);

    this.timerText = this.add.text(20, 20, 'Tiempo: 90.0 s', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    });

    this.targetsText = this.add.text(20, 45, `Objetivos: 0 / ${this.totalTargets}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#80ff80'
    });

    this.errorsText = this.add.text(20, 70, 'Errores (falsas alarmas): 0', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ff6666'
    });
  }

  // ===================== OBJETOS ======================

  _spawnObjects() {
    const margin = 60;
    const minDistance = 50;

    const getPos = () => {
      let x, y, tries = 0;
      do {
        x = Phaser.Math.Between(margin, this.scale.width - margin);
        y = Phaser.Math.Between(margin + 40, this.scale.height - margin);
        tries++;
        if (tries > 120) break;
      } while (this.objects.some(o => {
        const dx = o.x - x;
        const dy = o.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      }));
      return { x, y };
    };

    // --- Distractores (rocas grises) ---
    for (let i = 0; i < this.numDistractors; i++) {
      const pos = getPos();
      const size = Phaser.Math.Between(18, 28);

      const rock = this.add.rectangle(pos.x, pos.y, size, size, 0x444444, 0.9);
      rock.isTarget = false;
      rock.collected = false;

      rock.setStrokeStyle(1, 0x222222);
      rock.setInteractive(new Phaser.Geom.Rectangle(0, 0, size, size), Phaser.Geom.Rectangle.Contains);

      rock.on('pointerdown', () => this._handleClick(rock));

      this.tweens.add({
        targets: rock,
        y: rock.y + Phaser.Math.Between(-5, 5),
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.objects.push(rock);
    }

    // --- Objetivos (Cristales) ---
    for (let i = 0; i < this.totalTargets; i++) {
      const pos = getPos();
      const size = Phaser.Math.Between(22, 32);

      const crystal = this.add.polygon(
        pos.x,
        pos.y,
        [0, -size / 2, size / 2, 0, 0, size / 2, -size / 2, 0],
        0x00cfff,
        0.95
      );

      crystal.isTarget = true;
      crystal.collected = false;

      crystal.setStrokeStyle(2, 0xffffff);

      // 🔥 HITBOX GRANDE Y CÓMODO
      const radius = size * 1.2;
      crystal.setInteractive(
        new Phaser.Geom.Circle(0, 0, radius),
        Phaser.Geom.Circle.Contains
      );

      crystal.on('pointerdown', () => this._handleClick(crystal));

      this.tweens.add({
        targets: crystal,
        y: crystal.y + Phaser.Math.Between(-6, 6),
        angle: Phaser.Math.Between(-6, 6),
        duration: Phaser.Math.Between(1200, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.objects.push(crystal);
    }
  }

  // ===================== LÓGICA DEL JUEGO ======================

  _handleClick(obj) {
    if (this.gameCompleted) return;

    const now = this.time.now;
    const elapsed = now - this.startTime;

    const type = obj.isTarget ? 'target' : 'distractor';

    // log de clic
    this.clicksLog.push({
      time_ms: Math.round(elapsed),
      x: obj.x,
      y: obj.y,
      type
    });

    if (obj.isTarget) {
      if (obj.collected) return; // evita errores

      obj.collected = true;

      if (this.firstTargetTime === null) {
        this.firstTargetTime = elapsed;
      }

      this.targetsFound++;
      this.targetsText.setText(`Objetivos: ${this.targetsFound} / ${this.totalTargets}`);

      this._collectTargetAnimation(obj);

      if (this.targetsFound >= this.totalTargets) {
        this._endGame('all_found');
      }

    } else {
      this.falseAlarms++;
      this.errorsText.setText(`Errores (falsas alarmas): ${this.falseAlarms}`);
      this._flashError(obj);
    }
  }

  _collectTargetAnimation(obj) {
    this.tweens.add({
      targets: obj,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => obj.destroy()
    });

    const glow = this.add.circle(obj.x, obj.y, 10, 0x00ffff, 1);
    this.tweens.add({
      targets: glow,
      alpha: 0,
      scale: 3,
      duration: 400,
      onComplete: () => glow.destroy()
    });
  }

  _flashError(obj) {
    const original = obj.isTarget ? 0x00cfff : 0x444444;

    obj.setFillStyle(0xff0000, 0.9);

    this.tweens.add({
      targets: obj,
      duration: 90,
      repeat: 2,
      yoyo: true,
      scaleX: 1.2,
      scaleY: 1.2,
      onYoyo: () => obj.setFillStyle(original),
      onComplete: () => {
        obj.setScale(1);
        obj.setFillStyle(original);
      }
    });
  }

  // ===================== FIN DEL JUEGO ======================

  _endGame(reason) {
    if (this.gameCompleted) return;
    this.gameCompleted = true;

    const endTime = this.time.now;
    const totalTime = endTime - this.startTime;

    const miss = this.totalTargets - this.targetsFound;

    const accuracy = this.totalTargets > 0
      ? this.targetsFound / this.totalTargets
      : 0;

    const rawResults = {
      game: 'Vigilance',
      game_name: 'Radar de Exploración',
      end_reason: reason,
      total_time_ms: Math.round(totalTime),
      time_to_first_target_ms: this.firstTargetTime,
      targets_total: this.totalTargets,
      targets_found: this.targetsFound,
      false_alarms: this.falseAlarms,
      accuracy,
      clicks_log: this.clicksLog,
      started_at_ms: Math.round(this.startTime),
      finished_at_ms: Math.round(endTime)
    };

    // -------- SCORE (0-100) --------
    let score = 100;

    score -= miss * 6;
    score -= this.falseAlarms * 3;

    if (this.firstTargetTime && this.firstTargetTime > 5000) {
      score -= (this.firstTargetTime - 5000) / 300;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const detailed_metrics = {
      raw: rawResults,
      summary: {
        total_time_ms: Math.round(totalTime),
        time_to_first_target_ms: this.firstTargetTime,
        targets_total: this.totalTargets,
        targets_found: this.targetsFound,
        false_alarms: this.falseAlarms,
        accuracy
      }
    };

    const payload = { score, detailed_metrics };

    this.time.delayedCall(800, () => {
      try {
        this.onGameEnd(payload);
      } catch (e) {
        console.error("Error al enviar resultados Vigilance:", e);
      }
      this.scene.stop();
    });
  }
}

export default VigilanceScene;
