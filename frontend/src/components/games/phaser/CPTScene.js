import Phaser from 'phaser';

export default class CPTScene extends Phaser.Scene {
    constructor() {
        super('CPTScene');
    }

    // Recibimos la función de "Terminar" desde React
    init(data) {
        this.onGameEnd = data.onGameEnd;
        this.totalTrials = 20;
        this.currentTrial = 0;
        
        // Variables Científicas
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
        this.currentLetter = '';
        this.responded = false;
    }

    preload() {
        // --- GENERACIÓN DE ASSETS EN TIEMPO REAL (Para no descargar imágenes) ---
        
        // 1. Crear gráfico para el "Estímulo Objetivo" (Bola de Energía Dorada)
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffd700, 1); // Dorado
        graphics.fillCircle(32, 32, 30); // Círculo
        graphics.generateTexture('target', 64, 64);

        // 2. Crear gráfico para "Distractores" (Basura espacial gris)
        graphics.clear();
        graphics.fillStyle(0x64748b, 1); // Gris Azulado
        graphics.fillRect(0, 0, 60, 60); // Cuadrado
        graphics.generateTexture('distractor', 60, 60);

        // 3. Crear Partículas (Chispa)
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('spark', 8, 8);
    }

    create() {
        // FONDO: Espacio profundo
        this.cameras.main.setBackgroundColor('#0f172a');
        
        // Estrellas (Partículas de fondo)
        const starShape = new Phaser.Geom.Rectangle(0, 0, 800, 600);
        this.add.particles(0, 0, 'spark', {
            x: 0, y: 0,
            emitZone: { source: starShape, type: 'random', quantity: 50 },
            scale: { start: 0.5, end: 0 },
            lifespan: 3000,
            quantity: 2,
            frequency: 100,
            alpha: { start: 1, end: 0 }
        });

        // HUD (Interfaz)
        this.scoreText = this.add.text(20, 20, 'PUNTOS: 0', { fontSize: '24px', fontFamily: 'Courier', color: '#38bdf8' });
        this.infoText = this.add.text(400, 550, 'PRESIONA ESPACIO AL VER LA ESFERA DORADA', { fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5);

        // INPUTS
        this.input.keyboard.on('keydown-SPACE', this.handleInput, this);
        this.input.on('pointerdown', this.handleInput, this); // Click/Touch

        // INICIAR SECUENCIA
        this.isGameActive = true;
        this.nextTrial();
    }

    nextTrial() {
        if (this.currentTrial >= this.totalTrials) {
            this.endGame();
            return;
        }

        this.currentTrial++;
        this.responded = false;
        this.waitingForResponse = false;

        // 1. Probabilidad 30% de que sea el Objetivo (X)
        const isTarget = Math.random() < 0.3;
        this.currentLetter = isTarget ? 'X' : 'DISTRACTOR';

        if (isTarget) this.metrics.totalX++;

        // 2. Espera aleatoria antes de mostrar (Inter-stimulus interval)
        // Esto evita que el niño anticipe el ritmo exacto
        const delay = Phaser.Math.Between(1000, 2000);

        this.time.delayedCall(delay, () => {
            this.showStimulus(isTarget);
        });
    }

    showStimulus(isTarget) {
        // Centro de la pantalla
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY;

        let sprite;
        
        if (isTarget) {
            // MOSTRAR OBJETIVO (Bola Dorada)
            sprite = this.add.image(x, y, 'target').setScale(0);
            this.tweens.add({ targets: sprite, scale: 1.5, duration: 200, ease: 'Back.out' });
        } else {
            // MOSTRAR DISTRACTOR (Cubo Gris)
            sprite = this.add.image(x, y, 'distractor').setScale(0);
            this.tweens.add({ targets: sprite, scale: 1, duration: 200, ease: 'Quad.out' });
        }

        // MARCA DE TIEMPO CIENTÍFICA
        this.metrics.startTime = Date.now();
        this.waitingForResponse = true;

        // TIEMPO DE VISIBILIDAD (1.5 segundos para responder)
        this.time.delayedCall(1500, () => {
            // Chequeo de OMISIÓN (Se le pasó la X)
            if (this.currentLetter === 'X' && !this.responded) {
                this.metrics.omissionErrors++;
                this.cameras.main.shake(200, 0.01); // Feedback visual sutil (Temblor)
                this.soundFeedback(false);
            }
            
            // Animación de salida y siguiente ronda
            this.tweens.add({
                targets: sprite,
                scale: 0,
                duration: 200,
                onComplete: () => {
                    sprite.destroy();
                    this.nextTrial();
                }
            });
        });
    }

    handleInput() {
        if (!this.isGameActive || !this.waitingForResponse || this.responded) return;

        const reactionTime = Date.now() - this.metrics.startTime;
        this.responded = true;

        if (this.currentLetter === 'X') {
            // --- ACIERTO ---
            this.metrics.reactionTimes.push(reactionTime);
            this.metrics.score += 100;
            this.scoreText.setText('PUNTOS: ' + this.metrics.score);
            
            // Feedback Positivo (Explosión de partículas)
            this.createExplosion(this.cameras.main.centerX, this.cameras.main.centerY, 0xffd700);
        } else {
            // --- ERROR DE COMISIÓN (Impulsividad) ---
            this.metrics.commissionErrors++;
            this.cameras.main.shake(300, 0.02); // Temblor fuerte
            this.metrics.score = Math.max(0, this.metrics.score - 50);
            this.scoreText.setText('PUNTOS: ' + this.metrics.score);
            this.createExplosion(this.cameras.main.centerX, this.cameras.main.centerY, 0xff0000);
        }
    }

    createExplosion(x, y, color) {
        const emitter = this.add.particles(x, y, 'spark', {
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 20,
            tint: color,
            blendMode: 'ADD'
        });
        // Auto destruir emisor
        this.time.delayedCall(500, () => emitter.destroy());
    }

    soundFeedback(success) {
        // Aquí podrías poner sonidos reales más adelante
        // this.sound.play(success ? 'ping' : 'buzz');
    }

    endGame() {
        this.isGameActive = false;
        
        // Calcular promedio
        const times = this.metrics.reactionTimes;
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

        // Preparar JSON final
        const finalResults = {
            score: this.metrics.score,
            detailed_metrics: {
                reaction_time_avg: Math.round(avgTime),
                omission_errors: this.metrics.omissionErrors,
                commission_errors: this.metrics.commissionErrors,
                total_errors: this.metrics.omissionErrors + this.metrics.commissionErrors
            }
        };

        // Enviar a React
        if (this.onGameEnd) this.onGameEnd(finalResults);
    }
}