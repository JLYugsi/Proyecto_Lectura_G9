import { Star, Zap, Target, Brain, Shield, Rocket, Medal, Crown } from "lucide-react";

export const ACHIEVEMENTS_LIST = [
  {
    id: "first_steps",
    title: "Primer Paso",
    desc: "Completaste tu primera misión.",
    icon: <Flag size={24} />,
    color: "text-blue-500",
    bg: "bg-blue-100"
  },
  {
    id: "sniper_cpt",
    title: "Ojo de Águila",
    desc: "Más del 90% de precisión en El Vigía.",
    icon: <Target size={24} />,
    color: "text-green-500",
    bg: "bg-green-100"
  },
  {
    id: "zen_master",
    title: "Mente Zen",
    desc: "Control perfecto (0 errores) en Modo Turbo.",
    icon: <Shield size={24} />,
    color: "text-purple-500",
    bg: "bg-purple-100"
  },
  {
    id: "speed_demon",
    title: "Rayo Veloz",
    desc: "Velocidad extrema en Búsqueda del Tesoro.",
    icon: <Zap size={24} />,
    color: "text-yellow-500",
    bg: "bg-yellow-100"
  },
  {
    id: "brainy",
    title: "Cerebro Galáctico",
    desc: "Completaste Constelaciones sin fallos.",
    icon: <Brain size={24} />,
    color: "text-pink-500",
    bg: "bg-pink-100"
  },
  {
    id: "session_champion",
    title: "Campeón de Sesión",
    desc: "Completaste los 4 juegos en una sesión.",
    icon: <Crown size={24} />,
    color: "text-orange-500",
    bg: "bg-orange-100"
  }
];

// Helper para obtener datos visuales por ID
export const getAchievementById = (id) => ACHIEVEMENTS_LIST.find(a => a.id === id);