import { useState, useEffect } from 'react';

const AnimatedMonster = ({ isBlind }) => {
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Hemos quitado el "if (isBlind) return" para que SIEMPRE siga al mouse
      
      const { clientX, clientY } = e;
      // Normalizamos posición (-1 a 1)
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;

      // Limitamos el movimiento dentro del ojo (max 12px)
      const moveX = Math.min(Math.max(x * 15, -12), 12);
      const moveY = Math.min(Math.max(y * 15, -12), 12);

      setPupilPos({ x: moveX, y: moveY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []); // Quitamos isBlind de las dependencias

  return (
    <div className="d-flex justify-content-center align-items-center h-100 w-100">
      <svg
        width="320"
        height="320"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.3))' }}
      >
        <style>
          {`
            /* Flotar suave */
            @keyframes float { 
                0%, 100% { transform: translateY(0px); } 
                50% { transform: translateY(-8px); } 
            }
            .monster-body { animation: float 4s ease-in-out infinite; }

            /* Parpadeo natural */
            @keyframes blink { 
                0%, 96%, 100% { transform: scaleY(1); } 
                98% { transform: scaleY(0.1); } 
            }
            .eyes-container { 
                animation: blink 4s infinite; 
                transform-origin: center 90px; 
            }

            /* Transiciones fluidas */
            .pupils, .mouth {
                transition: all 0.1s ease-out; /* Más rápido para respuesta al mouse */
            }
          `}
        </style>

        {/* Grupo Principal */}
        <g className="monster-body">
          
          {/* CUERPO */}
          <path 
            d="M100 180C144 180 180 144 180 100C180 55 144 20 100 20C55 20 20 55 20 100C20 144 55 180 100 180Z" 
            fill="#4F46E5" 
          />
          {/* Brillo cabeza */}
          <path d="M50 60C50 60 70 40 100 40C120 40 130 50 130 50" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.2" />

          {/* --- OJOS --- */}
          {/* Eliminada la clase condicional 'closed' */}
          <g className="eyes-container">
            
            {/* Esclerótica (Parte Blanca) */}
            <circle cx="70" cy="90" r="25" fill="white" />
            <circle cx="130" cy="90" r="25" fill="white" />

            {/* Pupilas (Se mueven con el mouse) */}
            <g className="pupils" style={{ transform: `translate(${pupilPos.x}px, ${pupilPos.y}px)` }}>
                <circle cx="70" cy="90" r="12" fill="#1E1B4B" />
                <circle cx="130" cy="90" r="12" fill="#1E1B4B" />
                {/* Brillo ojos */}
                <circle cx="74" cy="86" r="3" fill="white" opacity="0.8"/>
                <circle cx="134" cy="86" r="3" fill="white" opacity="0.8"/>
            </g>
          </g>

          {/* --- BOCA --- */}
          <path 
            className="mouth"
            d="M85 135 Q100 150 115 135" 
            stroke="white" strokeWidth="5" strokeLinecap="round" 
          />

          {/* Antena */}
          <line x1="100" y1="20" x2="100" y2="5" stroke="#4F46E5" strokeWidth="4" />
          <circle cx="100" cy="5" r="5" fill="#EF4444" />
        
        </g>
      </svg>
    </div>
  );
};

export default AnimatedMonster;