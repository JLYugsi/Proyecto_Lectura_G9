import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
// IMPORTAMOS EL MONSTRUO
import AnimatedMonster from '../components/AnimatedMonster'; 

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    // ... (MANTÉN TU LÓGICA DE SUBMIT EXACTAMENTE IGUAL QUE ANTES) ...
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
        if (isRegistering) {
            if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
            await registerUser({ username, email, password });
            setSuccessMsg('¡Cuenta creada! Inicia sesión.');
            setIsRegistering(false);
            setPassword(''); setConfirmPassword('');
        } else {
            const data = await loginUser(username, password);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('username', data.username);
            navigate('/dashboard');
        }
    } catch (err) {
        setError(err.response?.data?.detail || 'Error de conexión');
    }
  };

  return (
    <div className="container-fluid vh-100 overflow-hidden">
      <div className="row h-100">
        
        {/* --- COLUMNA IZQUIERDA: AHORA CON EL MONSTRUO --- */}
        <div className="col-md-7 d-none d-md-flex flex-column align-items-center justify-content-center text-white p-5 position-relative">
            {/* Fondo degradado suave y moderno */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #a680ffff 100%)', // Indigo a Violeta
                zIndex: -1
            }}></div>

            {/* Componente del Monstruo */}
            <div className="mb-4" style={{ transform: 'scale(1.2)' }}>
                <AnimatedMonster />
            </div>

            <h1 className="display-4 fw-bold mb-3 animate__animated animate__fadeInUp">NeuroGame</h1>
            <p className="fs-5 text-center px-5 animate__animated animate__fadeInUp animate__delay-1s" style={{ opacity: 0.9 }}>
                {isRegistering 
                    ? "Únete a nuestra plataforma de detección temprana basada en gamificación e IA." 
                    : "Un entorno seguro y divertido para evaluar el desarrollo cognitivo de tus hijos."}
            </p>
        </div>

        {/* --- COLUMNA DERECHA: FORMULARIO (Igual que antes pero con retoques) --- */}
        <div className="col-md-5 d-flex align-items-center justify-content-center bg-white h-100 shadow-lg">
          
          <div className="p-5" style={{ width: '100%', maxWidth: '450px' }}>
             {/* Logo pequeño para móvil (ya que el monstruo se oculta en móvil) */}
             <div className="d-md-none text-center mb-4">
                 <h2 className="fw-bold text-primary">NeuroGame</h2>
             </div>

             <h2 className="fw-bold text-dark mb-2">
                {isRegistering ? 'Crear una cuenta' : '¡Hola de nuevo!'}
             </h2>
             <p className="text-muted mb-4">
                {isRegistering ? 'Comienza el viaje hoy mismo.' : 'Ingresa tus datos para continuar.'}
             </p>

             {/* ALERTAS DE ERROR/EXITO */}
             {error && <div className="alert alert-danger py-2 small rounded-3">{error}</div>}
             {successMsg && <div className="alert alert-success py-2 small rounded-3">{successMsg}</div>}

             <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-uppercase text-secondary">Usuario</label>
                  <input type="text" className="form-control form-control-lg bg-light border-0" 
                         value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>

                {isRegistering && (
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-uppercase text-secondary">Email</label>
                    <input type="email" className="form-control form-control-lg bg-light border-0" 
                           value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-bold small text-uppercase text-secondary">Contraseña</label>
                  <input type="password" className="form-control form-control-lg bg-light border-0" 
                         value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                
                {isRegistering && (
                   <div className="mb-4">
                     <label className="form-label fw-bold small text-uppercase text-secondary">Confirmar</label>
                     <input type="password" className="form-control form-control-lg bg-light border-0" 
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                   </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm transition-all">
                  {isRegistering ? 'Registrarse' : 'Ingresar'}
                </button>
             </form>

             <div className="text-center mt-4">
                <p className="text-muted small">
                    {isRegistering ? '¿Ya eres miembro?' : '¿Aún no tienes cuenta?'}
                    <button className="btn btn-link fw-bold text-decoration-none p-0 ms-1"
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}>
                        {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
                    </button>
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;