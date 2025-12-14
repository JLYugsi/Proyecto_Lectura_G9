import Phaser from 'phaser';

export default class GoNoGoScene extends Phaser.Scene {
    constructor() {
        super('GoNoGoScene');
    }

    init(data) {
        this.onGameEnd = data.onGameEnd;
        this.totalTrials = 20; // Reducido ligeramente para demo
        this.currentTrial = 0;
        this.metrics = {
            goTrials: 0, noGoTrials: 0, hits: 0, misses: 0, 
            falseAlarms: 0, correctRejections: 0, reactionTimes: [], score: 0
        };
        this.isGameActive = false;
        this.waitingForInput = false;
    }

    preload() {
        // Texturas generativas simples para no depender de imágenes externas
        const goG = this.make.graphics({ x: 0, y: 0, add: false });
        goG.lineStyle(8, 0x00ff00); goG.strokeCircle(64,64,60); 
        goG.fillStyle(0x00ff00, 0.2); goG.fillCircle(64,64,60);
        goG.generateTexture('portal_go', 128, 128);

        const nogoG = this.make.graphics({ x: 0, y: 0, add: false });
        nogoG.lineStyle(8, 0xff0000); 
        nogoG.beginPath(); nogoG.moveTo(20,20); nogoG.lineTo(108,108);
        nogoG.moveTo(108,20); nogoG.lineTo(20,108); nogoG.strokePath();
        nogoG.generateTexture('barrier_nogo', 128, 128);
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a1a');
        this.centerX = this.cameras.main.width / 2;
        this.centerY = this.cameras.main.height / 2;

        this.scoreText = this.add.text(20, 20, 'PUNTOS: 0', { fontSize: '24px', color: '#fff' });
        this.instructionText = this.add.text(this.centerX, 500, 'VERDE = CLIC\nROJO = ESPERA', { 
            fontSize: '24px', align: 'center', color: '#aaa' 
        }).setOrigin(0.5);

        this.input.on('pointerdown', this.handleInput, this);
        this.input.keyboard.on('keydown-SPACE', this.handleInput, this);

        this.isGameActive = true;
        this.nextTrial();
    }

    nextTrial() {
        if (this.currentTrial >= this.totalTrials) {
            this.endGame();
            return;
        }
        this.currentTrial++;
        this.waitingForInput = true;
        this.inputReceived = false;

        const isGo = Math.random() < 0.7; // 70% Go
        this.currentType = isGo ? 'GO' : 'NOGO';
        
        if (isGo) this.metrics.goTrials++;
        else this.metrics.noGoTrials++;

        this.spawnObject(isGo);
    }

    spawnObject(isGo) {
        const texture = isGo ? 'portal_go' : 'barrier_nogo';
        const target = this.add.image(this.centerX, this.centerY, texture).setScale(0.1).setAlpha(0);

        // --- VELOCIDAD AJUSTADA AQUÍ ---
        // Antes: 1500 (Muy rápido). Ahora: 2500 (Adecuado para niños)
        this.tweens.add({
            targets: target,
            scale: 4,
            alpha: 1,
            duration: 2500, // <--- CAMBIO CLAVE: MÁS LENTO
            ease: 'Quad.in', // Aceleración suave
            onComplete: () => {
                if (!this.inputReceived) {
                    if (isGo) {
                        this.metrics.misses++; // Se le escapó
                        this.cameras.main.shake(100, 0.005);
                    } else {
                        this.metrics.correctRejections++; // Bien hecho, esperó
                        this.metrics.score += 50;
                        this.createFeedback('¡BIEN!', 0x00ff00);
                    }
                }
                target.destroy();
                this.scoreText.setText('PUNTOS: ' + this.metrics.score);
                this.time.delayedCall(800, () => this.nextTrial()); // Pausa entre intentos
            }
        });
        
        this.currentTarget = target;
        this.trialStartTime = Date.now();
    }

    handleInput() {
        if (!this.isGameActive || !this.waitingForInput || this.inputReceived) return;
        if (!this.currentTarget || !this.currentTarget.active) return;

        const reactionTime = Date.now() - this.trialStartTime;
        this.inputReceived = true;

        if (this.currentType === 'GO') {
            this.metrics.hits++;
            this.metrics.reactionTimes.push(reactionTime);
            this.metrics.score += 100;
            this.createFeedback('¡GENIAL!', 0x00ff00);
            this.tweens.add({ targets: this.currentTarget, scale: 6, alpha: 0, duration: 200 });
        } else {
            this.metrics.falseAlarms++;
            this.metrics.score = Math.max(0, this.metrics.score - 50);
            this.cameras.main.shake(200, 0.02);
            this.createFeedback('¡NO!', 0xff0000);
            this.currentTarget.setTint(0xff0000);
        }
        this.scoreText.setText('PUNTOS: ' + this.metrics.score);
        this.instructionText.setVisible(false);
    }

    createFeedback(text, color) {
        const t = this.add.text(this.centerX, this.centerY, text, { fontSize: '40px', fontStyle:'bold', color: '#fff' }).setOrigin(0.5);
        t.setStroke('#000', 4);
        this.tweens.add({ targets: t, y: this.centerY - 100, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }

    endGame() {
        this.isGameActive = false;
        const avgTime = this.metrics.reactionTimes.length > 0 
            ? this.metrics.reactionTimes.reduce((a, b) => a + b, 0) / this.metrics.reactionTimes.length 
            : 0;

        const finalResults = {
            score: this.metrics.score, // SCORE EN RAÍZ
            detailed_metrics: {
                reaction_time_avg: Math.round(avgTime),
                reaction_times_raw: this.metrics.reactionTimes,
                omission_errors: this.metrics.misses,
                commission_errors: this.metrics.falseAlarms, 
                total_errors: this.metrics.misses + this.metrics.falseAlarms
            }
        };
        if (this.onGameEnd) this.onGameEnd(finalResults);
    }
}