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
            totalX: 0, reactionTimes: [], omissionErrors: 0, commissionErrors: 0, startTime: 0, score: 0
        };
        this.isGameActive = false;
        this.waitingForResponse = false;
        this.currentType = '';
        this.responded = false;
    }

    preload() {
        // --- TEXTURAS GENERATIVAS DE ALTA CALIDAD (NEON STYLE) ---
        
        // 1. Objetivo (Núcleo de Energía) - Gradiente Radial
        const targetG = this.make.graphics({ x: 0, y: 0, add: false });
        targetG.fillStyle(0xffaa00, 1); // Centro caliente
        targetG.fillCircle(64, 64, 30);
        targetG.lineStyle(4, 0xffd700, 1); // Borde dorado
        targetG.strokeCircle(64, 64, 40);
        targetG.generateTexture('target', 128, 128);

        // 2. Distractor (Basura Espacial) - Geométrico
        const distG = this.make.graphics({ x: 0, y: 0, add: false });
        distG.fillStyle(0x475569, 1); 
        distG.fillRect(34, 34, 60, 60); // Cuadrado base
        distG.lineStyle(2, 0x94a3b8, 1);
        distG.strokeRect(34, 34, 60, 60); // Borde tecnológico
        distG.generateTexture('distractor', 128, 128);

        // 3. Partícula de Estrella (Glow)
        const starG = this.make.graphics({ x: 0, y: 0, add: false });
        starG.fillStyle(0xffffff, 1);
        starG.fillCircle(4, 4, 4);
        starG.generateTexture('star', 8, 8);
    }

    create() {
        // --- 1. AMBIENTACIÓN (PARALLAX) ---
        this.cameras.main.setBackgroundColor('#020617'); // Espacio profundo

        // Capa 1: Estrellas lejanas (Lentas)
        this.starsFar = this.add.particles(0, 0, 'star', {
            x: { min: 0, max: 800 },
            y: { min: 0, max: 600 },
            quantity: 100,
            lifespan: Number.MAX_VALUE,
            scale: { min: 0.2, max: 0.5 },
            alpha: { min: 0.3, max: 0.7 },
        });

        // Capa 2: Estrellas cercanas (Rápidas - Simula velocidad de nave)
        this.starsNear = this.add.particles(0, 0, 'star', {
            x: 850, // Nacen a la derecha
            y: { min: 0, max: 600 },
            lifespan: 2000,
            speedX: { min: -400, max: -800 }, // Viajan a la izquierda
            scale: { min: 0.5, max: 1 },
            quantity: 2,
            frequency: 100,
            blendMode: 'ADD' // Efecto brillo
        });

        // --- 2. INTERFAZ (HUD COCKPIT) ---
        // Marco de la cabina (Vignette simulado con bordes)
        this.add.rectangle(400, 300, 780, 580).setStrokeStyle(4, 0x1e293b);
        
        // Mira central (Crosshair)
        this.add.circle(400, 300, 100).setStrokeStyle(2, 0x0ea5e9, 0.3);
        this.add.line(0, 0, 380, 300, 420, 300, 0x0ea5e9, 0.3).setOrigin(0);
        this.add.line(0, 0, 400, 280, 400, 320, 0x0ea5e9, 0.3).setOrigin(0);

        // Textos Holográficos
        this.scoreText = this.add.text(30, 30, 'SCORE: 0', { fontSize: '24px', fontFamily: 'Courier', color: '#38bdf8' }).setShadow(0,0,'#38bdf8', 10);
        this.infoText = this.add.text(400, 500, 'ESPERANDO SEÑAL...', { fontSize: '20px', color: '#94a3b8' }).setOrigin(0.5);

        // Barra de Progreso (Integrada en el HUD inferior)
        this.add.rectangle(400, 580, 700, 8, 0x1e293b).setOrigin(0.5);
        this.progressBar = this.add.rectangle(50, 580, 0, 8, 0x0ea5e9).setOrigin(0, 0.5); // Cyan Neon

        // --- 3. INPUTS ---
        this.input.keyboard.on('keydown-SPACE', this.handleInput, this);
        this.input.on('pointerdown', this.handleInput, this); 

        // Iniciar
        this.isGameActive = true;
        this.nextTrial();
    }

    nextTrial() {
        if (this.currentTrial >= this.totalTrials) { this.endGame(); return; }

        this.currentTrial++;
        
        // Actualizar barra suavemente
        this.tweens.add({ targets: this.progressBar, width: 700 * (this.currentTrial / this.totalTrials), duration: 300 });

        this.responded = false;
        this.waitingForResponse = false;
        
        const isTarget = Math.random() < 0.3;
        this.currentType = isTarget ? 'TARGET' : 'DISTRACTOR';
        if (isTarget) this.metrics.totalX++;

        const delay = Phaser.Math.Between(1000, 2000);
        this.time.delayedCall(delay, () => {
            this.infoText.setText(isTarget ? '¡OBJETIVO DETECTADO!' : 'SEÑAL DESCONOCIDA');
            this.showStimulus(isTarget);
        });
    }

    showStimulus(isTarget) {
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY;
        let sprite;

        // Efecto de aparición "Warp"
        if (isTarget) {
            sprite = this.add.image(x, y, 'target').setScale(0);
            sprite.setTint(0xffcc00); // Tinte dorado brillante
            this.tweens.add({ targets: sprite, scale: 1.2, alpha: 1, duration: 250, ease: 'Back.out' });
            
            // Efecto de pulso mientras está activo
            this.tweens.add({ targets: sprite, scale: 1.1, duration: 500, yoyo: true, repeat: -1 });

        } else {
            sprite = this.add.image(x, y, 'distractor').setScale(0);
            this.tweens.add({ targets: sprite, scale: 0.8, duration: 250, ease: 'Quad.out' });
            // Rotación lenta para la basura espacial
            this.tweens.add({ targets: sprite, angle: 360, duration: 6000, repeat: -1 });
        }

        this.metrics.startTime = Date.now();
        this.waitingForResponse = true;

        this.time.delayedCall(1500, () => {
            if (this.currentType === 'TARGET' && !this.responded) {
                this.metrics.omissionErrors++;
                this.cameras.main.shake(100, 0.01);
                this.infoText.setText('¡OBJETIVO PERDIDO!');
                this.infoText.setColor('#ef4444');
            }
            // Desaparición rápida
            this.tweens.add({
                targets: sprite, scale: 0, alpha: 0, duration: 200,
                onComplete: () => { sprite.destroy(); this.nextTrial(); }
            });
        });
    }

    handleInput() {
        if (!this.isGameActive || !this.waitingForResponse || this.responded) return;
        const reactionTime = Date.now() - this.metrics.startTime;
        this.responded = true;

        if (this.currentType === 'TARGET') {
            // ACIERTO
            this.metrics.reactionTimes.push(reactionTime);
            this.metrics.score += 100;
            this.scoreText.setText('SCORE: ' + this.metrics.score);
            this.createExplosion(400, 300, 0xffd700); // Explosión dorada
            this.infoText.setText('¡CAPTURA EXITOSA!');
            this.infoText.setColor('#0ea5e9');
        } else {
            // ERROR
            this.metrics.commissionErrors++;
            this.cameras.main.shake(300, 0.02); // Impacto fuerte
            this.metrics.score = Math.max(0, this.metrics.score - 50);
            this.scoreText.setText('SCORE: ' + this.metrics.score);
            this.createExplosion(400, 300, 0xff0000); // Explosión roja
            this.infoText.setText('¡DAÑO EN CASCO!');
            this.infoText.setColor('#ef4444');
        }
    }

    createExplosion(x, y, color) {
        const emitter = this.add.particles(x, y, 'star', {
            speed: { min: 200, max: 400 },
            scale: { start: 1, end: 0 },
            lifespan: 600,
            quantity: 30,
            tint: color,
            blendMode: 'ADD'
        });
        this.time.delayedCall(600, () => emitter.destroy());
    }

    endGame() {
        this.isGameActive = false;
        // Detener partículas
        this.starsNear.destroy();
        
        const times = this.metrics.reactionTimes;
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        
        const finalResults = {
            score: this.metrics.score,
            detailed_metrics: {
                reaction_time_avg: Math.round(avgTime),
                reaction_times_raw: this.metrics.reactionTimes,
                omission_errors: this.metrics.omissionErrors,
                commission_errors: this.metrics.commissionErrors,
                total_errors: this.metrics.omissionErrors + this.metrics.commissionErrors
            }
        };
        if (this.onGameEnd) this.onGameEnd(finalResults);
    }
}