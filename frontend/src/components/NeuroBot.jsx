import React from 'react';

const NeuroBot = ({ mood = "happy", message = "" }) => {
  // Colores dinámicos según el humor
  const colors = {
    happy: { body: "#38bdf8", face: "#e0f2fe", eye: "#0ea5e9" }, // Azul Claro
    excited: { body: "#fbbf24", face: "#fef3c7", eye: "#d97706" }, // Dorado
    thinking: { body: "#a78bfa", face: "#ede9fe", eye: "#7c3aed" }, // Violeta
    sad: { body: "#94a3b8", face: "#f1f5f9", eye: "#64748b" } // Gris
  };

  const currentTheme = colors[mood] || colors.happy;

  return (
    <div className="position-relative d-inline-block" style={{zIndex: 20}}>
      
      {/* --- GLOBO DE TEXTO (Speech Bubble) --- */}
      {/* Ajustado el bottom para que no se corte */}
      {message && (
        <div className="position-absolute animate__animated animate__fadeInUp" 
             style={{ 
               bottom: "100%", 
               left: "50%", 
               transform: "translateX(-50%)", 
               marginBottom: "15px", // Más espacio hacia arriba
               width: "max-content",
               maxWidth: "200px"
             }}>
           <div className="bg-white text-dark p-3 rounded-4 shadow-sm border border-2 border-primary fw-bold small text-center position-relative">
              {message}
              {/* Triángulo del globo */}
              <div className="position-absolute start-50 translate-middle-x" 
                   style={{ 
                     bottom: "-10px", 
                     width: "0", 
                     height: "0", 
                     borderLeft: "10px solid transparent",
                     borderRight: "10px solid transparent",
                     borderTop: "10px solid white" // Color del globo
                   }}>
              </div>
           </div>
        </div>
      )}

      {/* --- EL ROBOT (SVG) --- */}
      {/* Clase 'floating' para animación CSS */}
      <div className="floating-mascot transition-all">
        <svg width="110" height="110" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{filter: 'drop-shadow(0px 10px 6px rgba(0,0,0,0.15))'}}>
            
            {/* Antena */}
            <path d="M60 15V35" stroke={currentTheme.body} strokeWidth="4" strokeLinecap="round"/>
            <circle cx="60" cy="15" r="6" fill={mood === 'excited' ? '#ef4444' : currentTheme.eye} className={mood === 'excited' ? 'animate-pulse' : ''}/>

            {/* Orejas/Auriculares */}
            <rect x="15" y="55" width="10" height="20" rx="2" fill={currentTheme.body}/>
            <rect x="95" y="55" width="10" height="20" rx="2" fill={currentTheme.body}/>

            {/* Cabeza (Forma Squircle) */}
            <rect x="20" y="35" width="80" height="70" rx="25" fill={currentTheme.body} />
            
            {/* Pantalla/Cara */}
            <rect x="30" y="45" width="60" height="45" rx="15" fill={currentTheme.face} />

            {/* Ojos */}
            {mood === 'happy' || mood === 'excited' ? (
                <>
                    <ellipse cx="45" cy="62" rx="6" ry="8" fill={currentTheme.eye} />
                    <ellipse cx="75" cy="62" rx="6" ry="8" fill={currentTheme.eye} />
                    {/* Brillo en los ojos */}
                    <circle cx="47" cy="59" r="2" fill="white"/>
                    <circle cx="77" cy="59" r="2" fill="white"/>
                </>
            ) : (
                // Ojos pensando (rayitas)
                <>
                    <rect x="40" y="60" width="12" height="4" rx="2" fill={currentTheme.eye}/>
                    <rect x="70" y="60" width="12" height="4" rx="2" fill={currentTheme.eye}/>
                </>
            )}

            {/* Boca */}
            {mood === 'happy' && <path d="M50 75C50 75 55 80 60 80C65 80 70 75 70 75" stroke={currentTheme.eye} strokeWidth="3" strokeLinecap="round"/>}
            {mood === 'excited' && <path d="M45 75Q60 88 75 75" stroke={currentTheme.eye} strokeWidth="3" fill="none" strokeLinecap="round"/>}
            {mood === 'thinking' && <circle cx="60" cy="78" r="3" fill={currentTheme.eye}/>}

            {/* Coloretes (Mejillas) */}
            <circle cx="38" cy="72" r="3" fill="#fda4af" opacity="0.6"/>
            <circle cx="82" cy="72" r="3" fill="#fda4af" opacity="0.6"/>

        </svg>
      </div>
      
      {/* Sombra en el piso */}
      <div className="mx-auto mt-1 rounded-pill bg-dark opacity-10 blur-sm" style={{width: '60px', height: '8px', filter: 'blur(2px)'}}></div>

      {/* ESTILOS DE ANIMACIÓN INYECTADOS */}
      <style>{`
        .floating-mascot {
            animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        .animate-pulse {
            animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default NeuroBot;