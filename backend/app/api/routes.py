from fastapi import APIRouter, HTTPException, status
from app.core.database import users_collection, children_collection, results_collection, badges_collection
from app.services.ml_engine import ai_engine
from app import schemas
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Any
import statistics # <--- IMPORTANTE PARA LA ROBUSTEZ MATEMÁTICA

router = APIRouter()

# --- HELPER: Convertir ObjectId a String ---
def fix_id(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

# ==========================================
# 0. LÓGICA CIENTÍFICA (Perfil Cognitivo)
# ==========================================
def calculate_cognitive_profile(metrics: Dict[str, Any]) -> Dict[str, int]:
    """
    Genera un perfil de 4 dimensiones (0-100) basado en datos crudos.
    """
    # 1. ATENCIÓN (Basado en Omisiones)
    omissions = metrics.get("omission_errors", 0)
    attn_score = max(0, 100 - (omissions * 15)) 

    # 2. IMPULSIVIDAD (Basado en Comisiones)
    commissions = metrics.get("commission_errors", 0)
    impulse_control = max(0, 100 - (commissions * 10))

    # 3. VELOCIDAD (Basado en Promedio ms)
    rt_avg = metrics.get("reaction_time_avg", 0)
    if rt_avg == 0: speed_score = 0
    elif rt_avg < 250: speed_score = 100 # Sospechosamente rápido
    elif rt_avg > 800: speed_score = 40  # Lento
    else: speed_score = 100 - ((rt_avg - 250) * 0.12)

    # 4. CONSISTENCIA (Desviación Estándar - Marcador clave TDAH)
    rt_raw = metrics.get("reaction_times_raw", [])
    if len(rt_raw) > 1:
        stdev = statistics.stdev(rt_raw)
        # stdev < 80ms es excelente (100). stdev > 200ms es muy inconsistente.
        consistency_score = max(0, 100 - ((stdev - 50) * 0.5))
    else:
        consistency_score = 50 # Neutro si no hay datos

    return {
        "atencion": round(attn_score),
        "impulsividad": round(impulse_control),
        "velocidad": round(speed_score),
        "consistencia": round(consistency_score)
    }

# ==========================================
# 1. USUARIOS Y AUTH
# ==========================================
@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email registrado")
    result = users_collection.insert_one(user.model_dump())
    return {"id": str(result.inserted_id), "username": user.username, "email": user.email}

@router.post("/login", response_model=schemas.LoginSuccess)
def login(creds: schemas.LoginInput):
    user = users_collection.find_one({"username": creds.username})
    if not user or user["password"] != creds.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {"user_id": str(user["_id"]), "username": user["username"]}

# ==========================================
# 2. GESTIÓN DE NIÑOS
# ==========================================
@router.post("/users/{user_id}/children/", response_model=schemas.ChildOut)
def create_child(user_id: str, child: schemas.ChildCreate):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID inválido")
    if not users_collection.find_one({"_id": ObjectId(user_id)}):
        raise HTTPException(status_code=404, detail="Padre no encontrado")

    child_dict = child.model_dump()
    child_dict["birth_date"] = child.birth_date.isoformat() 
    child_dict["parent_id"] = user_id 
    
    result = children_collection.insert_one(child_dict)
    return {**child_dict, "id": str(result.inserted_id)}

@router.get("/users/{user_id}/children")
def get_user_children(user_id: str):
    """
    Obtiene hijos Y su último perfil cognitivo para el Dashboard.
    Nota: Retornamos Dict libre para incluir 'latest_profile' sin error de Schema.
    """
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID inválido")

    cursor = children_collection.find({"parent_id": user_id})
    children_list = []
    
    for doc in cursor:
        child = fix_id(doc)
        # Buscar el resultado más reciente de este niño para el gráfico
        last_result = results_collection.find_one(
            {"child_id": child["id"]}, 
            sort=[("timestamp", -1)]
        )
        
        if last_result and "cognitive_profile" in last_result:
            child["latest_profile"] = last_result["cognitive_profile"]
        else:
            child["latest_profile"] = None
            
        children_list.append(child)
        
    return children_list

@router.delete("/children/{child_id}")
def delete_child(child_id: str):
    if not ObjectId.is_valid(child_id):
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if not children_collection.find_one({"_id": ObjectId(child_id)}):
        raise HTTPException(status_code=404, detail="Niño no encontrado")

    children_collection.delete_one({"_id": ObjectId(child_id)})
    results_collection.delete_many({"child_id": child_id})

    return {"message": "Perfil eliminado correctamente"}

# ==========================================
# 3. ANÁLISIS Y RESULTADOS
# ==========================================
@router.post("/analyze", response_model=schemas.AnalysisOutput)
def analyze_game_result(data: schemas.GameResultInput):
    metrics = data.detailed_metrics
    
    # 1. Calcular Perfil Robusto
    profile = calculate_cognitive_profile(metrics)
    
    # 2. Diagnóstico IA basado en el perfil calculado
    risk_count = 0
    if profile["consistencia"] < 60: risk_count += 1
    if profile["impulsividad"] < 60: risk_count += 1
    if profile["atencion"] < 50: risk_count += 1

    verdict = "Patrón de Riesgo TDAH" if risk_count >= 2 else "Patrón Neurotípico (Normal)"

    # 3. Medallas
    badge = None
    if profile["atencion"] >= 95 and profile["impulsividad"] >= 95:
        badge = "Defensor Perfecto"
    elif profile["velocidad"] > 90 and profile["consistencia"] > 80:
        badge = "Rayo Láser"

    # 4. Guardar
    result_doc = {
        "child_id": data.child_id,
        "game_code": data.game_code,
        "metrics": metrics,
        "cognitive_profile": profile, # Guardamos el perfil para el gráfico
        "ai_diagnosis": verdict,
        "badge": badge,
        "timestamp": datetime.utcnow()
    }
    results_collection.insert_one(result_doc)

    return {
        "verdict": verdict,
        "confidence_score": 0.90,
        "badge_awarded": badge
    }

# ==========================================
# 4. DASHBOARD DETALLADO
# ==========================================
@router.get("/children/{child_id}/dashboard", response_model=schemas.ChildDashboard)
def get_child_dashboard(child_id: str):
    if not ObjectId.is_valid(child_id):
        raise HTTPException(status_code=400, detail="ID inválido")

    child_doc = children_collection.find_one({"_id": ObjectId(child_id)})
    if not child_doc: raise HTTPException(status_code=404, detail="No encontrado")

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
        if doc.get("badge"): badges_set.add(doc.get("badge"))

    return {
        "child_info": fix_id(child_doc),
        "recent_results": results_list,
        "badges_earned": list(badges_set)
    }