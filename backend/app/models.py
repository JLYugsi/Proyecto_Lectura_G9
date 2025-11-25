from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

# 1. MODELO DE USUARIO (Padre/Tutor)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relación: Un padre tiene muchos hijos (pacientes)
    children = relationship("Child", back_populates="parent")

# 2. MODELO DE NIÑO (Paciente)
class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    birth_date = Column(Date)
    gender = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    parent = relationship("User", back_populates="children")
    results = relationship("Result", back_populates="child")
    badges = relationship("UserBadge", back_populates="child")

# 3. MODELO DE JUEGO (Catálogo)
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    code_name = Column(String, unique=True) # ej: 'cpt_ii'
    name = Column(String)
    description = Column(String)
    engine_type = Column(String) # 'reaction', 'path', 'selection'
    config_params = Column(JSON) # Configuración técnica

# 4. MODELO DE MEDALLA (Catálogo)
class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    icon_slug = Column(String)
    criteria_type = Column(String)
    criteria_value = Column(Integer)

# 5. MODELO DE RESULTADOS (Lo que ve el padre)
class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    game_id = Column(Integer, ForeignKey("games.id"))
    
    score_raw = Column(Integer)
    attention_level = Column(String)   # Alto/Medio/Bajo
    impulsivity_level = Column(String) # Alto/Medio/Bajo
    reaction_time_avg = Column(Integer)
    errors_commission = Column(Integer)
    errors_omission = Column(Integer)
    played_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="results")

# 6. MODELO DE MEDALLAS GANADAS
class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="badges")
    badge = relationship("Badge")