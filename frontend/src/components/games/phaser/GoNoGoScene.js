import Phaser from 'phaser';

export default class GoNoGoScene extends Phaser.Scene {
    constructor() {
        super('GoNoGoScene');
    }

    init(data) {
        this.onGameEnd = data.onGameEnd;
        // Go/No-Go requiere MÁS intentos para establecer el ritmo
        this.totalTrials = 30; 
        this.currentTrial = 0;
        
        this.metrics = {
            goTrials: 0,
            noGoTrials: 0,
            hits: 0,            // Acierto en Go
            misses: 0,          // Omisión en Go (Lentitud)
            falseAlarms: 0,     // Comisión en No-Go (Impulsividad - EL DATO CLAVE)
            correctRejections: 0, // Acierto en No-Go (Control)
            reactionTimes: [],
            score: 0
        };

        this.isGameActive = false;
        this.waitingForInput = false;
        this.currentType = ''; // 'GO' o 'NOGO'
        this.objectSpeed = 200; // Velocidad inicial
    }

    preload() {
        // --- ASSETS GENERADOS (Estilo Cyberpunk) ---
        
        // 1. Portal GO (Verde - Hexágono)
        const goG = this.make.graphics({ x: 0, y: 0, add: false });
        goG.lineStyle(4, 0x4ade80); // Verde Neon
        goG.strokeRect(0, 0, 100, 100);
        goG.fillStyle(0x4ade80, 0.3);
        goG.fillRect(0, 0, 100, 100);
        goG.generateTexture('portal_go', 100, 100);

        // 2. Barrera NO-GO (Roja - X)
        const nogoG = this.make.graphics({ x: 0, y: 0, add: false });
        nogoG.lineStyle(6, 0xef4444); // Rojo Neon
        nogoG.beginPath();
        nogoG.moveTo(0, 0); nogoG.lineTo(100, 100);
        nogoG.moveTo(100, 0); nogoG.lineTo(0, 100);
        nogoG.strokePath();
        nogoG.generateTexture('barrier_nogo', 100, 100);

        // 3. Túnel (Líneas de perspectiva)
        const grid = this.make.graphics({ x: 0, y: 0, add: false });
        grid.fillStyle(0xffffff);
        grid.fillCircle(2, 2, 2);
        grid.generateTexture('star', 4, 4);
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        
        // CENTRO DE FUGA (Perspectiva)
        this.centerX = this.cameras.main.width / 2;
        this.centerY = this.cameras.main.height / 2;

        // Efecto de Túnel de Velocidad (Estrellas radiales)
        this.tunnelEmitter = this.add.particles(this.centerX, this.centerY, 'star', {
            speed: { min: 100, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.1, end: 1 },
            lifespan: 2000,
            quantity: 4,
            frequency: 50,
            blendMode: 'ADD'
        });

        // HUD
        this.scoreText = this.add.text(20, 20, 'ENERGÍA: 0', { fontSize: '24px', fontFamily: 'Courier', color: '#ffffff' });
        this.instructionText = this.add.text(this.centerX, 500, '¡ATRAVIESA LOS VERDES!\nEVITA LOS ROJOS', { 
            fontSize: '24px', fontFamily: 'Arial', color: '#ffffff', align: 'center' 
        }).setOrigin(0.5);

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
        this.waitingForInput = true;
        this.inputReceived = false;

        // LÓGICA GO/NO-GO:
        // 80% Probabilidad de GO (Para crear hábito)
        // 20% Probabilidad de NO-GO (Para probar frenado)
        const isGo = Math.random() < 0.8;
        this.currentType = isGo ? 'GO' : 'NOGO';
        
        if (isGo) this.metrics.goTrials++;
        else this.metrics.noGoTrials++;

        this.spawnObject(isGo);
    }

