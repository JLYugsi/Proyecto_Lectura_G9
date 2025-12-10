import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GoNoGoScene from './phaser/GoNoGoScene';

const GoNoGoGamePhaser = ({ onGameEnd }) => {
    const gameContainer = useRef(null);
    const gameInstance = useRef(null);

    useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 600
            },
            parent: gameContainer.current,
            backgroundColor: '#000000',
            scene: [GoNoGoScene], // Cargamos la escena de Carreras
            physics: { default: 'arcade', arcade: { debug: false } }
        };

        gameInstance.current = new Phaser.Game(config);
        gameInstance.current.scene.start('GoNoGoScene', { onGameEnd });

        return () => {
            if (gameInstance.current) gameInstance.current.destroy(true);
        };
    }, [onGameEnd]);

    return (
        <div className="d-flex justify-content-center align-items-center w-100 h-100 overflow-hidden bg-dark">
            <div ref={gameContainer} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

export default GoNoGoGamePhaser;