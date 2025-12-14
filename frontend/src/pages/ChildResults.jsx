import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChildDashboard } from "../services/api"; 
import { ArrowLeft, Activity, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import CognitiveRadar from "../components/charts/CognitiveRadar"; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';

// Componente de Tarjeta Individual
const GameAnalysisCard = ({ result }) => {
  const safeScore = Number(result.score) || 0;
  
  const chartData = [
    { name: 'Niño/a', valor: safeScore, color: result.isAlert ? '#dc3545' : '#198754' },
    { name: 'Norma', valor: result.average, color: '#adb5bd' }
  ];

  return (
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 className="fw-bold text-uppercase m-0 text-primary">{result.gameName}</h6>
            <small className="text-muted">{result.metricName}</small>
          </div>
          {result.isAlert ? (
            <span className="badge bg-danger-subtle text-danger border border-danger rounded-pill d-flex align-items-center">
              <AlertTriangle size={12} className="me-1" /> Atención
            </span>
          ) : (
             <span className="badge bg-success-subtle text-success border border-success rounded-pill d-flex align-items-center">
              <CheckCircle size={12} className="me-1" /> Normal
            </span>
          )}
        </div>

        <div style={{ height: '180px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={70} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <ReferenceLine x={result.threshold} stroke="#dc3545" strokeDasharray="3 3" />
              <Bar dataKey="valor" barSize={18} radius={[0, 10, 10, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-end">
          <small className="text-muted fst-italic">
             Puntuación: <strong>{safeScore}</strong>
          </small>
        </div>
      </div>
    </div>
  );
};

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

  const uniqueLatestSessions = useMemo(() => {
    if (!data || !data.recent_results) return [];
    const uniqueMap = new Map();
    const sorted = [...data.recent_results].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sorted.forEach(session => {
        const code = session.game_code ? session.game_code.toLowerCase() : 'unknown';
        if (!uniqueMap.has(code)) {
            uniqueMap.set(code, session);
        }
    });
    return Array.from(uniqueMap.values());
  }, [data]);

  // --- CORAZÓN DEL MAPA CEREBRAL ---
  // Combina los perfiles calculados por la IA en el backend
  const aggregatedProfile = useMemo(() => {
      let combined = {
        atencion: 50,    // Valor base neutro
        impulsividad: 50,
        velocidad: 50,
        consistencia: 50
      };

      // Recorremos las últimas sesiones para "armar" el perfil más actualizado
      uniqueLatestSessions.forEach(session => {
          const code = session.game_code ? session.game_code.toLowerCase() : '';
          const profile = session.cognitive_profile; // Datos directos de la IA

          if (profile) {
              // Si tenemos datos de IA, los usamos según el juego especializado
              if (code.includes('cpt')) {
                 combined.atencion = profile.atencion; 
                 combined.consistencia = profile.consistencia; // CPT mide bien consistencia
              } 
              else if (code.includes('go_no_go') || code.includes('gonogo')) {
                 combined.impulsividad = profile.impulsividad; 
              } 
              else if (code.includes('vigilance') || code.includes('vigilancia')) {
                 combined.velocidad = profile.velocidad; 
              } 
              else if (code.includes('tmt')) {
                 // TMT mide flexibilidad, que en nuestro radar simplificado mapeamos a consistencia/velocidad
                 // O si quisieras ser estricto, podrías promediar.
                 combined.velocidad = (combined.velocidad + profile.velocidad) / 2;
              }
          } else {
             // Fallback por si hay datos viejos sin perfil de IA (Score manual)
             const score = Number(session.score) || 0;
             if (code.includes('cpt')) combined.atencion = score;
             if (code.includes('go')) combined.impulsividad = score;
             if (code.includes('vigilance')) combined.velocidad = score;
          }
      });
      return combined;
  }, [uniqueLatestSessions]);

  // Procesador de datos INTELIGENTE: Prioriza el perfil de IA sobre el score bruto
  const processGameData = (rawResult) => {
    // 1. Intentamos obtener el puntaje del Perfil Cognitivo (0-100)
    // Si existe perfil de IA, usamos esos valores. Si no, normalizamos el score bruto.
    let aiScore = 0;
    const profile = rawResult.cognitive_profile;
    const code = rawResult.game_code ? rawResult.game_code.toLowerCase() : '';

    if (profile) {
        if (code.includes('cpt')) aiScore = profile.atencion;
        else if (code.includes('go')) aiScore = profile.impulsividad;
        else if (code.includes('vigilance')) aiScore = profile.velocidad;
        else if (code.includes('tmt')) aiScore = profile.consistencia; // O velocidad
        else aiScore = (profile.atencion + profile.velocidad) / 2;
    } else {
        // FALLBACK: Si es un dato viejo sin perfil IA, tratamos de normalizar
        // Si el score es > 100 (ej. 900), asumimos que es Arcade y lo topeamos visualmente
        // para no romper la gráfica, o mostramos 0 si no es confiable.
        const rawScore = Number(rawResult.score) || 0;
        aiScore = rawScore > 100 ? 100 : rawScore; 
    }

    let processed = {
      id: rawResult.id || Math.random(),
      gameName: rawResult.game_code || "Juego",
      metricName: "Índice Cognitivo", // Nombre más científico
      score: aiScore, // AQUI USAMOS EL SCORE NORMALIZADO (0-100)
      rawScoreDisplay: rawResult.score, // Guardamos el bruto solo para mostrar texto si quieres
      average: 75, // Norma estándar más realista
      threshold: 60, // Umbral de alerta clínica
      isAlert: false
    };

    if (code.includes('cpt')) {
      processed.gameName = "Atención Sostenida (CPT)";
      processed.metricName = "Capacidad Atencional";
      processed.average = 80;
      processed.threshold = 60;
    } else if (code.includes('go_no_go')) {
      processed.gameName = "Control Inhibitorio";
      processed.metricName = "Control de Impulsos";
      processed.average = 80; 
      processed.threshold = 55; 
    } else if (code.includes('vigilance') || code.includes('vigilancia')) {
        processed.gameName = "Vigilancia";
        processed.metricName = "Velocidad de Procesamiento";
        processed.average = 85;
        processed.threshold = 65;
    } else if (code.includes('tmt')) {
        processed.gameName = "Flexibilidad Cognitiva (TMT)";
        processed.metricName = "Adaptabilidad";
        processed.average = 75;
        processed.threshold = 50;
    }

    // La alerta se activa si el índice cognitivo es menor al umbral
    processed.isAlert = processed.score < processed.threshold;
    
    return processed;
  };

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center text-white bg-dark">Cargando...</div>;
  if (!data) return null;

  const { child_info, recent_results } = data;
  
  return (
    <div className="min-vh-100 bg-light">
      <div className="bg-primary text-white p-4 shadow-sm">
        <div className="container d-flex align-items-center">
            <button className="btn btn-link text-white me-3 p-0" onClick={() => navigate("/dashboard")}>
                <ArrowLeft size={28} />
            </button>
            <div>
                <h2 className="fw-bold m-0">{child_info.name}</h2>
                <span className="opacity-75">Informe Gráfico</span>
            </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
            
            <div className="col-md-5">
                <div className="card shadow-lg border-0 h-100 sticky-top" style={{top: '20px', zIndex: 1}}>
                    <div className="card-body p-4 text-center">
                        <h5 className="text-secondary fw-bold mb-4 text-uppercase">Mapa Cerebral Actual</h5>
                        
                        <div style={{ height: '350px' }}>
                           <CognitiveRadar profile={aggregatedProfile} /> 
                        </div>

                        <div className="alert alert-light border mt-4 text-start">
                            <h6 className="fw-bold text-dark"><Activity size={16} className="me-2"/>Interpretación</h6>
                            <p className="small text-muted mb-0">
                                Gráfico generado combinando resultados de IA: Atención ({aggregatedProfile.atencion}), Velocidad ({aggregatedProfile.velocidad}), Impulsividad ({aggregatedProfile.impulsividad}).
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-md-7">
                <h5 className="fw-bold text-secondary mb-3 ps-2">Última Sesión por Juego</h5>
                
                {uniqueLatestSessions.length === 0 ? (
                    <div className="card p-5 text-center text-muted shadow-sm border-0">
                        <Activity size={40} className="mb-3 opacity-25 mx-auto" />
                        <p>No hay partidas registradas aún.</p>
                    </div>
                ) : (
                    <div className="row">
                        {uniqueLatestSessions.map((res, idx) => {
                            const processedData = processGameData(res);
                            return (
                                <div key={idx} className="col-12">
                                    <GameAnalysisCard result={processedData} />
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-4 pt-4 border-top">
                    <h6 className="text-muted fw-bold text-uppercase small mb-3">Historial Completo</h6>
                    <div className="list-group list-group-flush bg-white rounded shadow-sm" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {recent_results.map((res, idx) => (
                             <div key={idx} className="list-group-item d-flex justify-content-between align-items-center small py-2 border-bottom">
                                <span className="text-capitalize text-secondary fw-semibold">
                                    {res.game_code}
                                </span>
                                <div className="text-end">
                                    <span className={`badge me-2 ${res.score >= 60 ? 'bg-light text-success' : 'bg-light text-danger'}`}>
                                        Score: {isNaN(res.score) ? 0 : Math.round(Number(res.score) || 0)}
                                    </span>
                                    <span className="text-muted d-inline-flex align-items-center">
                                        <Calendar size={12} className="me-1"/>
                                        {new Date(res.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ChildResults;