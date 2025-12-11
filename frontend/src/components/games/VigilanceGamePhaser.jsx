import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import VigilanceScene from './phaser/VigilanceScene';

const VigilanceGamePhaser = ({ onGameEnd }) => {
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
      scene: [VigilanceScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      }
    };

    gameInstance.current = new Phaser.Game(config);
    gameInstance.current.scene.start('VigilanceScene', { onGameEnd });

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

export default VigilanceGamePhaser;
