from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, telemetry_collection

app = FastAPI(title="API TDAH Gamification", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Bienvenido al Sistema de Detección TDAH - API Activa"}

@app.get("/health-check")
def health_check(db: Session = Depends(get_db)):
    """
    Verifica que Python pueda 'hablar' con Postgres y Mongo.
    """
    status = {
        "sistema": "online",
        "postgres": "unknown", 
        "mongo": "unknown"
    }
    
    # 1. Probar conexión a PostgreSQL
    try:
        # Ejecuta una consulta simple "SELECT 1"
        db.execute(text("SELECT 1"))
        status["postgres"] = "✅ Conectado"
    except Exception as e:
        status["postgres"] = f"❌ Error: {str(e)}"

    # 2. Probar conexión a MongoDB
    try:
        # Intenta contar los documentos (ping rápido)
        count = telemetry_collection.count_documents({})
        status["mongo"] = f"✅ Conectado (Docs encontrados: {count})"
    except Exception as e:
        status["mongo"] = f"❌ Error: {str(e)}"

    return status