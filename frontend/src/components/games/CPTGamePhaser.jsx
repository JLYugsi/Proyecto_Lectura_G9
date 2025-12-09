import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import CPTScene from './phaser/CPTScene';

const CPTGamePhaser = ({ onGameEnd }) => {
    const gameContainer = useRef(null);
    const gameInstance = useRef(null);

    useEffect(() => {
        // Configuración de Phaser
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameContainer.current, // Insertar en el div ref
            backgroundColor: '#0f172a',
            scene: [CPTScene], // Cargamos nuestra escena
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            }
        };

        // Iniciar juego
        gameInstance.current = new Phaser.Game(config);

        // Pasar la función de callback a la escena una vez que arranque
        gameInstance.current.scene.start('CPTScene', { onGameEnd });

        // Limpieza al desmontar el componente (Evita duplicar canvas)
        return () => {
            if (gameInstance.current) {
                gameInstance.current.destroy(true);
            }
        };
    }, [onGameEnd]);

    return (
        <div className="d-flex justify-content-center align-items-center w-100 h-100">
            {/* Contenedor donde Phaser inyectará el Canvas */}
            <div ref={gameContainer} className="shadow-lg border border-primary rounded overflow-hidden" />
        </div>
    );
};

export default CPTGamePhaser;