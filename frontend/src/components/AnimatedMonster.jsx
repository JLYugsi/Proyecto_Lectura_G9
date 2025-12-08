import { useState, useEffect } from 'react';

const AnimatedMonster = () => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  // Lógica para que los ojos sigan al mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      // Calculamos el movimiento relativo (-10 a 10 pixeles)
      const x = (clientX / windowWidth - 0.5) * 20;
      const y = (clientY / windowHeight - 0.5) * 20;

      setEyePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="monster-container d-flex justify-content-center align-items-center h-100">
      <svg
        width="300"
        height="300"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.2))' }}
      >
        {/* ANIMACIÓN CSS INCRUSTADA */}
        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes blink {
              0%, 96%, 100% { transform: scaleY(1); }
              98% { transform: scaleY(0.1); }
            }
            .monster-body { animation: float 3s ease-in-out infinite; }
            .monster-eyes { animation: blink 4s infinite; transform-origin: center; }
          `}
        </style>

        {/* --- CUERPO DEL MONSTRUO --- */}
        <g className="monster-body">
          {/* Forma Base (Cuerpo azulito amigable) */}
          <path
            d="M100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180Z"
            fill="#4F46E5" // Color Indigo Bootstrap
          />
          {/* Brillo en la cabeza */}
          <path
            d="M50 60C50 60 70 40 100 40C120 40 130 50 130 50"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.2"
          />
          
          {/* --- OJOS (Se mueven con el estado eyePosition) --- */}
          <g className="monster-eyes" style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}>
            {/* Ojo Izquierdo */}
            <circle cx="70" cy="90" r="25" fill="white" />
            <circle cx="70" cy="90" r="10" fill="#1E1B4B" /> {/* Pupila */}
            
            {/* Ojo Derecho */}
            <circle cx="130" cy="90" r="25" fill="white" />
            <circle cx="130" cy="90" r="10" fill="#1E1B4B" /> {/* Pupila */}
          </g>

          {/* --- BOCA (Sonrisa pequeña) --- */}
          <path
            d="M85 130 Q100 140 115 130"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
          />
          
          {/* Antena (Detalle tecnológico) */}
          <line x1="100" y1="20" x2="100" y2="5" stroke="#4F46E5" strokeWidth="4" />
          <circle cx="100" cy="5" r="5" fill="#EF4444" /> {/* Luz roja */}
        </g>
      </svg>
    </div>
  );
};

export default AnimatedMonster;