    spawnObject(isGo) {
        const texture = isGo ? 'portal_go' : 'barrier_nogo';
        
        // El objeto nace en el centro (lejos) y viene hacia la cámara
        const target = this.add.image(this.centerX, this.centerY, texture).setScale(0.1).setAlpha(0);

        // Animación de acercamiento (Zoom in)
        this.tweens.add({
            targets: target,
            scale: 3,       // Se hace gigante
            alpha: 1,
            duration: 1500, // Velocidad de acercamiento
            ease: 'Expo.in', // Acelera al final (efecto paso veloz)
            onUpdate: () => {
                // Si ya respondió, detener chequeos visuales (optimización)
            },
            onComplete: () => {
                // SI LLEGA AL FINAL Y NADIE PRESIONÓ:
                if (!this.inputReceived) {
                    if (isGo) {
                        // Era verde y no presionó -> Omisión (Lentitud)
                        this.metrics.misses++;
                        this.cameras.main.shake(100, 0.005);
                        this.createFeedback('¡MUY LENTO!', 0xffff00);
                    } else {
                        // Era rojo y no presionó -> Acierto (Correct Rejection)
                        this.metrics.correctRejections++;
                        this.metrics.score += 50;
                        this.createFeedback('¡BIEN ESQUIVADO!', 0x4ade80);
                    }
                }
                target.destroy();
                this.scoreText.setText('ENERGÍA: ' + this.metrics.score);
                
                // Siguiente ronda rápida (Ritmo frenético)
                this.time.delayedCall(500, () => this.nextTrial());
            }
        });
        
        this.currentTarget = target;
        this.trialStartTime = Date.now();
    }

    handleInput() {
        if (!this.isGameActive || !this.waitingForInput || this.inputReceived) return;
        
        // Solo aceptamos input mientras el objeto está visible y acercándose
        if (!this.currentTarget || !this.currentTarget.active) return;

        const reactionTime = Date.now() - this.trialStartTime;
        this.inputReceived = true; // Bloquear más inputs en este turno

        // Animación de "Dash" visual (Zoom extra)
        this.cameras.main.zoomTo(1.05, 100);
        this.time.delayedCall(100, () => this.cameras.main.zoomTo(1, 100));

        if (this.currentType === 'GO') {
            // --- ACIERTO (HIT) ---
            this.metrics.hits++;
            this.metrics.reactionTimes.push(reactionTime);
            this.metrics.score += 100;
            
            // Efecto visual: Destruir portal
            this.currentTarget.setTint(0xffffff);
            this.tweens.add({ targets: this.currentTarget, scale: 5, alpha: 0, duration: 200 });
            this.createFeedback('¡TURBO!', 0x4ade80);

        } else {
            // --- ERROR (FALSA ALARMA - IMPULSIVIDAD) ---
            this.metrics.falseAlarms++;
            this.metrics.score = Math.max(0, this.metrics.score - 100);
            
            // Efecto visual: Choque
            this.cameras.main.shake(400, 0.03);
            this.currentTarget.setTint(0xef4444);
            this.createFeedback('¡CHOQUE!', 0xef4444);
        }
        
        this.scoreText.setText('ENERGÍA: ' + this.metrics.score);
        this.instructionText.setVisible(false);
    }

    createFeedback(text, color) {
        const t = this.add.text(this.centerX, this.centerY + 100, text, {
            fontSize: '32px', fontStyle: 'bold', color: '#' + color.toString(16)
        }).setOrigin(0.5);
        
        this.tweens.add({ targets: t, y: this.centerY, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    }

    endGame() {
        this.isGameActive = false;
        const avgTime = this.metrics.reactionTimes.length > 0 
            ? this.metrics.reactionTimes.reduce((a, b) => a + b, 0) / this.metrics.reactionTimes.length 
            : 0;

        // Estructura adaptada para el backend
        const finalResults = {
            score: this.metrics.score,
            detailed_metrics: {
                // Mapeamos a los nombres que tu IA ya entiende
                reaction_time_avg: Math.round(avgTime),
                reaction_times_raw: this.metrics.reactionTimes,
                
                // En Go/No-Go:
                // Omission = Misses (Perdió verdes)
                omission_errors: this.metrics.misses,
                // Commission = False Alarms (Chocó rojos) -> ESTO ES LO QUE BUSCAMOS
                commission_errors: this.metrics.falseAlarms, 
                
                total_errors: this.metrics.misses + this.metrics.falseAlarms
            }
        };

        if (this.onGameEnd) this.onGameEnd(finalResults);
    }
}