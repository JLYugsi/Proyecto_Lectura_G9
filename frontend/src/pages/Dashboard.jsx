import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserChildren, createChild } from "../services/api";
import { PlusCircle, User, Gamepad2, Activity, Lock } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para formularios
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState("");
  const [newChildGender, setNewChildGender] = useState("M");

  // --- NUEVO: ESTADOS PARA EL PIN DE SESIÓN ---
  const [showPinModal, setShowPinModal] = useState(false);
  const [sessionPin, setSessionPin] = useState("");
  const [selectedChildForPlay, setSelectedChildForPlay] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    const storedId = localStorage.getItem("user_id");
    
    if (!storedUser || !storedId) {
      navigate("/");
      return;
    }
    
    setUsername(storedUser);
    setUserId(storedId);
    loadChildren(storedId);
  }, [navigate]);

  const loadChildren = async (id) => {
    try {
      const data = await getUserChildren(id);
      setChildren(data);
    } catch (error) {
      console.error("Error cargando hijos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    try {
      const birthYear = new Date().getFullYear() - newChildAge;
      const birthDate = `${birthYear}-01-01`;

      await createChild(userId, {
        name: newChildName,
        birth_date: birthDate,
        gender: newChildGender
      });
      
      await loadChildren(userId);
      setShowAddForm(false);
      setNewChildName("");
      setNewChildAge("");
    } catch (error) {
      alert("Error al registrar niño");
    }
  };

  // 1. PRIMERO: Al dar click en Jugar, abrimos el modal del PIN
  const initiatePlaySequence = (childId, childName) => {
    setSelectedChildForPlay({ id: childId, name: childName });
    setSessionPin(""); 
    setShowPinModal(true); // Abrir modal
  };

  // 2. SEGUNDO: El padre confirma el PIN y vamos al juego
  const confirmPinAndPlay = (e) => {
    e.preventDefault();
    if (sessionPin.length !== 4) {
        alert("El PIN debe tener 4 dígitos");
        return;
    }

    // Guardamos datos básicos
    localStorage.setItem("current_child_id", selectedChildForPlay.id);
    localStorage.setItem("current_child_name", selectedChildForPlay.name);
    
    // NAVEGAMOS ENVIANDO EL PIN COMO ESTADO (No se guarda en localStorage por seguridad visual)
    navigate("/gameroom", { state: { exitPin: sessionPin } });
  };

  return (
    <div className="container-fluid min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center">
            <Activity className="me-2" /> NeuroGame Panel
          </span>
          <div className="d-flex align-items-center text-white">
            <User className="me-2" size={20} />
            <span className="me-3 fw-bold">{username}</span>
            <button onClick={() => { localStorage.clear(); navigate("/"); }} className="btn btn-sm btn-outline-light">
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-secondary fw-bold">Mis Pacientes / Hijos</h2>
          <button className="btn btn-success d-flex align-items-center fw-bold shadow-sm" onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle className="me-2" /> Agregar Nuevo
          </button>
        </div>

        {/* FORMULARIO AGREGAR NIÑO */}
        {showAddForm && (
          <div className="card mb-4 border-0 shadow-sm animate__animated animate__fadeIn">
            <div className="card-body bg-white rounded">
              <h5 className="card-title text-primary mb-3">Registrar Nuevo Niño</h5>
              <form onSubmit={handleAddChild} className="row g-3">
                <div className="col-md-4">
                  <input type="text" className="form-control" placeholder="Nombre" value={newChildName} onChange={e => setNewChildName(e.target.value)} required />
                </div>
                <div className="col-md-2">
                  <input type="number" className="form-control" placeholder="Edad" value={newChildAge} onChange={e => setNewChildAge(e.target.value)} required />
                </div>
                <div className="col-md-3">
                  <select className="form-select" value={newChildGender} onChange={e => setNewChildGender(e.target.value)}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button type="submit" className="btn btn-primary w-100">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LISTA NIÑOS */}
        {loading ? <p className="text-center">Cargando...</p> : children.length === 0 ? (
          <div className="text-center py-5"><h4 className="text-muted">No tienes niños registrados.</h4></div>
        ) : (
          <div className="row">
            {children.map((child) => (
              <div key={child.id} className="col-md-4 mb-4">
                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                  <div className="card-body text-center">
                    <div className="avatar-circle bg-primary text-white mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px', borderRadius: '50%', fontSize: '24px'}}>
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="card-title fw-bold">{child.name}</h4>
                    <p className="text-muted mb-4">
                       {child.birth_date ? new Date().getFullYear() - new Date(child.birth_date).getFullYear() : 'N/A'} años • {child.gender === 'M' ? 'Niño' : 'Niña'}
                    </p>
                    <button 
                        className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center"
                        onClick={() => initiatePlaySequence(child.id, child.name)}
                    >
                      <Gamepad2 className="me-2" size={18} /> JUGAR TEST
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL PARA CONFIGURAR EL PIN DE SESIÓN --- */}
      {showPinModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="bg-white p-4 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{maxWidth: '400px'}}>
                <div className="text-primary mb-3"><Lock size={40}/></div>
                <h4 className="fw-bold">Seguridad Parental</h4>
                <p className="text-muted small">Configura un PIN de 4 dígitos para esta sesión. <br/>Lo necesitarás para salir del juego.</p>
                
                <form onSubmit={confirmPinAndPlay}>
                    <input 
                        type="password" 
                        inputMode="numeric" 
                        maxLength="4"
                        className="form-control form-control-lg text-center fs-2 letter-spacing-2 mb-4" 
                        placeholder="••••"
                        value={sessionPin}
                        onChange={(e) => setSessionPin(e.target.value.replace(/[^0-9]/g, ''))}
                        autoFocus
                    />
                    <div className="d-grid gap-2">
                        <button type="submit" className="btn btn-primary btn-lg fw-bold" disabled={sessionPin.length !== 4}>
                            CONFIRMAR E INICIAR
                        </button>
                        <button type="button" className="btn btn-link text-muted" onClick={() => setShowPinModal(false)}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;