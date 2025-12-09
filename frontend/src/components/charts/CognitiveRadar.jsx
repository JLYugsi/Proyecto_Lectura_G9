import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const CognitiveRadar = ({ profile }) => {
  // Datos por defecto si no hay perfil aún
  const dataValues = profile 
    ? [profile.atencion, profile.velocidad, profile.impulsividad, profile.consistencia]
    : [50, 50, 50, 50];

  const data = {
    labels: ['Atención', 'Velocidad', 'Control Impulsos', 'Consistencia'],
    datasets: [
      {
        label: 'Perfil Cognitivo Actual',
        data: dataValues,
        backgroundColor: 'rgba(56, 189, 248, 0.2)', // Azul cyan transparente
        borderColor: '#38bdf8', // Azul cyan sólido
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#38bdf8',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#38bdf8',
      },
      {
        label: 'Rango Neurotípico (Referencia)',
        data: [80, 80, 80, 80], // Un hexágono de referencia
        backgroundColor: 'rgba(148, 163, 184, 0.1)', // Gris muy suave
        borderColor: 'rgba(148, 163, 184, 0.4)',
        borderWidth: 1,
        borderDash: [5, 5], // Línea punteada
        pointRadius: 0,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: {
          color: '#94a3b8', // Color del texto de las etiquetas
          font: { size: 12, weight: 'bold' }
        },
        ticks: { display: false, backdropColor: 'transparent' }, // Ocultar números del eje
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { display: true, labels: { color: '#cbd5e1' } },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Radar data={data} options={options} />
    </div>
  );
};

export default CognitiveRadar;