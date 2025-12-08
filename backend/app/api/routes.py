from fastapi import APIRouter, HTTPException, status
from app.core.database import users_collection, children_collection, results_collection, badges_collection
from app.services.ml_engine import ai_engine
from app import schemas
from bson import ObjectId
from datetime import datetime
from typing import List

router = APIRouter()

# --- HELPER: Convertir ObjectId a String ---
def fix_id(doc):
    """
    Transforma el _id (ObjectId) de Mongo a un string "id"
    para que Pydantic no se queje.
    """
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

# ==========================================
# 1. AUTENTICACIÓN Y USUARIOS
# ==========================================

@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate):
    """Registra al padre/tutor en el sistema"""
    # 1. Verificar si el email ya existe
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Este correo electrónico ya está registrado"
        )
    
    # 2. Insertar
    user_dict = user.model_dump()
    result = users_collection.insert_one(user_dict)
    
    # 3. Retornar con ID convertido
    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "email": user.email
    }

@router.post("/login", response_model=schemas.LoginSuccess)
def login(creds: schemas.LoginInput):
    """Login simple buscando por username"""
    user = users_collection.find_one({"username": creds.username})
    
    # Validación básica (En producción real usarías hash para passwords)
    if not user or user["password"] != creds.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Usuario o contraseña incorrectos"
        )
    
    return {
        "user_id": str(user["_id"]),
        "username": user["username"]
    }

# ==========================================
# 2. GESTIÓN DE NIÑOS (RELACIÓN PADRE-HIJO)
# ==========================================

@router.post("/users/{user_id}/children/", response_model=schemas.ChildOut)
def create_child(user_id: str, child: schemas.ChildCreate):
    """
    Crea un perfil de niño vinculado al ID del padre proporcionado en la URL.
    """
    # PASO 1: Validar formato de ObjectId
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="El ID del usuario no tiene un formato válido"
        )

    # PASO 2: Verificar que el padre EXISTA
    parent = users_collection.find_one({"_id": ObjectId(user_id)})
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="El usuario padre no existe"
        )

    # PASO 3: Preparar datos (Esquema + ID del padre)
    child_dict = child.model_dump()
    # Convertimos fecha a string ISO para evitar problemas de serialización en Mongo
    child_dict["birth_date"] = child.birth_date.isoformat() 
    child_dict["parent_id"] = user_id 
    
    # PASO 4: Guardar
    result = children_collection.insert_one(child_dict)
    
    # PASO 5: Retornar (Pydantic espera 'id', 'name', 'parent_id')
    return {
        "id": str(result.inserted_id),
        "name": child.name,
        "parent_id": user_id
    }

@router.get("/users/{user_id}/children", response_model=List[schemas.ChildOut])
def get_user_children(user_id: str):
    """Obtiene todos los hijos asociados a un padre"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID inválido")

    cursor = children_collection.find({"parent_id": user_id})
    
    children_list = []
    for doc in cursor:
        children_list.append(fix_id(doc))
        
    return children_list

# ==========================================
# 3. CEREBRO IA Y RESULTADOS
# ==========================================

@router.post("/analyze", response_model=schemas.AnalysisOutput)
def analyze_game_result(data: schemas.GameResultInput):
    """
    Recibe métricas -> Ejecuta ML -> Asigna Medallas -> Guarda Resultado
    """
    # 1. Extracción de Métricas (Normalización de nombres de variables)
    metrics = data.detailed_metrics
    
    ai_reaction_time = 0
    # Algunos juegos usan 'reaction_time_avg', otros 'completion_time_ms'
    if "reaction_time_avg" in metrics:
        ai_reaction_time = metrics["reaction_time_avg"]
    elif "completion_time_ms" in metrics:
        ai_reaction_time = metrics["completion_time_ms"]
    
    # Sumar errores de todos los tipos posibles
    ai_errors = metrics.get("total_errors", 0) + \
                metrics.get("omission_errors", 0) + \
                metrics.get("commission_errors", 0) + \
                metrics.get("sequence_errors", 0)

    # 2. INFERENCIA IA (Usando tus datos simulados científicos)
    verdict = ai_engine.predict(data.game_code, ai_reaction_time, ai_errors)

    # 3. Lógica de Gamificación (Medallas)
    badge = None
    if verdict == "Patrón Neurotípico (Normal)":
        # Reglas ejemplo para medallas
        if data.game_code == "cpt" and ai_errors == 0:
            badge = "Defensor Perfecto"
        elif data.game_code == "tmt" and metrics.get("completion_time_ms", 99999) < 40000:
            badge = "Conector Veloz"
        elif data.game_code == "caras" and ai_errors == 0:
            badge = "Ojo de Águila"

    # 4. Guardar en MongoDB
    result_doc = {
        "child_id": data.child_id,
        "game_code": data.game_code,
        "metrics": metrics, # Guardamos el JSON crudo para futuros estudios
        "ai_input_used": { "time": ai_reaction_time, "errors": ai_errors },
        "ai_diagnosis": verdict,
        "badge": badge,
        "timestamp": datetime.utcnow()
    }
    results_collection.insert_one(result_doc)

    return {
        "verdict": verdict,
        "confidence_score": 0.95, # Valor simulado alto
        "badge_awarded": badge
    }

# ==========================================
# 4. DASHBOARD (VISTA DEL PADRE)
# ==========================================

@router.get("/children/{child_id}/dashboard", response_model=schemas.ChildDashboard)
def get_child_dashboard(child_id: str):
    """
    Recopila toda la info para pintar la pantalla de estadísticas
    """
    if not ObjectId.is_valid(child_id):
        raise HTTPException(status_code=400, detail="ID de formato inválido")

    # 1. Buscar info del niño
    child_doc = children_collection.find_one({"_id": ObjectId(child_id)})
    if not child_doc:
        raise HTTPException(status_code=404, detail="Niño no encontrado")

    # 2. Buscar historial de juegos
    cursor = results_collection.find({"child_id": child_id}).sort("timestamp", -1)
    
    results_list = []
    badges_set = set()

    for doc in cursor:
        results_list.append({
            "game_code": doc.get("game_code"),
            "timestamp": doc.get("timestamp"),
            "ai_diagnosis": doc.get("ai_diagnosis"),
            "metrics": doc.get("metrics"),
            "badge": doc.get("badge")
        })
        
        if doc.get("badge"):
            badges_set.add(doc.get("badge"))

    # 3. Ensamblar respuesta completa
    return {
        "child_info": fix_id(child_doc),
        "recent_results": results_list,
        "badges_earned": list(badges_set)
    }