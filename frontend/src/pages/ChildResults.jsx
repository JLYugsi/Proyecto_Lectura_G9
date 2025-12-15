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

        <div style={{ width: "100%", height: 180, minHeight: 180, minWidth: 0, position: "relative" }}>
          {Number.isFinite(safeScore) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <ReferenceLine x={result.threshold} stroke="#dc3545" strokeDasharray="3 3" />
                <Bar dataKey="valor" barSize={18} radius={[0, 10, 10, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted small d-flex align-items-center justify-content-center h-100">
              Cargando gráfico...
            </div>
          )}
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
    const acc = {
      atencion: [],
      impulsividad: [],
      velocidad: [],
      consistencia: [],
    };

    uniqueLatestSessions.forEach((session) => {
      const code = (session.game_code || '').toLowerCase();
      const p = session.cognitive_profile;
      if (!p) return;

      // CPT: Atención + Consistencia + Velocidad (secundario)
      if (code.includes('cpt')) {
        acc.atencion.push({ v: p.atencion, w: 0.6 });
        acc.consistencia.push({ v: p.consistencia, w: 0.6 });
        acc.velocidad.push({ v: p.velocidad, w: 0.2 });
      }

      // Go/No-Go: Impulsividad (principal) + Consistencia (secundario)
      else if (code.includes('go_no_go') || code.includes('gonogo') || code.includes('go')) {
        acc.impulsividad.push({ v: p.impulsividad, w: 0.7 });
        acc.consistencia.push({ v: p.consistencia, w: 0.2 });
      }

      // Vigilance: Atención (selectiva) + Velocidad (escaneo)
      else if (code.includes('vigilance') || code.includes('vigilancia')) {
        acc.atencion.push({ v: p.atencion, w: 0.4 });
        acc.velocidad.push({ v: p.velocidad, w: 0.4 });
        // opcional: si tu backend calcula consistencia aquí, también puedes sumar
        if (typeof p.consistencia === 'number') acc.consistencia.push({ v: p.consistencia, w: 0.1 });
      }

      // TMT: Velocidad + Consistencia (y si luego agregas "flexibilidad" la mapeas aquí)
      else if (code.includes('tmt')) {
        acc.velocidad.push({ v: p.velocidad, w: 0.4 });
        acc.consistencia.push({ v: p.consistencia, w: 0.4 });
      }
    });

    const weightedAvg = (arr, fallback = 50) => {
      if (!arr.length) return fallback;
      const sumW = arr.reduce((s, x) => s + x.w, 0);
      const sumV = arr.reduce((s, x) => s + x.v * x.w, 0);
      return Math.round(sumV / (sumW || 1));
    };

    return {
      atencion: weightedAvg(acc.atencion, 50),
      impulsividad: weightedAvg(acc.impulsividad, 50),
      velocidad: weightedAvg(acc.velocidad, 50),
      consistencia: weightedAvg(acc.consistencia, 50),
    };
  }, [uniqueLatestSessions]);

  const globalVerdict = useMemo(() => {
    let risk = 0;
    if (aggregatedProfile.consistencia < 60) risk++;
    if (aggregatedProfile.impulsividad < 60) risk++;
    if (aggregatedProfile.atencion < 50) risk++;

    if (risk >= 2) return { label: "Patrón de Riesgo TDAH", tone: "danger" };
    if (risk === 1) return { label: "Patrón con Observaciones", tone: "warning" };
    return { label: "Patrón Neurotípico (Normal)", tone: "success" };
  }, [aggregatedProfile]);


  // Procesador de datos INTELIGENTE: Prioriza el perfil de IA sobre el score bruto
  const processGameData = (rawResult) => {
    const code = (rawResult.game_code || '').toLowerCase();
    const profile = rawResult.cognitive_profile;

    // Default thresholds por dimensión (no por juego)
    const thresholds = {
      atencion: 60,
      impulsividad: 60,
      velocidad: 60,
      consistencia: 60,
    };

    // Elegimos qué dimensión muestra ese juego (y una “métrica humana”)
    let dimensionKey = 'atencion';
    let gameName = rawResult.game_code || 'Juego';
    let metricName = 'Índice Cognitivo';
    let average = 75;

    if (code.includes('cpt')) {
      gameName = 'Atención Sostenida (CPT)';
      metricName = 'Atención + Consistencia';
      dimensionKey = 'atencion';
      average = 80;
    } else if (code.includes('go_no_go') || code.includes('gonogo') || code.includes('go')) {
      gameName = 'Control Inhibitorio';
      metricName = 'Control de Impulsos';
      dimensionKey = 'impulsividad';
      average = 80;
    } else if (code.includes('vigilance') || code.includes('vigilancia')) {
      gameName = 'Atención Selectiva (Vigilancia)';
      metricName = 'Atención Selectiva';
      dimensionKey = 'atencion';
      average = 85;
    } else if (code.includes('tmt')) {
      gameName = 'Flexibilidad Cognitiva (TMT)';
      metricName = 'Consistencia / Planificación';
      dimensionKey = 'consistencia';
      average = 75;
    }

    // Score “clínico” 0–100
    const rawScore = Number(rawResult.score);
    const rawScoreSafe = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, rawScore)) : 0;

    let aiScore = 0;

    // ✅ TMT: usar el score del juego (misión) para la barra
    if (code.includes("tmt")) {
      aiScore = rawScoreSafe;
    }
    // ✅ Go/No-Go y CPT: sus "scores" brutos no son 0–100 (500, 1550), entonces usamos el perfil IA
    else if (profile && typeof profile[dimensionKey] === "number") {
      aiScore = profile[dimensionKey];
    }
    // ✅ fallback
    else {
      aiScore = rawScoreSafe;
    }



    const threshold = thresholds[dimensionKey];
    const isAlert = aiScore < threshold;

    return {
      id: rawResult.id || Math.random(),
      gameName,
      metricName,
      score: aiScore,
      rawScoreDisplay: rawResult.score,
      average,
      threshold,
      isAlert,
      dimensionKey, // útil si luego quieres mostrar “qué área bajó”
    };
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
            <div className="card shadow-lg border-0 h-100 sticky-top" style={{ top: '20px', zIndex: 1 }}>
              <div className="card-body p-4 text-center">
                <h5 className="text-secondary fw-bold mb-4 text-uppercase">Mapa Cerebral Actual</h5>

                <div style={{ height: '350px' }}>
                  <CognitiveRadar profile={aggregatedProfile} />
                </div>

                <div className={`alert alert-${globalVerdict.tone} border mt-4 text-start`}>
                  <h6 className="fw-bold mb-1 d-flex align-items-center">
                    <Activity size={16} className="me-2" />
                    {globalVerdict.label}
                  </h6>
                  <p className="small mb-0">
                    Atención ({aggregatedProfile.atencion}),
                    Impulsividad ({aggregatedProfile.impulsividad}),
                    Velocidad ({aggregatedProfile.velocidad}),
                    Consistencia ({aggregatedProfile.consistencia})
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
              <div className="list-group list-group-flush bg-white rounded shadow-sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                        <Calendar size={12} className="me-1" />
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