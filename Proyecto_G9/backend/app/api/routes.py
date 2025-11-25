from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import hashlib # Usaremos esto para 'encriptar' sin instalar librerías extra
from app.core.database import get_db
from app.models import User, Child, Result, Game
from app import schemas

router = APIRouter()

# Función auxiliar para hashear passwords (MD5 simple para este prototipo)
def fake_hash_password(password: str):
    return hashlib.md5(password.encode()).hexdigest()

# ==========================================
# 1. GESTIÓN DE USUARIOS (PADRES)
# ==========================================

@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar si el email ya existe
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    # 2. Crear el usuario nuevo
    hashed_pwd = fake_hash_password(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/users/{user_id}", response_model=schemas.UserOut)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return db_user

# ==========================================
# 2. GESTIÓN DE NIÑOS (PACIENTES)
# ==========================================

@router.post("/users/{user_id}/children/", response_model=schemas.ChildOut)
def create_child_for_user(user_id: int, child: schemas.ChildCreate, db: Session = Depends(get_db)):
    # 1. Verificar que el padre existe
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="El usuario padre no existe")

    # 2. Crear el niño
    new_child = Child(
        **child.model_dump(), # Copia nombre, fecha, genero
        parent_id=user_id
    )
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    return new_child

@router.get("/games/")
def list_games(db: Session = Depends(get_db)):
    """Devuelve la lista de juegos configurados para el Frontend"""
    return db.query(Game).all()