import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendGameResults } from "../services/api";
import { Play, ArrowLeft, Brain, Zap, Eye, Activity, Trophy } from "lucide-react";

const GameRoom = () => {
  const navigate = useNavigate();
  const [childName, setChildName] = useState("");
  const [childId, setChildId] = useState("");
  
  // Estado para la simulación del juego
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState(null); // Aquí guardamos lo que responde la IA
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    // 1. Verificar si hay un niño seleccionado para jugar
    const currentName = localStorage.getItem("current_child_name");
    const currentId = localStorage.getItem("current_child_id");

    if (!currentName || !currentId) {
      alert("Primero selecciona un niño desde el Dashboard");
      navigate("/dashboard");
      return;
    }
    setChildName(currentName);
    setChildId(currentId);
  }, [navigate]);

  // --- LISTA DE JUEGOS DISPONIBLES ---
  const games = [
    {
      code: "cpt",
      title: "Atención Sostenida (CPT)",
      desc: "Presiona la tecla cuando veas la X. No te distraigas.",
      icon: <Eye size={40} className="text-primary" />,
      color: "border-primary"
    },
    {
      code: "go_no_go",
      title: "Control de Impulsos",
      desc: "¡Rápido! Presiona VERDE, ignora ROJO.",
      icon: <Zap size={40} className="text-warning" />,
      color: "border-warning"
    },
    {
      code: "tmt",
      title: "Flexibilidad Cognitiva (TMT)",
      desc: "Conecta los números y letras en orden lo más rápido posible.",
      icon: <Brain size={40} className="text-success" />,
      color: "border-success"
    },
    {
      code: "vigilance",
      title: "Vigilancia",
      desc: "Mantente alerta a los cambios sutiles en la pantalla.",
      icon: <Activity size={40} className="text-danger" />,
      color: "border-danger"
    }
  ];

  // --- SIMULADOR DE JUEGO (MOCKUP) ---
  const handlePlayGame = async (gameCode) => {
    setSelectedGame(gameCode);
    setIsPlaying(true);
    setResult(null);

    // 1. Simulamos que el niño juega por 3 segundos
    setTimeout(async () => {
      try {
        // 2. Generamos DATOS CIENTÍFICOS ALEATORIOS para probar tu IA
        // A veces generamos un patrón "Sano" (reacción rápida, pocos errores)
        // A veces generamos un patrón "Riesgo" (lento, muchos errores)
        const isHealthyRun = Math.random() > 0.5; 

        const simulatedData = {
          child_id: childId,
          game_code: gameCode,
          score: Math.floor(Math.random() * 1000),
          total_time_played: 60, // 60 segundos
          detailed_metrics: {
            // Si es sano: 300-400ms. Si es riesgo: 600-900ms
            reaction_time_avg: isHealthyRun ? 350 : 850, 
            // Si es sano: 0-2 errores. Si es riesgo: 5-15 errores
            total_errors: isHealthyRun ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 10) + 5,
            omission_errors: isHealthyRun ? 0 : 3,
            commission_errors: isHealthyRun ? 0 : 3,
          }
        };

        console.log("Enviando datos a la IA:", simulatedData);

        // 3. Enviamos al Backend (FastAPI + Mongo + ML)
        const response = await sendGameResults(simulatedData);
        
        setResult(response); // Guardamos el diagnóstico y la medalla

      } catch (error) {
        console.error("Error jugando:", error);
        alert("Error de conexión con el motor de IA");
      } finally {
        setIsPlaying(false);
      }
    }, 3000); // 3 segundos de espera visual
  };

  return (
    <div className="container-fluid min-vh-100 bg-light p-4">
      {/* HEADER */}
      <div className="d-flex align-items-center mb-5">
        <button className="btn btn-outline-secondary me-3" onClick={() => navigate("/dashboard")}>
          <ArrowLeft /> Volver
        </button>
        <div>
          <h2 className="fw-bold m-0">Hola, {childName} 👋</h2>
          <p className="text-muted m-0">¿A qué vamos a jugar hoy?</p>
        </div>
      </div>

      {/* ZONA DE RESULTADO (MODAL OVERLAY) */}
      {result && (
        <div className="alert alert-success shadow-lg p-4 mb-5 text-center animate__animated animate__bounceIn">
          <h3 className="fw-bold">¡Análisis Completado!</h3>
          <div className="d-flex justify-content-center align-items-center gap-3 my-3">
             <div className="badge bg-dark fs-5 p-3">
                Diagnóstico IA: {result.verdict}
             </div>
             {result.badge_awarded && (
               <div className="badge bg-warning text-dark fs-5 p-3 d-flex align-items-center">
                 <Trophy className="me-2" /> ¡Medalla Ganada: {result.badge_awarded}!
               </div>
             )}
          </div>
          <p className="text-muted">Los datos han sido guardados en tu historial clínico.</p>
          <button className="btn btn-primary" onClick={() => setResult(null)}>Seguir Jugando</button>
        </div>
      )}

      {/* GRID DE JUEGOS */}
      {isPlaying ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{width: '4rem', height: '4rem'}}></div>
          <h3 className="mt-4 animate__animated animate__pulse animate__infinite">Analizando patrones cognitivos...</h3>
          <p className="text-muted">Tu IA está procesando tiempos de reacción y errores.</p>
        </div>
      ) : (
        <div className="row g-4">
          {games.map((game) => (
            <div key={game.code} className="col-md-6 col-lg-3">
              <div className={`card h-100 shadow-sm hover-scale border-top border-4 ${game.color}`}>
                <div className="card-body text-center p-4">
                  <div className="mb-3">{game.icon}</div>
                  <h4 className="fw-bold">{game.title}</h4>
                  <p className="text-muted small">{game.desc}</p>
                  <button 
                    className="btn btn-outline-primary w-100 fw-bold mt-3"
                    onClick={() => handlePlayGame(game.code)}
                  >
                    <Play size={18} className="me-2" /> JUGAR AHORA
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameRoom;