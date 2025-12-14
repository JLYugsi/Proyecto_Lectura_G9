from fastapi import APIRouter, HTTPException, status
from app.core.database import users_collection, children_collection, results_collection, badges_collection
from app.services.ml_engine import ai_engine
from app import schemas
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Any
import statistics
from pymongo import ReturnDocument

router = APIRouter()

# --- HELPER: Convertir ObjectId a String ---
def fix_id(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

# ==========================================
# 3. ANÁLISIS Y RESULTADOS
# ==========================================
@router.post("/analyze", response_model=schemas.AnalysisOutput)
def analyze_game_result(data: schemas.GameResultInput):
    metrics = data.detailed_metrics
    
    # 1. Calcular Perfil (IA)
    profile = ai_engine.calculate_profile(metrics)
    verdict = ai_engine.predict_verdict(profile)

    # 2. LOGICA DE LOGROS (GAMIFICACIÓN)
    new_badges = []
    
    # A) Logro: Primer Paso (Siempre que juega, si no lo tiene, se lo damos)
    # (Esto se valida al guardar en la BD para no duplicar)
    
    # B) Logro: Ojo de Águila (CPT Precisión > 90%)
    if data.game_code == 'cpt' and profile["atencion"] >= 90:
        new_badges.append("sniper_cpt")
        
    # C) Logro: Mente Zen (Go/No-Go 0 Comisiones)
    if data.game_code == 'go_no_go' and metrics.get("commission_errors", 0) == 0:
        new_badges.append("zen_master")
        
    # D) Logro: Rayo Veloz (Vigilancia Velocidad > 85)
    if data.game_code == 'vigilance' and profile["velocidad"] >= 85:
        new_badges.append("speed_demon")

    # E) Logro: Cerebro Galáctico (TMT 0 Errores)
    if data.game_code == 'tmt' and metrics.get("commission_errors", 0) == 0:
        new_badges.append("brainy")

    # 3. Guardar Resultado
    result_doc = {
        "child_id": data.child_id,
        "game_code": data.game_code,
        "score": data.score,
        "metrics": metrics,
        "cognitive_profile": profile, 
        "ai_diagnosis": verdict,
        "timestamp": datetime.utcnow()
    }
    results_collection.insert_one(result_doc)

    # 4. ACTUALIZAR PERFIL DEL NIÑO (Guardar logros nuevos)
    # Usamos $addToSet de Mongo para no duplicar si ya lo tenía
    if new_badges:
        children_collection.update_one(
            {"_id": ObjectId(data.child_id)},
            {"$addToSet": {"achievements": {"$each": new_badges}}}
        )

    # Retornamos el primer logro nuevo encontrado para mostrarlo en el frontend como "Badge Awarded"
    # (Simplificación para la UI actual)
    primary_badge = new_badges[0] if new_badges else None

    return {
        "verdict": verdict,
        "confidence_score": 0.92,
        "badge_awarded": primary_badge # Enviamos el ID del logro (ej: 'sniper_cpt')
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
            "badge": doc.get("badge"),
            "score": doc.get("score", 0),
            # --- AGREGAR ESTA LÍNEA ES VITAL ---
            # Enviamos el perfil calculado por la IA al frontend
            "cognitive_profile": doc.get("cognitive_profile") 
            # -----------------------------------
        })
        if doc.get("badge"): badges_set.add(doc.get("badge"))

    return {
        "child_info": fix_id(child_doc),
        "recent_results": results_list,
        "badges_earned": list(badges_set)
    }

# (MANTÉN EL RESTO DEL ARCHIVO IGUAL: create_user, login, create_child, etc.)
# Solo asegúrate de copiar las funciones modificadas arriba y pegarlas en su lugar.
# Si prefieres, copia todo el bloque de importaciones para arreglar lo de 'statistics'.
# -----------------------------------------------------------------------------
# A CONTINUACIÓN, EL RESTO DE RUTAS NECESARIAS PARA QUE NO TENGAS ERRORES DE COPIA:

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
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID inválido")

    cursor = children_collection.find({"parent_id": user_id})
    children_list = []
    
    for doc in cursor:
        child = fix_id(doc)
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