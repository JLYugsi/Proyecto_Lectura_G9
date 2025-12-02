from fastapi import APIRouter, HTTPException, status
from app.core.database import users_collection, children_collection, results_collection, badges_collection
from app.services.ml_engine import ai_engine
from app import schemas
from bson import ObjectId # Para manejar IDs de Mongo
from datetime import datetime

router = APIRouter()

# --- HELPER: Convertir ObjectId a String ---
def fix_id(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc

# ==========================================
# 1. GESTIÓN DE USUARIOS (MONGO)
# ==========================================
@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate):
    # Verificar duplicados
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    user_dict = user.model_dump()
    result = users_collection.insert_one(user_dict)
    
    # Devolver el objeto creado con su ID nuevo
    return {"id": str(result.inserted_id), "username": user.username, "email": user.email}

@router.post("/users/{user_id}/children/", response_model=schemas.ChildOut)
def create_child(user_id: str, child: schemas.ChildCreate):
    child_dict = child.model_dump()
    child_dict["parent_id"] = user_id
    
    result = children_collection.insert_one(child_dict)
    
    return {**child_dict, "id": str(result.inserted_id)}

# ==========================================
# 2. EL CEREBRO: ANÁLISIS CON IA
# ==========================================
@router.post("/analyze", response_model=schemas.AnalysisOutput)
def analyze_game_result(data: schemas.GameResultInput):
    
    # 1. Extracción Eficiente de Métricas
    # Ya no normalizamos a la fuerza. Pasamos los datos crudos pero limpios.
    metrics = data.detailed_metrics
    
    ai_reaction_time = 0
    ai_errors = 0

    if "reaction_time_avg" in metrics:
        ai_reaction_time = metrics["reaction_time_avg"]
    elif "completion_time_ms" in metrics:
        # Para TMT pasamos el tiempo total DIRECTO.
        # El modelo de TMT ya aprendió que 30,000 es normal.
        ai_reaction_time = metrics["completion_time_ms"] 
    
    # Sumar errores genéricos
    ai_errors = metrics.get("total_errors", 0) + \
                metrics.get("omission_errors", 0) + \
                metrics.get("commission_errors", 0) + \
                metrics.get("sequence_errors", 0)

    # 2. El Motor Multi-Juego se encarga de elegir la escala correcta
    verdict = ai_engine.predict(data.game_code, ai_reaction_time, ai_errors)

    # C. LÓGICA DE MEDALLAS (Gamificación)
    badge = None
    if verdict == "Patrón Neurotípico (Normal)":
        if data.game_code == "cpt" and ai_errors == 0:
            badge = "Defensor Perfecto"
        elif data.game_code == "tmt" and metrics.get("completion_time_ms", 99999) < 40000:
            badge = "Conector Veloz"
        # ... puedes agregar más reglas aquí

    # D. GUARDADO ROBUSTO EN MONGO (Guardamos TODO el detalle)
    result_doc = {
        "child_id": data.child_id,
        "game_code": data.game_code,
        "metrics": metrics, # <--- AQUÍ SE GUARDA LA DATA CIENTÍFICA PURA
        "ai_input_used": { "time": ai_reaction_time, "errors": ai_errors }, # Para auditoría
        "ai_diagnosis": verdict,
        "badge": badge,
        "timestamp": datetime.utcnow()
    }
    results_collection.insert_one(result_doc)

    return {
        "verdict": verdict,
        "confidence_score": 0.92,
        "badge_awarded": badge
    }
    
# ==========================================
# 3. DASHBOARD Y REPORTES (GET)
# ==========================================

@router.get("/children/{child_id}/dashboard", response_model=schemas.ChildDashboard)
def get_child_dashboard(child_id: str):
    """
    Obtiene toda la info para pintar la pantalla del padre:
    - Datos del niño
    - Historial de partidas
    - Medallas acumuladas
    """
    # 1. Buscar al niño
    try:
        child_doc = children_collection.find_one({"_id": ObjectId(child_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de formato inválido")

    if not child_doc:
        raise HTTPException(status_code=404, detail="Niño no encontrado")

    # 2. Buscar sus resultados (ordenados por fecha descendente)
    cursor = results_collection.find({"child_id": child_id}).sort("timestamp", -1)
    results_list = []
    badges_set = set() # Usamos un set para no repetir medallas visualmente

    for doc in cursor:
        # Convertir a esquema de salida
        results_list.append({
            "game_code": doc.get("game_code"),
            "timestamp": doc.get("timestamp"),
            "ai_diagnosis": doc.get("ai_diagnosis"),
            "metrics": doc.get("metrics"),
            "badge": doc.get("badge")
        })
        
        # Recolectar medallas
        if doc.get("badge"):
            badges_set.add(doc.get("badge"))

    # 3. Preparar respuesta
    return {
        "child_info": fix_id(child_doc),
        "recent_results": results_list,
        "badges_earned": list(badges_set)
    }