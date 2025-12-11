import Phaser from 'phaser';

class TMTScene extends Phaser.Scene {
  constructor() {
    super('TMTScene');
  }

  init(data) {
    // callback que nos pasa React
    this.onGameEnd = data.onGameEnd || (() => {});
  }

  create() {
    // ---------- Estado interno ----------
    this.nodes = [];
    this.nodeGraphics = this.add.graphics();
    this.laserGraphics = this.add.graphics();
    this.currentIndex = 0;          // índice del siguiente nodo correcto
    this.sequenceErrors = 0;
    this.reactionTimes = [];
    this.clickLog = [];
    this.lastClickTime = null;
    this.gameCompleted = false;

    this.totalNodes = 12;           // puedes ajustar la cantidad
    this.startTime = this.time.now;

    // ---------- Fondo tipo sci-fi sencillo ----------
    this.cameras.main.setBackgroundColor('#020820');
    this._createStarfield();

    // ---------- HUD ----------
    this._createHUD();

    // ---------- Nodos del TMT ----------
    this._createNodes();

    // ---------- Timer de actualización ----------
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const elapsed = this.time.now - this.startTime;
        this.timerText.setText(`Tiempo: ${(elapsed / 1000).toFixed(1)} s`);
      }
    });
  }

  // ================== HELPERS VISUALES ==================

  _createStarfield() {
    const g = this.add.graphics();
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.8);
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, Phaser.Math.Between(1, 2));
    }
  }

  _createHUD() {
    this.add.text(
      this.scale.width / 2,
      30,
      'Ingeniero de Sistemas – Conecta los nodos en orden',
      {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#00ffcc'
      }
    ).setOrigin(0.5);

    this.timerText = this.add.text(20, 20, 'Tiempo: 0.0 s', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    });

    this.progressText = this.add.text(20, 45, 'Progreso: 0 / 12', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    });

    this.errorText = this.add.text(20, 70, 'Errores secuencia: 0', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ff6666'
    });
  }

  _createNodes() {
    this.nodeGraphics.clear();
    this.nodes = [];

    const margin = 80;
    const labels = [];
    for (let i = 1; i <= this.totalNodes; i++) {
      labels.push(i);
    }

    labels.forEach((label) => {
      const position = this._getNonOverlappingPosition(margin);

      const node = this.add.circle(position.x, position.y, 22, 0x111133);
      node.setStrokeStyle(2, 0x00ffcc);
      node.setInteractive({ useHandCursor: true });

      const text = this.add.text(position.x, position.y, String(label), {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5);

      node.label = label;
      node.textObject = text;
      node.clicked = false;

      node.on('pointerdown', () => {
        this._handleNodeClick(node);
      });

      this.nodes.push(node);
    });

    this.progressText.setText(`Progreso: 0 / ${this.totalNodes}`);
  }

  _getNonOverlappingPosition(margin) {
    // generación simple, suficiente para pocos nodos
    let x, y;
    let tries = 0;
    const minDistance = 70;

    do {
      x = Phaser.Math.Between(margin, this.scale.width - margin);
      y = Phaser.Math.Between(margin + 40, this.scale.height - margin); // +40 para no tapar HUD
      tries++;
      if (tries > 100) break;
    } while (
      this.nodes.some((n) => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      })
    );

    return { x, y };
  }

  // ================== LÓGICA DEL JUEGO ==================

  _handleNodeClick(node) {
    if (this.gameCompleted) return;

    const expectedLabel = this.currentIndex + 1; // esperamos 1, luego 2, etc.
    const clickedLabel = node.label;
    const now = this.time.now;

    const isCorrect = clickedLabel === expectedLabel;

    // Log de clic
    this.clickLog.push({
      time_ms: now - this.startTime,
      label: clickedLabel,
      expected: expectedLabel,
      correct: isCorrect,
      x: node.x,
      y: node.y
    });

    if (isCorrect) {
      // tiempo de vuelo
      if (this.lastClickTime !== null) {
        const rt = now - this.lastClickTime;
        this.reactionTimes.push(rt);
      }
      this.lastClickTime = now;

      // feedback visual de nodo correcto
      this._markNodeAsCorrect(node);

      // dibujar línea láser desde el nodo anterior
      if (this.currentIndex > 0) {
        const prevNode = this.nodes[this.currentIndex - 1];
        this._drawLaser(prevNode.x, prevNode.y, node.x, node.y);
      }

      this.currentIndex++;
      this.progressText.setText(
        `Progreso: ${this.currentIndex} / ${this.totalNodes}`
      );

      if (this.currentIndex >= this.totalNodes) {
        this._endGame();
      }
    } else {
      this.sequenceErrors++;
      this.errorText.setText(`Errores secuencia: ${this.sequenceErrors}`);
      this._flashError(node);
    }
  }

  _markNodeAsCorrect(node) {
    node.setFillStyle(0x00ffcc, 0.4);
    node.setStrokeStyle(2, 0xffffff);
    if (node.textObject) {
      node.textObject.setColor('#00ffcc');
    }
    node.clicked = true;
  }

  _drawLaser(x1, y1, x2, y2) {
    this.laserGraphics.lineStyle(3, 0x00ffcc, 0.9);
    this.laserGraphics.beginPath();
    this.laserGraphics.moveTo(x1, y1);
    this.laserGraphics.lineTo(x2, y2);
    this.laserGraphics.strokePath();

    // pequeño resplandor animado
    const glow = this.add.circle(x2, y2, 6, 0x00ffff, 1);
    this.tweens.add({
      targets: glow,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => glow.destroy()
    });
  }

  _flashError(node) {
    // guardamos el color original según si ya estaba correcto o no
    const originalColor = node.clicked ? 0x00ffcc : 0x111133;

    // lo pintamos de rojo para indicar error
    node.setFillStyle(0xff0000, 0.8);

    this.tweens.add({
      targets: node,
      duration: 80,
      repeat: 2,
      yoyo: true,
      scaleX: 1.2,
      scaleY: 1.2,
      onYoyo: () => {
        // en el yoyo podemos devolverlo al color original
        node.setFillStyle(originalColor, 0.8);
      },
      onComplete: () => {
        node.setScale(1);
        node.setFillStyle(originalColor, 0.8);
      }
    });
  }


   _endGame() {
    if (this.gameCompleted) return;
    this.gameCompleted = true;

    const endTime = this.time.now;
    const totalTime = endTime - this.startTime;

    // --- Métricas crudas del TMT ---
    const rawResults = {
      game: 'TMT',
      game_name: 'Ingeniero de Sistemas',
      total_time_ms: Math.round(totalTime),
      nodes_total: this.totalNodes,
      nodes_completed: this.currentIndex,
      sequence_errors: this.sequenceErrors,
      reaction_times_ms: this.reactionTimes,
      clicks_log: this.clickLog,
      started_at_ms: Math.round(this.startTime),
      finished_at_ms: Math.round(endTime)
    };

    // --- Cálculo de un "score" simple 0–100 ---
    let avgRt = 0;
    if (this.reactionTimes.length > 0) {
      const sum = this.reactionTimes.reduce((a, b) => a + b, 0);
      avgRt = sum / this.reactionTimes.length;
    }

    // Penalizamos errores de secuencia y tiempos muy lentos.
    // Esto es solo una heurística inicial, luego se puede refinar en el backend.
    let score = 100;

    // Cada error de secuencia penaliza 8 puntos
    score -= this.sequenceErrors * 8;

    // Si el tiempo medio entre nodos es muy lento (> 2000 ms), penalizamos
    if (avgRt > 2000) {
      score -= ((avgRt - 2000) / 100); // 100 ms extra = -1 punto
    }

    // Normalizamos
    score = Math.max(0, Math.min(100, Math.round(score)));

    const detailed_metrics = {
      raw: rawResults,
      summary: {
        avg_reaction_time_ms: Math.round(avgRt),
        sequence_errors: this.sequenceErrors,
        total_time_ms: Math.round(totalTime),
        nodes_total: this.totalNodes,
        nodes_completed: this.currentIndex
      }
    };

    // --- Esto es lo que verá GameRoom.handleGameEnd ---
    const payload = {
      score,
      detailed_metrics
    };

    // pequeña pausa para que el jugador vea el último efecto
    this.time.delayedCall(800, () => {
      try {
        this.onGameEnd(payload);
      } catch (e) {
        console.error('Error al enviar resultados TMT:', e);
      }
      this.scene.stop();
    });
    }
}
export default TMTScene;