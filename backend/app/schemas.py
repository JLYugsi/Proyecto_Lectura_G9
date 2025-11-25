from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional

# --- ESQUEMAS PARA MEDALLAS (Gamificación) ---
class BadgeOut(BaseModel):
    name: str
    description: str
    icon_slug: str
    
    class Config:
        from_attributes = True

# --- ESQUEMAS PARA NIÑOS (Pacientes) ---
class ChildBase(BaseModel):
    name: str
    birth_date: date
    gender: str

class ChildCreate(ChildBase):
    pass # Se usa para crear (recibe lo mismo que Base)

class ChildOut(ChildBase):
    id: int
    created_at: datetime
    # Aquí podríamos incluir las medallas que tiene el niño
    badges: List[BadgeOut] = [] 

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA USUARIOS (Padres) ---
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str # El password solo viaja al crear, nunca se devuelve

class UserOut(UserBase):
    id: int
    created_at: datetime
    children: List[ChildOut] = []

    class Config:
        from_attributes = True