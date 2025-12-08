from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import date, datetime

# --- 1. USUARIOS (PADRES) ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str # En Mongo el ID es un string largo
    username: str
    email: str

# --- 2. NIÑOS (PACIENTES) ---
class ChildCreate(BaseModel):
    name: str
    birth_date: date
    gender: str

class ChildOut(BaseModel):
    id: str
    name: str
    parent_id: str

# --- 3. JUEGOS Y RESULTADOS (INPUT PARA LA IA) ---
class GameResultInput(BaseModel):
    child_id: str
    game_code: str       # 'cpt', 'tova', 'tmt', 'caras'
    
    # Datos Genéricos (Para la IA rápida)
    score: int
    total_time_played: int # Segundos que duró la sesión
    
    # DATOS ESPECÍFICOS (Aquí viene la robustez científica)
    # Usamos Dict[str, Any] para que cada juego mande sus propias métricas
    detailed_metrics: Dict[str, Any] 

    class Config:
        from_attributes = True

class AnalysisOutput(BaseModel):
    """Lo que le respondemos al Frontend después de pensar"""
    verdict: str         # "Riesgo" o "Normal"
    confidence_score: float # Qué tan segura está la IA (simulado)
    badge_awarded: Optional[str] = None
    
# --- 4. SALIDAS PARA EL DASHBOARD (Lectura) ---

class ResultHistory(BaseModel):
    """Para mostrar la lista de partidas en el Dashboard"""
    game_code: str
    timestamp: datetime
    ai_diagnosis: str
    metrics: Dict[str, Any] # Devolvemos el detalle completo
    badge: Optional[str]

class ChildDashboard(BaseModel):
    """El perfil completo del niño"""
    child_info: ChildOut
    recent_results: List[ResultHistory]
    badges_earned: List[str] # Lista de nombres de medallas
    
class LoginInput(BaseModel):
    username: str
    password: str

class LoginSuccess(BaseModel):
    user_id: str
    username: str