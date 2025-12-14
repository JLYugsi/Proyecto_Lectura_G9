import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import AnimatedMonster from '../components/AnimatedMonster'; 

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // ESTADO: Controla si el monstruo se tapa los ojos
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (isRegistering && password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    try {
        if (isRegistering) {
            if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
            await registerUser({ username, email, password });
            setSuccessMsg('¡Cuenta creada! Inicia sesión.');
            setIsRegistering(false); setPassword(''); setConfirmPassword('');
        } else {
            const data = await loginUser(username, password);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('username', data.username);
            navigate('/dashboard');
        }
    } catch (err) {
        setError(err.response?.data?.detail || 'Error de conexión.');
    }
  };

  return (
    <div className="container-fluid vh-100 w-100 overflow-hidden p-0 bg-white">
      <div className="row h-100 g-0">
        
        {/* --- COLUMNA IZQUIERDA: VISUAL --- */}
        <div className="col-md-7 d-none d-md-flex flex-column align-items-center justify-content-center position-relative p-5 text-white h-100">
            
            {/* FONDO DEGRADADO CORREGIDO (Más contraste y luminosidad) */}
            <div style={{
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0,
                // Degradado más suave y luminoso: Índigo claro a Violeta claro
                background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', 
                zIndex: 0
            }}></div>

            <div style={{ zIndex: 2, textAlign: 'center' }}>
                <div className="mb-4 transition-transform" style={{ transform: 'scale(1.4)' }}>
                    <AnimatedMonster isBlind={isPasswordFocused} />
                </div>

                <h1 className="display-3 fw-bolder mb-3 animate__animated animate__fadeInUp" 
                    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.2)', letterSpacing: '-1px' }}>
                    NeuroGame
                </h1>
                <p className="fs-4 fw-light px-5 animate__animated animate__fadeInUp animate__delay-0.5s" 
                   style={{ opacity: 0.95, maxWidth: '600px', margin: '0 auto', lineHeight: '1.4', fontWeight: '400' }}>
                    {isRegistering 
                        ? "Detección temprana de TDAH mediante evaluación gamificada e Inteligencia Artificial." 
                        : "Tu plataforma de evaluación cognitiva. Segura, divertida y precisa."}
                </p>
            </div>
        </div>

        {/* --- COLUMNA DERECHA: FORMULARIO (Sin cambios) --- */}
        <div className="col-md-5 d-flex align-items-center justify-content-center bg-white h-100 shadow-lg py-5" style={{zIndex: 10}}>
          <div className="p-5 w-100 animate__animated animate__fadeIn" style={{ maxWidth: '500px' }}>
             
             <div className="d-md-none text-center mb-4">
                 <h2 className="fw-bold text-primary display-5">NeuroGame</h2>
             </div>

             <div className="mb-5 pb-2 border-bottom">
                 <h2 className="fw-bold text-dark mb-2 display-6">
                    {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
                 </h2>
                 <p className="text-muted fs-5">
                    {isRegistering ? 'Completa los datos para comenzar el viaje.' : 'Ingresa tus credenciales para continuar.'}
                 </p>
             </div>

             {error && <div className="alert alert-danger py-3 rounded-3 fw-semibold d-flex align-items-center animate__animated animate__headShake"><i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i> {error}</div>}
             {successMsg && <div className="alert alert-success py-3 rounded-3 fw-semibold d-flex align-items-center animate__animated animate__fadeIn"><i className="bi bi-check-circle-fill me-2 fs-5"></i> {successMsg}</div>}

             <form onSubmit={handleSubmit}>
                <div className="mb-4 form-floating">
                  <input 
                    type="text" className="form-control form-control-lg bg-light border-0 fw-bold" id="floatingUser" placeholder="Usuario"
                    value={username} onChange={(e) => setUsername(e.target.value)} required 
                  />
                  <label htmlFor="floatingUser" className="text-muted">Usuario</label>
                </div>

                {isRegistering && (
                  <div className="mb-4 form-floating">
                    <input 
                        type="email" className="form-control form-control-lg bg-light border-0 fw-bold" id="floatingEmail" placeholder="Email"
                        value={email} onChange={(e) => setEmail(e.target.value)} required 
                    />
                    <label htmlFor="floatingEmail" className="text-muted">Email</label>
                  </div>
                )}

                <div className="mb-4 form-floating">
                  <input 
                    type="password" className="form-control form-control-lg bg-light border-0 fw-bold font-monospace" id="floatingPass" placeholder="Contraseña"
                    value={password} onChange={(e) => setPassword(e.target.value)} 
                    onFocus={() => setIsPasswordFocused(true)} 
                    onBlur={() => setIsPasswordFocused(false)}
                    required 
                  />
                   <label htmlFor="floatingPass" className="text-muted">Contraseña</label>
                </div>
                
                {isRegistering && (
                   <div className="mb-4 form-floating">
                     <input 
                        type="password" className="form-control form-control-lg bg-light border-0 fw-bold font-monospace" id="floatingConfirm" placeholder="Confirmar"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        required 
                     />
                      <label htmlFor="floatingConfirm" className="text-muted">Confirmar Contraseña</label>
                   </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm rounded-3 py-3 fs-5 text-uppercase letter-spacing-1 hover-scale transition-all mt-3">
                  {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
                </button>
             </form>

             <div className="text-center mt-5">
                <p className="text-muted mb-0 fs-6">
                    {isRegistering ? '¿Ya tienes una cuenta?' : '¿Aún no tienes acceso?'}
                    <button className="btn btn-link fw-bold text-decoration-none p-0 ms-2 text-primary fs-6"
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}>
                        {isRegistering ? 'Inicia Sesión aquí' : 'Crea una cuenta gratis'}
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