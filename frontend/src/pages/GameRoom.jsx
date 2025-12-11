import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendGameResults } from "../services/api";
import { Play, ArrowLeft, Brain, Zap, Eye, Activity, Trophy, Lock, Delete } from "lucide-react";


// --- IMPORTAMOS LOS JUEGOS (WRAPPERS DE PHASER) ---
import CPTGamePhaser from "../components/games/CPTGamePhaser";
import GoNoGoGamePhaser from "../components/games/GoNoGoGamePhaser";
import TMTGamePhaser from "../components/games/TMTGamePhaser";
import VigilanceGamePhaser from "../components/games/VigilanceGamePhaser";

const GameRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [childName, setChildName] = useState("");
  const [childId, setChildId] = useState("");

  // Recibimos el PIN de la sesión desde el Dashboard. Fallback a '0000' por seguridad.
  const exitPin = location.state?.exitPin || "0000";

  // Estados de flujo del juego
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [result, setResult] = useState(null);

  // Estados para el PIN Pad (Bloqueo de Salida)
  const [showPinPad, setShowPinPad] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    const currentName = localStorage.getItem("current_child_name");
    const currentId = localStorage.getItem("current_child_id");

    if (!currentName || !currentId) {
      navigate("/dashboard");
      return;
    }
    setChildName(currentName);
    setChildId(currentId);
  }, [navigate]);

  // --- CATÁLOGO DE JUEGOS ---
  const games = [
    {
      code: "cpt",
      title: "Atención Sostenida (CPT)",
      desc: "Misión: El Vigía. Detecta la señal dorada.",
      icon: <Eye size={40} className="text-primary" />,
      color: "border-primary"
    },
    {
      code: "go_no_go",
      title: "Control de Impulsos",
      desc: "Carrera Cuántica. ¡Acelera en verde, frena en rojo!",
      icon: <Zap size={40} className="text-warning" />,
      color: "border-warning"
    },
    {
      code: "tmt",
      title: "Flexibilidad (TMT)",
      desc: "Conecta los nodos en orden lógico.",
      icon: <Brain size={40} className="text-success" />,
      color: "border-success"
    },
    {
      code: "vigilance",
      title: "Vigilancia",
      desc: "Escaneo planetario. Encuentra los recursos.",
      icon: <Activity size={40} className="text-danger" />,
      color: "border-danger"
    }
  ];

  const handlePlayGame = (gameCode) => {
    setSelectedGame(gameCode);
    setIsPlaying(true);
    setResult(null);
  };

  const handleGameEnd = async (gameMetrics) => {
    setIsPlaying(false); // Ocultamos el juego
    try {
      // Preparamos el paquete de datos para la IA
      const finalData = {
        child_id: childId,
        game_code: selectedGame,
        score: gameMetrics.score || 0,
        total_time_played: 60, // Duración estimada
        detailed_metrics: gameMetrics.detailed_metrics // Aquí van los arrays crudos para el ML
      };

      console.log("Enviando datos a la IA...", finalData);

      const response = await sendGameResults(finalData);
      setResult(response); // Mostramos el resultado

    } catch (error) {
      console.error(error);
      alert("Error guardando resultados. Revisa la conexión.");
    }
  };

  // --- LÓGICA DEL PIN PAD (SEGURIDAD) ---
  const handlePinInput = (num) => {
    if (enteredPin.length < 4) {
      setEnteredPin(prev => prev + num);
      setPinError(false);
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleSubmitPin = () => {
    if (enteredPin === exitPin) {
      navigate("/dashboard");
    } else {
      setPinError(true);
      setEnteredPin("");
      setTimeout(() => setPinError(false), 800);
    }
  };

  return (
    <div className="container-fluid min-vh-100 bg-light p-4 position-relative">

      {/* HEADER SUPERIOR */}
      <div className="d-flex align-items-center mb-5">
        <button
          className="btn btn-outline-secondary me-3 shadow-sm d-flex align-items-center bg-white"
          onClick={() => { setShowPinPad(true); setEnteredPin(""); }}
        >
          <Lock size={16} className="me-2" /> Salir / Menú Padre
        </button>
        <div>
          <h2 className="fw-bold m-0 text-dark">Hola, {childName} 👋</h2>
          <p className="text-muted m-0 small">Selecciona una misión para comenzar</p>
        </div>
      </div>

      {/* --- ÁREA PRINCIPAL --- */}

      {/* 1. VISTA DE RESULTADOS (POST-JUEGO) */}
      {result ? (
        <div className="d-flex justify-content-center align-items-center animate__animated animate__fadeIn" style={{ minHeight: '60vh' }}>
          <div className="alert alert-success shadow-lg p-5 text-center border-0 rounded-4" style={{ maxWidth: '600px', background: 'linear-gradient(145deg, #ffffff, #f0fdf4)' }}>
            <h2 className="fw-bold mb-4 text-success">¡Misión Cumplida!</h2>

            <div className="py-4">
              <div className="badge bg-dark fs-5 p-3 rounded-pill shadow-sm mb-3">
                🧠 Análisis IA: {result.verdict}
              </div>

              {result.badge_awarded ? (
                <div className="mt-3 badge bg-warning text-dark fs-4 p-4 shadow rounded-3 animate__animated animate__tada animate__delay-1s border border-warning">
                  <Trophy className="me-2 mb-1" /> {result.badge_awarded}
                </div>
              ) : (
                <div className="mt-3 text-muted fst-italic">
                  ¡Buen intento! Sigue entrenando para ganar medallas.
                </div>
              )}
            </div>

            <div className="d-grid gap-3 mt-4">
              <button className="btn btn-primary btn-lg fw-bold shadow-sm" onClick={() => setResult(null)}>
                Jugar Otra Misión
              </button>
            </div>
          </div>
        </div>

      ) : isPlaying ? (
        // 2. VISTA DE JUEGO ACTIVO (PHASER)
        <div className="game-container bg-dark rounded-4 shadow-lg overflow-hidden border border-secondary position-relative" style={{ minHeight: '600px', height: '80vh' }}>

          {/* SWITCH PARA CARGAR EL JUEGO CORRECTO */}
          {selectedGame === 'cpt' ? (
            <CPTGamePhaser onGameEnd={handleGameEnd} />
          ) : selectedGame === 'go_no_go' ? (
            <GoNoGoGamePhaser onGameEnd={handleGameEnd} />
          ) : selectedGame === 'tmt' ? (
            <TMTGamePhaser onGameEnd={handleGameEnd} />       /* ⬅️ NUEVO */
          ) : selectedGame === 'vigilance' ? (
            <VigilanceGamePhaser onGameEnd={handleGameEnd} /> /* ⬅️ NUEVO */
          ) : (
          // Placeholder para juegos futuros (TMT, Vigilance)
          <div className="d-flex flex-column align-items-center justify-content-center h-100 text-white">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <h3>Construyendo Nivel...</h3>
            <p className="text-muted">Este módulo estará disponible pronto.</p>
            <button className="btn btn-danger mt-3 px-4" onClick={() => setIsPlaying(false)}>Abortar Misión</button>
          </div>
            )}

        </div>

      ) : (
        // 3. MENÚ DE SELECCIÓN (GRID)
        <div className="row g-4">
          {games.map((game) => (
            <div key={game.code} className="col-md-6 col-lg-3">
              <div className={`card h-100 shadow-sm hover-scale border-top border-5 transition-all ${game.color}`}>
                <div className="card-body text-center p-4 d-flex flex-column">
                  <div className="flex-grow-1">
                    <div className="mb-3 d-inline-block p-3 rounded-circle bg-light shadow-sm text-secondary">
                      {game.icon}
                    </div>
                    <h4 className="fw-bold text-dark">{game.title}</h4>
                    <p className="small text-muted">{game.desc}</p>
                  </div>
                  <button
                    className="btn btn-outline-primary w-100 fw-bold mt-3 py-2 stretched-link"
                    onClick={() => handlePlayGame(game.code)}
                  >
                    <Play size={18} className="me-2" /> INICIAR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE PIN PAD (BLOQUEO PARENTAL) --- */}
      {showPinPad && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, backdropFilter: 'blur(5px)' }}>

          <div className="bg-white p-4 rounded-4 shadow-lg text-center animate__animated animate__fadeInUp" style={{ width: '340px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-secondary d-flex align-items-center"><Lock size={18} className="me-2" /> Acceso Parental</h5>
              <button className="btn-close" onClick={() => setShowPinPad(false)}></button>
            </div>

            {/* Display del PIN */}
            <div className={`bg-light rounded-3 p-3 mb-4 border ${pinError ? 'border-danger bg-danger-subtle' : ''}`}>
              <h2 className="m-0 letter-spacing-3 fw-bold text-dark">
                {enteredPin.split('').map(() => '•').join('') || <span className="text-muted fs-6 fw-normal">Ingresa el PIN de Sesión</span>}
              </h2>
            </div>

            {/* Teclado Numérico */}
            <div className="row g-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <div className="col-4" key={num}>
                  <button
                    className="btn btn-outline-dark w-100 py-3 fw-bold fs-4 rounded-3 shadow-sm active-scale"
                    onClick={() => handlePinInput(num.toString())}
                  >
                    {num}
                  </button>
                </div>
              ))}
              <div className="col-4"></div>
              <div className="col-4">
                <button className="btn btn-outline-dark w-100 py-3 fw-bold fs-4 rounded-3 shadow-sm" onClick={() => handlePinInput("0")}>0</button>
              </div>
              <div className="col-4">
                <button className="btn btn-danger w-100 py-3 fw-bold fs-4 rounded-3 d-flex align-items-center justify-content-center shadow-sm" onClick={handleDelete}>
                  <Delete size={24} />
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-100 btn-lg fw-bold shadow" onClick={handleSubmitPin}>
              DESBLOQUEAR Y SALIR
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameRoom;