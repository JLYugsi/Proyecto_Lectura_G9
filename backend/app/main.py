from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, telemetry_collection, client

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Modo Diagnóstico Activo"}

@app.get("/health-check")
def health_check(db: Session = Depends(get_db)):
    status = {
        "postgres_status": "Revisando...",
        "mongo_status": "Revisando...",
        "postgres_error": None,
        "mongo_error": None
    }
    
    # 1. PRUEBA POSTGRESQL
    try:
        db.execute(text("SELECT 1"))
        status["postgres_status"] = "✅ CONECTADO EXITOSAMENTE"
    except Exception as e:
        status["postgres_status"] = "❌ FALLÓ"
        # Convertimos el error a string para verlo en el navegador
        status["postgres_error"] = str(e)

    # 2. PRUEBA MONGODB
    try:
        # Comando ping administrativo
        client.admin.command('ping')
        status["mongo_status"] = "✅ CONECTADO EXITOSAMENTE"
    except Exception as e:
        status["mongo_status"] = "❌ FALLÓ"
        status["mongo_error"] = str(e)

    return status