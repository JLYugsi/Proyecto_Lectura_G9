import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendGameResults } from "../services/api";
import { Play, Brain, Zap, Eye, Activity, Trophy, Lock, Delete, CheckCircle, X } from "lucide-react";

// --- IMPORTAMOS LOS JUEGOS ---
import CPTGamePhaser from "../components/games/CPTGamePhaser";
import GoNoGoGamePhaser from "../components/games/GoNoGoGamePhaser";
import TMTGamePhaser from "../components/games/TMTGamePhaser";
import VigilanceGamePhaser from "../components/games/VigilanceGamePhaser";

// --- IMPORTAMOS LA MASCOTA ---
// Asegúrate de que guardaste el archivo NeuroBot.jsx en la carpeta components
import NeuroBot from "../components/NeuroBot";



// --- LISTA DE LOGROS ---
const ACHIEVEMENTS_LIST = [
  { id: "sniper_cpt", title: "Ojo de Águila", desc: "Precisión perfecta en El Vigía.", icon: <Eye size={20} />, color: "text-green-500", bg: "bg-green-100" },
  { id: "zen_master", title: "Mente Zen", desc: "Control total en Modo Turbo.", icon: <Brain size={20} />, color: "text-purple-500", bg: "bg-purple-100" },
  { id: "speed_demon", title: "Rayo Veloz", desc: "Velocidad sónica en Tesoro.", icon: <Zap size={20} />, color: "text-yellow-500", bg: "bg-yellow-100" },
  { id: "brainy", title: "Genio", desc: "Sin errores en Constelaciones.", icon: <Activity size={20} />, color: "text-pink-500", bg: "bg-pink-100" }
];

const GameRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [childName, setChildName] = useState("");
  const [childId, setChildId] = useState("");
  const [childAchievements, setChildAchievements] = useState([]);
  const exitPin = location.state?.exitPin || "0000";
  const [runId, setRunId] = useState(0);
  // 🐾 Mascotas reveladas por juego
  const [revealedCreatures, setRevealedCreatures] = useState({});





  // Estado del flujo
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [result, setResult] = useState(null);

  // Estado de la sesión (Progreso actual)
  const [completedGames, setCompletedGames] = useState([]);

  // Modales
  const [showPinPad, setShowPinPad] = useState(false);
  const [showTrophyRoom, setShowTrophyRoom] = useState(false);
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
    { code: "cpt", title: "El Vigía", desc: "Atención", icon: <Eye size={24} />, color: "primary" },
    { code: "go_no_go", title: "Turbo", desc: "Control", icon: <Zap size={24} />, color: "warning" },
    { code: "tmt", title: "Constelación", desc: "Flexibilidad", icon: <Brain size={24} />, color: "success" },
    { code: "vigilance", title: "Tesoro", desc: "Velocidad", icon: <Activity size={24} />, color: "danger" }
  ];

  const handlePlayGame = (gameCode) => {
    setSelectedGame(gameCode);
    setResult(null);
    setRunId((r) => r + 1); // 👈 fuerza una nueva instancia de Phaser
    setIsPlaying(true);


  };


  const handleGameEnd = async (gameMetrics) => {
    console.log("🎮 gameMetrics recibido:", selectedGame, gameMetrics);

    setIsPlaying(false);

    const finalData = {
      child_id: childId,
      game_code: selectedGame,
      score: gameMetrics?.score ?? 0,
      dimension: gameMetrics?.dimension ?? (selectedGame === "tmt" ? "consistencia" : null),
      total_time_played: 60,
      detailed_metrics: gameMetrics?.detailed_metrics ?? {}
    };

    console.log("📦 Enviando finalData:", finalData);

    try {
      const response = await sendGameResults(finalData);

      const creature = getCreatureForGame(selectedGame);

      setRevealedCreatures(prev => ({
        ...prev,
        [selectedGame]: creature
      }));


      // ✅ IMPORTANTE: usar "prev =>" para no perder el estado
      setCompletedGames(prev =>
        prev.includes(selectedGame) ? prev : [...prev, selectedGame]
      );

      // ✅ Trofeos: evitar duplicados y también usar prev
      if (response?.badge_awarded) {
        setChildAchievements(prev =>
          prev.includes(response.badge_awarded) ? prev : [...prev, response.badge_awarded]
        );
      }

      setResult({
        ...response,
        userScore: finalData.score,
        badge_awarded: response?.badge_awarded || null
      });

    } catch (error) {
      console.error(error);
      alert("Error guardando datos.");
    }
  };

  const getCreatureForGame = (gameCode) => {
    switch (gameCode) {
      case "cpt": return "🐺";
      case "go_no_go": return "🦊";
      case "tmt": return "🦄";
      case "vigilance": return "🐉";
      default: return "✨";
    }
  };


  // UI Helpers
  const progressPercent = Math.round((completedGames.length / games.length) * 100);

  const getPetMessage = () => {
    if (result?.badge_awarded) return "¡GUAU! ¡Un nuevo Trofeo!";
    if (result) return "¡Bien jugado! ¿Seguimos?";
    if (progressPercent === 0) return "¡Hola! Estoy listo para jugar.";
    if (progressPercent === 100) return "¡Misión Cumplida!";
    return `¡Vamos! Llevamos ${completedGames.length} de ${games.length}.`;
  };

  // Lógica del PIN
  const handlePinInput = (n) => { if (enteredPin.length < 4) setEnteredPin(p => p + n); };
  const handleDelete = () => setEnteredPin(p => p.slice(0, -1));
  const handleSubmitPin = () => {
    if (enteredPin === exitPin) navigate("/dashboard");
    else { setPinError(true); setEnteredPin(""); setTimeout(() => setPinError(false), 800); }
  };

  return (
    <div className="container-fluid min-vh-100 bg-light p-0 position-relative overflow-hidden font-sans">

      {/* Fondo con gradiente suave */}
      <div className="position-absolute top-0 start-0 w-100 h-100"
        style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(240, 249, 255) 0%, rgb(255, 255, 255) 90%)', zIndex: 0 }}></div>

      {/* --- HEADER DE SESIÓN --- */}
      {/* CORRECCIÓN VISUAL: Aumentamos padding-top (pt-5) y padding-bottom (pb-4) para dar aire al globo */}
      <div className="position-relative d-flex flex-column flex-md-row justify-content-between align-items-center px-4 pt-5 pb-4" style={{ zIndex: 10, marginTop: '10px' }}>

        {/* LADO IZQUIERDO: ROBOT Y DATOS */}
        <div className="d-flex align-items-center mb-3 mb-md-0">

          {/* MASCOTA INTERACTIVA (NeuroBot) */}
          {/* CORRECCIÓN: marginTop extra para bajar al robot y dejar espacio arriba para el globo */}
          <div className="me-4 cursor-pointer position-relative" style={{ marginTop: '40px' }}>
            <NeuroBot
              mood={progressPercent === 100 || result?.badge_awarded ? "excited" : result ? "happy" : "thinking"}
              message={getPetMessage()}
            />
          </div>

          <div className="mt-3">
            <h2 className="fw-bold m-0 text-dark mb-1 d-flex align-items-center">
              {childName}
              <span className="ms-2 badge bg-warning text-dark rounded-pill fs-6 border border-warning shadow-sm">
                ⭐ Nivel 1
              </span>
            </h2>
            {/* BARRA DE PROGRESO */}
            <div className="d-flex align-items-center mt-2">
              <div className="progress shadow-sm" style={{ height: '14px', width: '180px', backgroundColor: '#e2e8f0', borderRadius: '10px' }}>
                <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                  style={{ width: `${progressPercent}%`, borderRadius: '10px' }}></div>
              </div>
              <span className="ms-2 small fw-bold text-muted">{completedGames.length}/{games.length} Misiones</span>
            </div>
          </div>

          {/* MENSAJE PET */}
          <div className="d-flex justify-content-center mt-3">
            <div className="w-100 d-flex justify-content-center">
              <p className="fw-bold text-center" style={{ maxWidth: '100%', textAlign: 'center', marginLeft: '0', marginRight: '0' }}>
                {getPetMessage()}
              </p>
            </div>
          </div>


        </div>

        {/* LADO DERECHO: BOTONES */}
        <div className="d-flex gap-3">
          <button className="btn btn-white border shadow-sm rounded-pill px-4 fw-bold d-flex align-items-center hover-scale text-warning bg-white"
            onClick={() => setShowTrophyRoom(true)}>
            <Trophy size={20} className="me-2" /> Trofeos
            {childAchievements.length > 0 && <span className="ms-2 badge bg-warning text-white rounded-circle">{childAchievements.length}</span>}
          </button>

          <button className="btn btn-white border shadow-sm rounded-pill px-4 fw-bold text-secondary hover-scale bg-white" onClick={() => { setShowPinPad(true); setEnteredPin(""); }}>
            <Lock size={18} className="me-2 mb-1" /> Salir
          </button>
        </div>
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="container position-relative py-2" style={{ zIndex: 10 }}>

        {/* VISTA 1: RESULTADOS DEL JUEGO */}
        {result ? (
          <div className="row justify-content-center animate__animated animate__backInUp">
            <div className="col-md-8 col-lg-6">
              <div className="card border-0 shadow-lg rounded-5 overflow-hidden text-center bg-white mt-4">
                <div className={`py-4 ${result.userScore > 60 ? 'bg-success' : 'bg-primary'} text-white position-relative overflow-hidden`}>
                  {/* Confeti CSS simple en background */}
                  <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
                  <h1 className="fw-bold m-0">{result.userScore > 60 ? "¡EXCELENTE!" : "¡BIEN HECHO!"}</h1>
                </div>
                <div className="card-body p-5">

                  <div className="mb-4 transform-scale-1-2">
                    {/* El robot celebra aquí también */}
                    <NeuroBot mood="excited" />
                  </div>

                  <h2 className="display-3 fw-bold text-dark mb-1">{result.userScore}</h2>
                  <p className="text-muted text-uppercase small letter-spacing-2 mb-4 fw-bold">Puntuación</p>

                  {revealedCreatures?.[selectedGame] && (
                    <div className="mb-4 animate__animated animate__fadeInUp">
                      <div className="fw-bold text-success mb-1">
                        Mascota desbloqueada
                      </div>
                      <div style={{ fontSize: "4rem", lineHeight: "1" }}>
                        {revealedCreatures[selectedGame]}
                      </div>
                    </div>
                  )}


                  {result.badge_awarded && (
                    <div className="alert alert-warning border-warning d-inline-block px-4 py-3 rounded-4 mb-4 shadow-sm animate__animated animate__tada">
                      <div className="d-flex align-items-center">
                        <Trophy size={28} className="me-3" />
                        <div className="text-start">
                          <div className="small text-uppercase fw-bold opacity-75">Nuevo Logro</div>
                          <div className="fs-5 fw-bold">{ACHIEVEMENTS_LIST.find(a => a.id === result.badge_awarded)?.title || "Medalla Especial"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-grid gap-3">
                    <button className="btn btn-primary btn-lg rounded-pill fw-bold shadow-sm p-3" onClick={() => setResult(null)}>
                      CONTINUAR AVENTURA <Play size={20} className="ms-2 inline-block" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        ) : isPlaying ? (
          // VISTA 2: JUEGO ACTIVO (PHASER)
          <div className="rounded-5 shadow-lg overflow-hidden border border-4 border-white bg-black position-relative mx-auto mt-2" style={{ height: '75vh', maxWidth: '1000px' }}>
            {selectedGame === 'cpt' && <CPTGamePhaser key={`cpt-${runId}`} onGameEnd={handleGameEnd} />}
            {selectedGame === 'go_no_go' && <GoNoGoGamePhaser key={`go-${runId}`} onGameEnd={handleGameEnd} />}
            {selectedGame === 'tmt' && <TMTGamePhaser key={`tmt-${runId}`} onGameEnd={handleGameEnd} />}
            {selectedGame === 'vigilance' && <VigilanceGamePhaser key={`vig-${runId}`} onGameEnd={handleGameEnd} />}


            <button className="btn btn-danger btn-sm position-absolute top-0 end-0 m-4 rounded-pill px-4 py-2 shadow fw-bold hover-scale" onClick={() => setIsPlaying(false)}>
              ABORTAR MISION
            </button>
          </div>

        ) : (
          // VISTA 3: MAPA DE MISIONES (LOBBY)
          <div className="row g-4 mt-2">
            {games.map((game) => {
              const isCompleted = completedGames.includes(game.code);
              return (
                <div key={game.code} className="col-md-6 col-lg-3">
                  <div
                    className={`card h-100 border-0 shadow-sm rounded-5 position-relative transition-all 
                        ${isCompleted ? 'bg-light opacity-75 grayscale' : 'hover-lift cursor-pointer bg-white'}`}
                    onClick={() => !isCompleted && handlePlayGame(game.code)}
                    style={{ transform: isCompleted ? 'scale(0.98)' : 'scale(1)', overflow: "visible" }}
                  >
                    {/* Mascota misteriosa / revelada */}
                    <div className="position-absolute top-0 start-50 translate-middle" style={{ zIndex: 10 }}>
                      <div className="d-flex justify-content-center align-items-center">
                        {!isCompleted ? (
                          <span style={{ fontSize: "2.5rem", opacity: 0.35, filter: "grayscale(1)" }}>
                            👤
                          </span>
                        ) : (
                          <span style={{ fontSize: "2.5rem" }}>
                            {revealedCreatures[game.code] || "✨"}
                          </span>
                        )}
                      </div>
                    </div>

                    {isCompleted && (
                      <div className="position-absolute top-0 end-0 m-3 text-success animate__animated animate__fadeIn bg-white rounded-circle p-1 shadow-sm">
                        <CheckCircle size={32} fill="#dcfce7" />
                      </div>
                    )}

                    <div className={`card-body p-4 text-center d-flex flex-column align-items-center`}>
                      <div className={`p-4 rounded-circle mb-3 bg-${game.color} bg-opacity-10 text-${game.color} shadow-inner`}>
                        {game.icon}
                      </div>
                      <h4 className="fw-bold text-dark">{game.title}</h4>
                      <p className="text-muted small mb-4 px-2">{game.desc}</p>

                      <div className="mt-auto w-100">
                        {isCompleted ? (
                          <button className="btn btn-light text-muted w-100 rounded-pill fw-bold border" disabled>COMPLETADO</button>
                        ) : (
                          <button className={`btn btn-outline-${game.color} w-100 rounded-pill fw-bold py-2 shadow-sm`}>
                            <Play size={18} className="me-2 mb-1" /> JUGAR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* --- MODAL: SALÓN DE LA FAMA (TROFEOS) --- */}
      {showTrophyRoom && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, backdropFilter: 'blur(5px)' }}>
          <div className="bg-white rounded-5 shadow-2xl overflow-hidden animate__animated animate__bounceInUp" style={{ maxWidth: '650px', width: '95%', maxHeight: '85vh' }}>
            <div className="bg-warning p-4 d-flex justify-content-between align-items-center text-white bg-gradient">
              <h3 className="fw-bold m-0 d-flex align-items-center"><Trophy className="me-3" size={32} /> Salón de la Fama</h3>
              <button className="btn btn-link text-white p-0 hover-scale" onClick={() => setShowTrophyRoom(false)}><X size={32} /></button>
            </div>
            <div className="p-4 overflow-auto bg-light" style={{ maxHeight: '65vh' }}>
              <div className="row g-3">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  // Verificamos si el niño tiene este logro en su lista
                  const isUnlocked = childAchievements.includes(ach.id);
                  return (
                    <div key={ach.id} className="col-12">
                      <div className={`d-flex align-items-center p-3 rounded-4 border-2 transition-all
                                        ${isUnlocked ? 'bg-white border-warning shadow-sm scale-1' : 'bg-gray-100 border-light opacity-50'}`}>

                        <div className={`p-3 rounded-circle me-4 d-flex align-items-center justify-content-center shadow-sm
                                            ${isUnlocked ? ach.bg + ' ' + ach.color : 'bg-secondary text-white'}`}
                          style={{ width: '60px', height: '60px' }}>
                          {isUnlocked ? ach.icon : <Lock size={24} />}
                        </div>

                        <div className="flex-grow-1">
                          <h5 className={`fw-bold m-0 ${isUnlocked ? 'text-dark' : 'text-muted'}`}>{ach.title}</h5>
                          <p className="small m-0 text-muted">{ach.desc}</p>
                        </div>

                        {isUnlocked && (
                          <div className="ms-3 text-warning animate__animated animate__rubberBand">
                            <CheckCircle size={28} fill="currentColor" className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-3 bg-white border-top text-center text-muted small">
              ¡Sigue jugando para desbloquear más trofeos!
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: PIN PAD (SEGURIDAD) --- */}
      {showPinPad && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999 }}>
          <div className="bg-white p-4 rounded-4 shadow text-center" style={{ width: '320px' }}>
            <h5 className="mb-4 text-secondary">Bloqueo de Salida</h5>
            <div className="bg-light p-3 rounded mb-3 display-6 letter-spacing-2 fw-bold text-dark">
              {enteredPin ? enteredPin.replace(/./g, '•') : <span className="opacity-25">PIN</span>}
            </div>
            <div className="row g-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <div className="col-4" key={n}><button className="btn btn-outline-dark w-100 py-3 fw-bold rounded-3" onClick={() => handlePinInput(n.toString())}>{n}</button></div>)}
              <div className="col-4"><button className="btn btn-danger w-100 py-3 rounded-3" onClick={handleDelete}><Delete /></button></div>
              <div className="col-4"><button className="btn btn-outline-dark w-100 py-3 fw-bold rounded-3" onClick={() => handlePinInput("0")}>0</button></div>
              <div className="col-4"><button className="btn btn-success w-100 py-3 rounded-3" onClick={handleSubmitPin}><Lock /></button></div>
            </div>
            <button className="btn btn-link text-muted text-decoration-none" onClick={() => setShowPinPad(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;