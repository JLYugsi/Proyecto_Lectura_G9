import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserChildren, createChild, deleteChild } from "../services/api";
import { PlusCircle, User, Gamepad2, Activity, Lock, Trash2, Calendar } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para formularios
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  
  const [newChildBirthDate, setNewChildBirthDate] = useState(""); 
  const [agePreview, setAgePreview] = useState(null); 
  
  const [newChildGender, setNewChildGender] = useState("M");

  // Estados para el PIN de Sesión
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

  // --- SOLUCIÓN: Función para calcular la edad visualmente (Reutilizable) ---
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return "?";
    
    const today = new Date();
    const birthDate = new Date(birthDateString);
    
    // Validar si la fecha es válida
    if (isNaN(birthDate.getTime())) return "?";

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleDateChange = (e) => {
    const dateVal = e.target.value;
    setNewChildBirthDate(dateVal);
    // Usamos la misma función de cálculo para el preview
    if (dateVal) {
        setAgePreview(calculateAge(dateVal));
    } else {
        setAgePreview(null);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();

    // Validación lógica
    if (!newChildName.trim() || !newChildBirthDate) {
      alert("Por favor, completa obligatoriamente el Nombre y la Fecha de Nacimiento.");
      return; 
    }

    try {
      await createChild(userId, {
        name: newChildName,
        birth_date: newChildBirthDate,
        gender: newChildGender
      });
      
      await loadChildren(userId);
      setShowAddForm(false);
      
      // Limpiar formulario
      setNewChildName("");
      setNewChildBirthDate("");
      setAgePreview(null);
    } catch (error) {
      console.error(error);
      alert("Error al registrar niño. Verifica los datos.");
    }
  };

  const handleDelete = async (childId, childName) => {
    const confirm = window.confirm(`¿Estás seguro de que quieres eliminar el perfil de ${childName}? Esta acción borrará todo su historial.`);
    
    if (confirm) {
        try {
            await deleteChild(childId);
            loadChildren(userId); 
        } catch (error) {
            alert("Error al eliminar el perfil.");
            console.error(error);
        }
    }
  };

  const initiatePlaySequence = (childId, childName) => {
    setSelectedChildForPlay({ id: childId, name: childName });
    setSessionPin(""); 
    setShowPinModal(true);
  };

  const confirmPinAndPlay = (e) => {
    e.preventDefault();
    if (sessionPin.length !== 4) {
        alert("El PIN debe tener 4 dígitos");
        return;
    }

    localStorage.setItem("current_child_id", selectedChildForPlay.id);
    localStorage.setItem("current_child_name", selectedChildForPlay.name);
    
    navigate("/gameroom", { state: { exitPin: sessionPin } });
  };

  return (
    <div className="container-fluid min-vh-100 bg-light">
      
      {/* NAVBAR */}
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-secondary fw-bold">Mis Pacientes / Hijos</h2>
          <button className="btn btn-success d-flex align-items-center fw-bold shadow-sm" onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle className="me-2" /> Agregar Nuevo
          </button>
        </div>

        {/* FORMULARIO DE AGREGAR */}
        {showAddForm && (
          <div className="card mb-4 border-0 shadow-sm animate__animated animate__fadeIn">
            <div className="card-body bg-white rounded">
              <h5 className="card-title text-primary mb-3">Registrar Nuevo Paciente</h5>
              <form onSubmit={handleAddChild} className="row g-3 align-items-end">
                
                {/* Nombre */}
                <div className="col-md-4">
                  <label className="form-label small text-muted">Nombre *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nombre completo" 
                    value={newChildName} 
                    onChange={e => setNewChildName(e.target.value)} 
                    required 
                  />
                </div>
                
                {/* Input de Fecha con Preview de Edad */}
                <div className="col-md-3">
                  <label className="form-label small text-muted">Fecha de Nacimiento *</label>
                  <div className="input-group">
                    <input 
                        type="date" 
                        className="form-control" 
                        value={newChildBirthDate} 
                        onChange={handleDateChange} 
                        required 
                    />
                  </div>
                  {agePreview !== null && (
                      <div className="form-text text-success fw-bold">
                         <Calendar size={12} className="me-1"/>
                         Edad: {agePreview} años
                      </div>
                  )}
                </div>

                {/* Género */}
                <div className="col-md-2">
                   <label className="form-label small text-muted">Género</label>
                   <select className="form-select" value={newChildGender} onChange={e => setNewChildGender(e.target.value)}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                {/* Botón */}
                <div className="col-md-3">
                  <button type="submit" className="btn btn-primary w-100">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LISTA DE NIÑOS */}
        {loading ? <p className="text-center">Cargando...</p> : children.length === 0 ? (
          <div className="text-center py-5"><h4 className="text-muted">No tienes niños registrados.</h4></div>
        ) : (
          <div className="row">
            {children.map((child) => (
              <div key={child.id} className="col-md-4 mb-4">
                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all position-relative">
                  
                  {/* BOTÓN ELIMINAR */}
                  <button 
                    className="btn btn-link text-danger position-absolute top-0 end-0 m-2"
                    onClick={() => handleDelete(child.id, child.name)}
                    title="Eliminar Perfil"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="card-body text-center mt-3">
                    {/* AVATAR */}
                    <div className="avatar-circle bg-primary text-white mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px', borderRadius: '50%', fontSize: '24px'}}>
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* DATOS */}
                    <h4 className="card-title fw-bold">{child.name}</h4>
                    
                    {/* CORRECCIÓN AQUÍ: Calculamos la edad si child.age falla */}
                    <p className="text-muted small mb-4">
                        {child.age || calculateAge(child.birth_date)} años • {child.gender === 'M' ? 'Niño' : 'Niña'}
                    </p>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="d-grid gap-2">
                        <button 
                            className="btn btn-primary fw-bold d-flex align-items-center justify-content-center py-2"
                            onClick={() => initiatePlaySequence(child.id, child.name)}
                        >
                          <Gamepad2 className="me-2" size={20} /> JUGAR TEST
                        </button>
                        
                        <button 
                            className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center py-2"
                            onClick={() => navigate(`/results/${child.id}`)}
                        >
                          <Activity className="me-2" size={20} /> VER RESULTADOS
                        </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE PIN DE SESIÓN */}
      {showPinModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="bg-white p-4 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{maxWidth: '400px'}}>
                <div className="text-primary mb-3"><Lock size={40}/></div>
                <h4 className="fw-bold">Seguridad Parental</h4>
                <p className="text-muted small">Configura un PIN de 4 dígitos para esta sesión.<br/>(Lo necesitarás para salir del juego)</p>
                
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