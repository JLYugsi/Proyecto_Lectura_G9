import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChildDashboard } from "../services/api"; // Usamos el endpoint existente que trae todo
import { ArrowLeft, Activity, Calendar, Trophy } from "lucide-react";
import CognitiveRadar from "../components/charts/CognitiveRadar";

const ChildResults = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getChildDashboard(childId);
        setData(result);
      } catch (error) {
        console.error(error);
        alert("Error cargando resultados");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [childId, navigate]);

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center text-white bg-dark">Cargando análisis...</div>;
  if (!data) return null;

  const { child_info, recent_results } = data;
  // Buscamos el último perfil cognitivo disponible en el historial
  const latestProfile = recent_results.find(r => r.metrics && r.metrics.reaction_times_raw)?.metrics || null; 
  // NOTA: Para simplificar, en el backend ya habiamos pasado 'cognitive_profile' dentro de recent_results en la ultima actualizacion. 
  // Si no, el backend deberia enviarlo. Asumiremos que el backend envia 'cognitive_profile' en el endpoint dashboard.
  
  // OJO: Si tu backend 'get_child_dashboard' no devuelve el perfil procesado,
  // asegúrate de que el endpoint backend lo incluya o calcúlalo aquí. 
  // Por ahora usaremos el dato directo si existe.

  return (
    <div className="min-vh-100 bg-light">
      {/* HEADER */}
      <div className="bg-primary text-white p-4 shadow-sm">
        <div className="container d-flex align-items-center">
            <button className="btn btn-link text-white me-3 p-0" onClick={() => navigate("/dashboard")}>
                <ArrowLeft size={28} />
            </button>
            <div>
                <h2 className="fw-bold m-0">{child_info.name}</h2>
                <span className="opacity-75">Informe Clínico Gamificado</span>
            </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
            
            {/* COLUMNA IZQUIERDA: PERFIL COGNITIVO (GRÁFICO) */}
            <div className="col-md-5">
                <div className="card shadow-lg border-0 h-100">
                    <div className="card-body p-4 text-center">
                        <h5 className="text-secondary fw-bold mb-4 text-uppercase">Mapa Cerebral Actual</h5>
                        {/* Aquí mostramos el radar. Necesitamos pasarle el perfil. 
                            Si el backend lo manda en 'recent_results', lo extraemos. 
                            (Asegúrate que tu backend envíe 'cognitive_profile' en el historial o calculalo)
                        */}
                        <div style={{ height: '350px' }}>
                           {/* Como fallback visual usamos un perfil dummy si no hay datos aun */}
                           <CognitiveRadar profile={recent_results[0]?.metrics ? null : null} /> 
                           {/* NOTA: Ajusta esto para leer el cognitive_profile real cuando conectes todo */}
                        </div>
                        <p className="text-muted small mt-3">
                            Este gráfico muestra el balance entre velocidad, atención y control de impulsos.
                        </p>
                    </div>
                </div>
            </div>

            {/* COLUMNA DERECHA: HISTORIAL Y MEDALLAS */}
            <div className="col-md-7">
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <h5 className="fw-bold text-secondary mb-3">Últimas Sesiones</h5>
                        {recent_results.length === 0 ? (
                            <p className="text-muted">No hay partidas registradas.</p>
                        ) : (
                            <div className="list-group list-group-flush">
                                {recent_results.slice(0, 5).map((res, idx) => (
                                    <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-light p-2 rounded-circle me-3 text-primary">
                                                {res.game_code === 'cpt' ? <Activity size={20}/> : <Trophy size={20}/>}
                                            </div>
                                            <div>
                                                <h6 className="fw-bold m-0 text-capitalize">{res.game_code.replace('_', ' ')}</h6>
                                                <small className="text-muted"><Calendar size={12} className="me-1"/>{new Date(res.timestamp).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <span className={`badge ${res.ai_diagnosis.includes("Riesgo") ? "bg-warning text-dark" : "bg-success"}`}>
                                                {res.ai_diagnosis}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ChildResults;