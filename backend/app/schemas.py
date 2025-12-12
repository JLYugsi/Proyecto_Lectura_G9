from pydantic import BaseModel, Field, EmailStr, computed_field
from typing import List, Optional, Any, Dict
from datetime import date, datetime

# --- 0. OBJETOS COMPARTIDOS (Resultados Cognitivos) ---
class CognitiveProfile(BaseModel):
    """
    Define las 4 dimensiones del gráfico de radar.
    """
    atencion: int
    impulsividad: int
    velocidad: int
    consistencia: int

# --- 1. USUARIOS (PADRES) ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str 
    username: str
    email: str

# --- 2. NIÑOS (PACIENTES) ---
class ChildCreate(BaseModel):
    name: str
    birth_date: date # Se recibe fecha (YYYY-MM-DD)
    gender: str

class ChildOut(BaseModel):
    id: str
    name: str
    parent_id: str
    birth_date: date 
    gender: str
    
    # Permitir que viaje el perfil cognitivo al frontend
    latest_profile: Optional[CognitiveProfile] = None 

    # --- CAMBIO IMPORTANTE: CÁLCULO AUTOMÁTICO DE EDAD ---
    # Esto no se guarda en BD, se calcula al vuelo cada vez que pides el niño
    @computed_field
    def age(self) -> int:
        today = date.today()
        # Cálculo preciso de edad considerando mes y día
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )

    class Config:
        from_attributes = True

# --- 3. JUEGOS Y RESULTADOS (INPUT) ---
class GameResultInput(BaseModel):
    child_id: str
    game_code: str       # 'cpt', 'go_no_go', etc.
    
    score: int
    total_time_played: int 
    
    # Dict flexible para recibir 'reaction_times_raw' (array) y otros datos
    detailed_metrics: Dict[str, Any] 

    class Config:
        from_attributes = True

class AnalysisOutput(BaseModel):
    """Respuesta inmediata tras jugar"""
    verdict: str        
    confidence_score: float
    badge_awarded: Optional[str] = None
    
# --- 4. SALIDAS PARA EL DASHBOARD (Lectura Histórica) ---

class ResultHistory(BaseModel):
    """Un item en la lista de historial"""
    game_code: str
    timestamp: datetime
    ai_diagnosis: str
    metrics: Dict[str, Any]
    badge: Optional[str] = None

class ChildDashboard(BaseModel):
    """El perfil completo al entrar a detalles"""
    child_info: ChildOut # Al usar ChildOut aquí, heredamos el cálculo de edad
    recent_results: List[ResultHistory]
    badges_earned: List[str]
    
class LoginInput(BaseModel):
    username: str
    password: str

class LoginSuccess(BaseModel):
    user_id: str
    username: str