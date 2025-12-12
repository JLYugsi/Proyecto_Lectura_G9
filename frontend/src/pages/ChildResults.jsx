import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChildDashboard } from "../services/api"; 
import { ArrowLeft, Activity, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import CognitiveRadar from "../components/charts/CognitiveRadar"; 
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

// --- SUB-COMPONENTE: Tarjeta de Análisis Individual ---
const GameAnalysisCard = ({ result }) => {
  const chartData = [
    {
      name: 'Niño/a',
      valor: result.score,
      color: result.isAlert ? '#dc3545' : '#198754' 
    },
    {
      name: 'Norma Edad',
      valor: result.average,
      color: '#adb5bd' 
    }
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
              <AlertTriangle size={12} className="me-1" /> Atención Requerida
            </span>
          ) : (
             <span className="badge bg-success-subtle text-success border border-success rounded-pill d-flex align-items-center">
              <CheckCircle size={12} className="me-1" /> Dentro de norma
            </span>
          )}
        </div>

        <div style={{ height: '200px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <ReferenceLine 
                x={result.threshold} 
                stroke="#dc3545" 
                strokeDasharray="5 5" 
                label={{ position: 'top', value: 'Límite', fill: '#dc3545', fontSize: 10 }} 
              />
              <Bar dataKey="valor" barSize={20} radius={[0, 10, 10, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-end">
          <small className="text-muted fst-italic">
            Puntuación: <strong>{result.score}</strong> (Límite: {result.threshold})
          </small>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
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

  // --- NUEVA LÓGICA DE FILTRADO ---
  // Extrae SOLO la última sesión de cada juego único para los gráficos
  const uniqueLatestSessions = useMemo(() => {
    if (!data || !data.recent_results) return [];
    
    const uniqueMap = new Map();
    
    // Asumiendo que el backend devuelve ordenado por fecha (más reciente primero).
    // Si no, habría que ordenar data.recent_results.sort(...) antes.
    data.recent_results.forEach(session => {
        // Usamos el game_code como clave. Si ya existe, no lo sobrescribimos 
        // (porque el primero que encontramos es el más reciente).
        if (!uniqueMap.has(session.game_code)) {
            uniqueMap.set(session.game_code, session);
        }
    });

    return Array.from(uniqueMap.values());
  }, [data]);

  // --- LÓGICA DEL RADAR ---
  // Combina las métricas de las últimas sesiones únicas para crear un perfil completo
  const aggregatedProfile = useMemo(() => {
      let combinedMetrics = {};
      uniqueLatestSessions.forEach(session => {
          if (session.metrics) {
              combinedMetrics = { ...combinedMetrics, ...session.metrics };
          }
      });
      return Object.keys(combinedMetrics).length > 0 ? combinedMetrics : null;
  }, [uniqueLatestSessions]);


  const processGameData = (rawResult) => {
    let processed = {
      id: rawResult.id || Math.random(),
      gameName: rawResult.game_code || "Juego General",
      metricName: "Puntuación General",
      score: 0,
      average: 50, 
      threshold: 40,
      isAlert: false
    };

    // LÓGICA CPT (Atención Sostenida)
    if (rawResult.game_code === 'cpt') {
      processed.gameName = "Atención Sostenida (CPT)";
      processed.metricName = "Precisión / Atención (%)";
      // CPT suele medir precisión (accuracy). Más alto es mejor.
      processed.score = rawResult.metrics?.vigilance_specific?.accuracy 
                        ? Math.round(rawResult.metrics.vigilance_specific.accuracy * 100) 
                        : (rawResult.metrics?.accuracy || 0);
      processed.average = 80; // Norma esperada
      processed.threshold = 60; // Debajo de 60 es alerta
      processed.isAlert = processed.score < processed.threshold;
    } 
    // LÓGICA VIGILANCIA (Radar)
    else if (rawResult.game_code === 'vigilance') {
        processed.gameName = "Vigilancia & Rastreo";
        processed.metricName = "Objetivos Encontrados (%)";
        // Convertimos accuracy (0-1) a porcentaje (0-100)
        const acc = rawResult.metrics?.vigilance_specific?.accuracy || 0;
        processed.score = Math.round(acc * 100);
        processed.average = 85;
        processed.threshold = 70;
        processed.isAlert = processed.score < processed.threshold;
    }
    // OTROS JUEGOS (Stroop, etc.)
    else {
        // Fallback genérico usando el score global
        processed.score = rawResult.score || 0;
        processed.average = 70;
        processed.threshold = 50;
        processed.isAlert = processed.score < processed.threshold;
    }
    
    return processed;
  };

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center text-white bg-dark">Cargando análisis...</div>;
  if (!data) return null;

  const { child_info, recent_results } = data; // recent_results sigue teniendo TODO el historial
  
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
                <span className="opacity-75">Informe Gráfico de Síntomas</span>
            </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-4">
            
            {/* COLUMNA IZQUIERDA: PERFIL COGNITIVO GLOBAL (RADAR) */}
            <div className="col-md-5">
                <div className="card shadow-lg border-0 h-100 sticky-top" style={{top: '20px', zIndex: 1}}>
                    <div className="card-body p-4 text-center">
                        <h5 className="text-secondary fw-bold mb-4 text-uppercase">Mapa Cerebral Actual</h5>
                        
                        <div style={{ height: '350px' }}>
                           {/* AHORA USAMOS EL PERFIL AGREGADO DE LAS ÚLTIMAS SESIONES ÚNICAS */}
                           <CognitiveRadar profile={aggregatedProfile} /> 
                        </div>

                        <div className="alert alert-light border mt-4 text-start">
                            <h6 className="fw-bold text-dark"><Activity size={16} className="me-2"/>Interpretación Rápida</h6>
                            <p className="small text-muted mb-0">
                                Este gráfico combina los resultados más recientes de cada prueba distinta. Un área amplia indica un desarrollo equilibrado de las funciones ejecutivas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUMNA DERECHA: ANÁLISIS DETALLADO POR JUEGO */}
            <div className="col-md-7">
                <h5 className="fw-bold text-secondary mb-3 ps-2">Detalle de Pruebas (Última Sesión)</h5>
                
                {/* BARRA DE PROGRESO DE EVALUACIÓN COMPLETA */}
                {/* Calculamos en base a uniqueLatestSessions (cuántos juegos distintos ha jugado) */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body py-3">
                        <div className="d-flex justify-content-between small text-muted mb-2">
                            <span className="fw-bold text-uppercase" style={{fontSize: '0.8rem'}}>Estado de la Evaluación</span>
                            {/* Suponemos que hay 3 o 4 juegos totales en tu sistema */}
                            <span className="fw-bold">{uniqueLatestSessions.length} / 3 Tests Completados</span>
                        </div>
                        
                        <div className="progress" style={{ height: '8px', backgroundColor: '#e9ecef' }}>
                            <div 
                                className={`progress-bar ${uniqueLatestSessions.length < 3 ? 'bg-warning progress-bar-striped' : 'bg-success'}`} 
                                role="progressbar" 
                                style={{ width: `${Math.min((uniqueLatestSessions.length / 3) * 100, 100)}%` }}
                            ></div>
                        </div>

                        {uniqueLatestSessions.length < 3 && (
                            <div className="mt-2 d-flex align-items-center text-muted">
                                <AlertTriangle size={14} className="text-warning me-2" />
                                <small style={{fontSize: '0.75rem'}}>
                                    Faltan pruebas por realizar para un diagnóstico completo.
                                </small>
                            </div>
                        )}
                    </div>
                </div>

                {/* TARJETAS DE GRÁFICOS */}
                {/* AQUÍ ESTÁ EL CAMBIO CLAVE: Mapeamos uniqueLatestSessions, no todo el historial */}
                {uniqueLatestSessions.length === 0 ? (
                    <div className="card p-5 text-center text-muted shadow-sm border-0">
                        <Activity size={40} className="mb-3 opacity-25 mx-auto" />
                        <p>No hay partidas registradas aún.</p>
                        <small>El niño debe jugar al menos un test para ver resultados.</small>
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

                {/* HISTORIAL COMPLETO (Aquí sí mostramos todo recent_results) */}
                <div className="mt-4 pt-4 border-top">
                    <h6 className="text-muted fw-bold text-uppercase small mb-3">Historial Completo de Sesiones</h6>
                    <div className="list-group list-group-flush bg-white rounded shadow-sm" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {recent_results.map((res, idx) => (
                             <div key={idx} className="list-group-item d-flex justify-content-between align-items-center small py-2 border-bottom">
                                <span className="text-capitalize text-secondary fw-semibold">
                                    {res.game_code === 'cpt' ? 'Atención (CPT)' : 
                                     res.game_code === 'vigilance' ? 'Vigilancia' : res.game_code}
                                </span>
                                <div className="text-end">
                                    <span className={`badge me-2 ${res.score >= 60 ? 'bg-light text-success' : 'bg-light text-danger'}`}>
                                        Score: {Math.round(res.score)}
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