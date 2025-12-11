import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import TMTScene from './phaser/TMTScene';

const TMTGamePhaser = ({ onGameEnd }) => {
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
      scene: [TMTScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      }
    };

    gameInstance.current = new Phaser.Game(config);
    gameInstance.current.scene.start('TMTScene', { onGameEnd });

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [onGameEnd]);

  return (
    <div className="d-flex justify-content-center align-items-center w-100 h-100 overflow-hidden bg-dark">
      <div ref={gameContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default TMTGamePhaser;
