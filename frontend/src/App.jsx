import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GameRoom from './pages/GameRoom';
import ChildResults from './pages/ChildResults';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Raíz: Login */}
        <Route path="/" element={<Login />} />
        
        {/* Ruta Protegida: Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/gameroom" element={<GameRoom />} />

        <Route path="/results/:childId" element={<ChildResults />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;