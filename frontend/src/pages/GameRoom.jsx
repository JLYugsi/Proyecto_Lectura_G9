import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendGameResults } from "../services/api";
import { Play, ArrowLeft, Brain, Zap, Eye, Activity, Trophy, Lock, Delete } from "lucide-react";
import CPTGamePhaser from "../components/games/CPTGamePhaser"; 

const GameRoom = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Para recibir el PIN que viene del Dashboard
  
  const [childName, setChildName] = useState("");
  const [childId, setChildId] = useState("");
  
  // Recibimos el PIN de la sesión. Si por algo falla, fallback a '0000'
  const exitPin = location.state?.exitPin || "0000"; 

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [result, setResult] = useState(null);

  // Estados para el Modal de PIN (Teclado)
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

  const games = [
    { code: "cpt", title: "Atención Sostenida (CPT)", desc: "Presiona la tecla cuando veas la X.", icon: <Eye size={40} className="text-primary" />, color: "border-primary" },
    { code: "go_no_go", title: "Control de Impulsos", desc: "Presiona VERDE, ignora ROJO.", icon: <Zap size={40} className="text-warning" />, color: "border-warning" },
    { code: "tmt", title: "Flexibilidad (TMT)", desc: "Conecta en orden.", icon: <Brain size={40} className="text-success" />, color: "border-success" },
    { code: "vigilance", title: "Vigilancia", desc: "Mantente alerta.", icon: <Activity size={40} className="text-danger" />, color: "border-danger" }
  ];

  const handlePlayGame = (gameCode) => {
    setSelectedGame(gameCode);
    setIsPlaying(true);
    setResult(null);
  };

  const handleGameEnd = async (gameMetrics) => {
    setIsPlaying(false);
    try {
      const finalData = {
        child_id: childId,
        game_code: selectedGame,
        score: gameMetrics.score || 0,
        total_time_played: 60,
        detailed_metrics: gameMetrics.detailed_metrics
      };
      const response = await sendGameResults(finalData);
      setResult(response);
    } catch (error) {
      console.error(error);
      alert("Error guardando resultados.");
    }
  };

  // --- LÓGICA DEL PIN PAD ---
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
        // Efecto visual de error
        setTimeout(() => setPinError(false), 1000);
    }
  };

  return (
    <div className="container-fluid min-vh-100 bg-light p-4 position-relative">
      
      {/* HEADER */}
      <div className="d-flex align-items-center mb-5">
        <button 
            className="btn btn-outline-secondary me-3 shadow-sm d-flex align-items-center" 
            onClick={() => { setShowPinPad(true); setEnteredPin(""); }}
        >
          <Lock size={16} className="me-2" /> Salir / Menú Padre
        </button>
        <div>
          <h2 className="fw-bold m-0 text-dark">Hola, {childName} 👋</h2>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {result ? (
        <div className="d-flex justify-content-center">
            <div className="alert alert-success shadow-lg p-5 text-center animate__animated animate__bounceIn" style={{maxWidth: '600px'}}>
                <h3 className="fw-bold mb-4">¡Juego Completado!</h3>
                <div className="badge bg-dark fs-5 p-3 rounded-pill shadow-sm mb-3">Diagnóstico IA: {result.verdict}</div>
                {result.badge_awarded && <div className="badge bg-warning text-dark fs-4 p-4 shadow mb-4"><Trophy className="me-2"/> {result.badge_awarded}</div>}
                <div className="d-grid gap-2">
                    <button className="btn btn-primary btn-lg" onClick={() => setResult(null)}>Jugar Otro</button>
                </div>
            </div>
        </div>
      ) : isPlaying ? (
        <div className="game-container bg-white rounded-4 shadow-lg p-0 overflow-hidden border" style={{minHeight: '60vh'}}>
            {selectedGame === 'cpt' ? <CPTGamePhaser onGameEnd={handleGameEnd} /> : <div className="p-5 text-center">Próximamente... <br/><button className="btn btn-danger mt-3" onClick={() => setIsPlaying(false)}>Cancelar</button></div>}
        </div>
      ) : (
        <div className="row g-4">
          {games.map((game) => (
            <div key={game.code} className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm hover-scale border-top border-5 transition-all">
                <div className="card-body text-center p-4">
                  <div className="mb-3 d-inline-block p-3 rounded-circle bg-light">{game.icon}</div>
                  <h4 className="fw-bold">{game.title}</h4>
                  <p className="small text-muted">{game.desc}</p>
                  <button className="btn btn-outline-primary w-100 mt-3" onClick={() => handlePlayGame(game.code)}><Play size={18} className="me-2"/> JUGAR</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE PIN PAD (TIPO CAJERO) --- */}
      {showPinPad && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000 }}>
          
          <div className="bg-white p-4 rounded-4 shadow-lg text-center animate__animated animate__fadeInUp" style={{ width: '320px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold m-0 text-secondary">Bloqueo Parental</h5>
                <button className="btn-close" onClick={() => setShowPinPad(false)}></button>
            </div>
            
            {/* Display del PIN */}
            <div className={`bg-light rounded-3 p-3 mb-4 border ${pinError ? 'border-danger bg-danger-subtle' : ''}`}>
                <h2 className="m-0 letter-spacing-3 fw-bold">
                    {enteredPin.split('').map(() => '•').join('') || <span className="text-muted fs-6 fw-normal">Ingresa el PIN</span>}
                </h2>
            </div>

            {/* Teclado Numérico */}
            <div className="row g-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <div className="col-4" key={num}>
                        <button className="btn btn-outline-dark w-100 py-3 fw-bold fs-4 rounded-3" onClick={() => handlePinInput(num.toString())}>
                            {num}
                        </button>
                    </div>
                ))}
                <div className="col-4"></div>
                <div className="col-4">
                    <button className="btn btn-outline-dark w-100 py-3 fw-bold fs-4 rounded-3" onClick={() => handlePinInput("0")}>0</button>
                </div>
                <div className="col-4">
                     <button className="btn btn-danger w-100 py-3 fw-bold fs-4 rounded-3 d-flex align-items-center justify-content-center" onClick={handleDelete}>
                        <Delete size={24}/>
                     </button>
                </div>
            </div>
            
            <button className="btn btn-primary w-100 btn-lg fw-bold" onClick={handleSubmitPin}>
                DESBLOQUEAR Y SALIR
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameRoom;