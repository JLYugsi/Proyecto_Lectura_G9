import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserChildren, createChild } from "../services/api";
import { PlusCircle, User, Gamepad2, Activity } from "lucide-react"; // Iconos bonitos

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de "Nuevo Niño"
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAge, setNewChildAge] = useState("");
  const [newChildGender, setNewChildGender] = useState("M");

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
      // Calculamos una fecha de nacimiento aproximada basada en la edad (simplificación para UX)
      const birthYear = new Date().getFullYear() - newChildAge;
      const birthDate = `${birthYear}-01-01`;

      await createChild(userId, {
        name: newChildName,
        birth_date: birthDate,
        gender: newChildGender
      });
      
      // Recargar lista y cerrar formulario
      await loadChildren(userId);
      setShowAddForm(false);
      setNewChildName("");
      setNewChildAge("");
    } catch (error) {
      alert("Error al registrar niño");
    }
  };

  const handlePlay = (childId, childName) => {
    // Guardamos quién va a jugar y vamos al menú de juegos
    localStorage.setItem("current_child_id", childId);
    localStorage.setItem("current_child_name", childName);
    navigate("/gameroom");
  };

  return (
    <div className="container-fluid min-vh-100 bg-light">
      
      {/* NAVBAR SUPERIOR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center">
            <Activity className="me-2" /> NeuroGame Panel
          </span>
          <div className="d-flex align-items-center text-white">
            <User className="me-2" size={20} />
            <span className="me-3 fw-bold">{username}</span>
            <button 
              onClick={() => { localStorage.clear(); navigate("/"); }} 
              className="btn btn-sm btn-outline-light"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <div className="container">
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-secondary fw-bold">Mis Pacientes / Hijos</h2>
          <button 
            className="btn btn-success d-flex align-items-center fw-bold shadow-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <PlusCircle className="me-2" /> Agregar Nuevo
          </button>
        </div>

        {/* FORMULARIO DESPLEGABLE (ADD CHILD) */}
        {showAddForm && (
          <div className="card mb-4 border-0 shadow-sm animate__animated animate__fadeIn">
            <div className="card-body bg-white rounded">
              <h5 className="card-title text-primary mb-3">Registrar Nuevo Niño</h5>
              <form onSubmit={handleAddChild} className="row g-3">
                <div className="col-md-4">
                  <input 
                    type="text" className="form-control" placeholder="Nombre del niño"
                    value={newChildName} onChange={e => setNewChildName(e.target.value)} required 
                  />
                </div>
                <div className="col-md-2">
                  <input 
                    type="number" className="form-control" placeholder="Edad"
                    value={newChildAge} onChange={e => setNewChildAge(e.target.value)} required 
                  />
                </div>
                <div className="col-md-3">
                  <select 
                    className="form-select" 
                    value={newChildGender} onChange={e => setNewChildGender(e.target.value)}
                  >
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

        {/* LISTA DE NIÑOS (GRID) */}
        {loading ? (
          <p className="text-center text-muted">Cargando perfiles...</p>
        ) : children.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted">No tienes niños registrados aún.</h4>
            <p>Agrega uno arriba para comenzar las pruebas.</p>
          </div>
        ) : (
          <div className="row">
            {children.map((child) => (
              <div key={child.id} className="col-md-4 mb-4">
                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                  <div className="card-body text-center">
                    <div className="avatar-circle bg-primary text-white mx-auto mb-3 d-flex align-items-center justify-content-center" 
                         style={{width: '60px', height: '60px', borderRadius: '50%', fontSize: '24px'}}>
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="card-title fw-bold">{child.name}</h4>
                    <p className="text-muted mb-4">
                      {new Date().getFullYear() - new Date(child.birth_date).getFullYear()} años • {child.gender === 'M' ? 'Niño' : 'Niña'}
                    </p>
                    
                    <div className="d-grid gap-2">
                      <button 
                        className="btn btn-primary fw-bold d-flex align-items-center justify-content-center"
                        onClick={() => handlePlay(child.id, child.name)}
                      >
                        <Gamepad2 className="me-2" size={18} /> JUGAR TEST
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        Ver Resultados Históricos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;