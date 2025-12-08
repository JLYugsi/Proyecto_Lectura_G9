import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GameRoom from './pages/GameRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Raíz: Login */}
        <Route path="/" element={<Login />} />
        
        {/* Ruta Protegida: Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/gameroom" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;