import Phaser from 'phaser';

export default class CPTScene extends Phaser.Scene {
    constructor() {
        super('CPTScene');
    }

    init(data) {
        this.onGameEnd = data.onGameEnd;
        this.totalTrials = 20; 
        this.currentTrial = 0;
        
        this.metrics = {
            totalX: 0,
            reactionTimes: [],
            omissionErrors: 0,
            commissionErrors: 0,
            startTime: 0,
            score: 0
        };

        this.isGameActive = false;
        this.waitingForResponse = false;
        this.currentType = '';
        this.responded = false;
    }

    preload() {
        // Generación de texturas
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        
        // Target (Dorado)
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(32, 32, 30);
        graphics.generateTexture('target', 64, 64);

        // Distractor (Gris)
        graphics.clear();
        graphics.fillStyle(0x64748b, 1);
        graphics.fillRect(0, 0, 60, 60);
        graphics.generateTexture('distractor', 60, 60);

        // Chispa
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('spark', 8, 8);
    }

    create() {
        this.cameras.main.setBackgroundColor('#0f172a');
        
        // Barra de Progreso
        this.add.rectangle(400, 580, 700, 10, 0x334155).setOrigin(0.5);
        this.progressBar = this.add.rectangle(50, 580, 0, 10, 0x38bdf8).setOrigin(0, 0.5);

        // HUD
        this.scoreText = this.add.text(20, 20, 'PUNTOS: 0', { fontSize: '24px', fontFamily: 'Courier', color: '#38bdf8' });
        this.infoText = this.add.text(400, 300, 'PRESIONA ESPACIO AL VER\nLA ESFERA DORADA', { fontSize: '20px', color: '#94a3b8', align: 'center' }).setOrigin(0.5);

        // Inputs
        this.input.keyboard.on('keydown-SPACE', this.handleInput, this);
        this.input.on('pointerdown', this.handleInput, this); 

        this.isGameActive = true;
        this.nextTrial();
    }

    nextTrial() {
        if (this.currentTrial >= this.totalTrials) {
            this.endGame();
            return;
        }

        this.currentTrial++;
        const progress = this.currentTrial / this.totalTrials;
        this.tweens.add({ targets: this.progressBar, width: 700 * progress, duration: 500 });

        this.responded = false;
        this.waitingForResponse = false;

        const isTarget = Math.random() < 0.3;
        this.currentType = isTarget ? 'TARGET' : 'DISTRACTOR';
        if (isTarget) this.metrics.totalX++;

        const delay = Phaser.Math.Between(1000, 2000);

        this.time.delayedCall(delay, () => {
            if (this.infoText.visible) this.infoText.setVisible(false);
            this.showStimulus(isTarget);
        });
    }

    showStimulus(isTarget) {
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY;
        let sprite;
        
        if (isTarget) {
            sprite = this.add.image(x, y, 'target').setScale(0);
            this.tweens.add({ targets: sprite, scale: 1.5, duration: 200, ease: 'Back.out' });
        } else {
            sprite = this.add.image(x, y, 'distractor').setScale(0);
            this.tweens.add({ targets: sprite, scale: 1, duration: 200, ease: 'Quad.out' });
        }

        this.metrics.startTime = Date.now();
        this.waitingForResponse = true;

        this.time.delayedCall(1500, () => {
            if (this.currentType === 'TARGET' && !this.responded) {
                this.metrics.omissionErrors++;
                this.cameras.main.shake(200, 0.01);
            }
            this.tweens.add({
                targets: sprite, scale: 0, duration: 200,
                onComplete: () => { sprite.destroy(); this.nextTrial(); }
            });
        });
    }

    handleInput() {
        if (!this.isGameActive || !this.waitingForResponse || this.responded) return;
        const reactionTime = Date.now() - this.metrics.startTime;
        this.responded = true;

        if (this.currentType === 'TARGET') {
            this.metrics.reactionTimes.push(reactionTime);
            this.metrics.score += 100;
            this.scoreText.setText('PUNTOS: ' + this.metrics.score);
            this.createExplosion(this.cameras.main.centerX, this.cameras.main.centerY, 0xffd700);
        } else {
            this.metrics.commissionErrors++;
            this.cameras.main.shake(300, 0.02);
            this.metrics.score = Math.max(0, this.metrics.score - 50);
            this.scoreText.setText('PUNTOS: ' + this.metrics.score);
            this.createExplosion(this.cameras.main.centerX, this.cameras.main.centerY, 0xff0000);
        }
    }
    
    createExplosion(x, y, color) {
        const emitter = this.add.particles(x, y, 'spark', {
            speed: { min: 100, max: 300 }, scale: { start: 1, end: 0 }, lifespan: 500, quantity: 20, tint: color, blendMode: 'ADD'
        });
        this.time.delayedCall(500, () => emitter.destroy());
    }

    endGame() {
        this.isGameActive = false;
        const times = this.metrics.reactionTimes;
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

        const finalResults = {
            score: this.metrics.score,
            detailed_metrics: {
                reaction_time_avg: Math.round(avgTime),
                // !!! CRUCIAL: Enviamos el array crudo para el cálculo de StDev !!!
                reaction_times_raw: this.metrics.reactionTimes, 
                omission_errors: this.metrics.omissionErrors,
                commission_errors: this.metrics.commissionErrors,
                total_errors: this.metrics.omissionErrors + this.metrics.commissionErrors
            }
        };
        if (this.onGameEnd) this.onGameEnd(finalResults);
    }
}