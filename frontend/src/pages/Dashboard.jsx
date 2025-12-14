import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserChildren, createChild, deleteChild } from "../services/api";
import { PlusCircle, User, Gamepad2, Activity, Lock, Trash2, Calendar, X, FileText } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el formulario (Modal)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthDate, setNewChildBirthDate] = useState(""); 
  const [newChildGender, setNewChildGender] = useState("M");
  const [newChildNotes, setNewChildNotes] = useState(""); // Nuevo campo
  
  const [agePreview, setAgePreview] = useState(null); 

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

  const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return null;
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
    if (dateVal) {
        setAgePreview(calculateAge(dateVal));
    } else {
        setAgePreview(null);
    }
  };

  // Función para cerrar y limpiar el formulario
  const closeForm = () => {
      setShowAddForm(false);
      setNewChildName("");
      setNewChildBirthDate("");
      setNewChildNotes("");
      setAgePreview(null);
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!newChildName.trim() || !newChildBirthDate) {
      alert("Por favor, completa obligatoriamente el Nombre y la Fecha de Nacimiento.");
      return; 
    }

    try {
      await createChild(userId, {
        name: newChildName,
        birth_date: newChildBirthDate,
        gender: newChildGender,
        notes: newChildNotes
      });
      
      await loadChildren(userId);
      closeForm(); // Cierra el modal al guardar
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
          <button className="btn btn-success d-flex align-items-center fw-bold shadow-sm" onClick={() => setShowAddForm(true)}>
            <PlusCircle className="me-2" /> Agregar Nuevo
          </button>
        </div>

        {/* LISTA DE NIÑOS */}
        {loading ? <p className="text-center">Cargando...</p> : children.length === 0 ? (
          <div className="text-center py-5"><h4 className="text-muted">No tienes niños registrados.</h4></div>
        ) : (
          <div className="row">
            {children.map((child) => {
              const age = child.age !== undefined ? child.age : calculateAge(child.birth_date);
              
              return (
              <div key={child.id} className="col-md-4 mb-4">
                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all position-relative">
                  
                  <button 
                    className="btn btn-link text-danger position-absolute top-0 end-0 m-2"
                    onClick={() => handleDelete(child.id, child.name)}
                    title="Eliminar Perfil"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="card-body text-center mt-3">
                    <div className="avatar-circle bg-primary text-white mx-auto mb-3 d-flex align-items-center justify-content-center shadow-sm" style={{width: '70px', height: '70px', borderRadius: '50%', fontSize: '28px'}}>
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <h4 className="card-title fw-bold text-dark">{child.name}</h4>
                    
                    <p className="text-muted small mb-4">
                        {age !== null ? `${age} años` : "Edad pendiente"} • {child.gender === 'M' ? 'Niño' : 'Niña'}
                    </p>

                    <div className="d-grid gap-2">
                        <button 
                            className="btn btn-primary fw-bold py-2 shadow-sm"
                            onClick={() => initiatePlaySequence(child.id, child.name)}
                        >
                          <Gamepad2 className="me-2 inline-block" size={20} /> JUGAR TEST
                        </button>
                        
                        <button 
                            className="btn btn-outline-secondary fw-bold py-2"
                            onClick={() => navigate(`/results/${child.id}`)}
                        >
                          <Activity className="me-2 inline-block" size={20} /> VER RESULTADOS
                        </button>
                    </div>

                  </div>
                </div>
              </div>
            )})} 
          </div>
        )}
      </div>

      {/* --- MODAL DE AGREGAR NIÑO (MEJORA UX) --- */}
      {showAddForm && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="card border-0 shadow-lg animate__animated animate__fadeInDown" style={{maxWidth: '500px', width: '90%'}}>
            
            {/* Cabecera del Modal */}
            <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center pt-4 px-4">
                <h5 className="text-primary fw-bold m-0">Nuevo Paciente</h5>
                <button className="btn btn-link text-muted p-0" onClick={closeForm}><X size={24}/></button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="card-body px-4 pb-4">
              <form onSubmit={handleAddChild}>
                <div className="mb-3">
                  <label className="form-label small text-muted fw-bold">Nombre Completo *</label>
                  <input type="text" className="form-control" placeholder="Ej: Juan Pérez" value={newChildName} onChange={e => setNewChildName(e.target.value)} required />
                </div>
                
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted fw-bold">Fecha Nacimiento *</label>
                        <input type="date" className="form-control" value={newChildBirthDate} onChange={handleDateChange} required />
                        {agePreview !== null && <small className="text-success fw-bold"><Calendar size={12}/> Edad: {agePreview} años</small>}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label small text-muted fw-bold">Género</label>
                        <select className="form-select" value={newChildGender} onChange={e => setNewChildGender(e.target.value)}>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="form-label small text-muted fw-bold"><FileText size={14}/> Notas Clínicas (Opcional)</label>
                    <textarea 
                        className="form-control" 
                        rows="2" 
                        placeholder="Diagnóstico previo, TDAH, observaciones..."
                        value={newChildNotes}
                        onChange={e => setNewChildNotes(e.target.value)}
                    ></textarea>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button type="button" className="btn btn-light text-muted fw-bold" onClick={closeForm}>Cancelar</button>
                  <button type="submit" className="btn btn-primary fw-bold px-4">Guardar Registro</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PIN (Mantenido igual) */}
      {showPinModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
            <div className="bg-white p-4 rounded-4 shadow-lg text-center" style={{maxWidth: '350px'}}>
                <div className="text-primary mb-3"><Lock size={40}/></div>
                <h5 className="fw-bold mb-1">Modo Niño</h5>
                <p className="text-muted small mb-3">Ingresa un PIN para bloquear la salida</p>
                <form onSubmit={confirmPinAndPlay}>
                    <input type="password" inputMode="numeric" maxLength="4" className="form-control form-control-lg text-center fs-2 letter-spacing-2 mb-3" placeholder="••••" value={sessionPin} onChange={(e) => setSessionPin(e.target.value.replace(/[^0-9]/g, ''))} autoFocus />
                    <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={sessionPin.length !== 4}>COMENZAR</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;