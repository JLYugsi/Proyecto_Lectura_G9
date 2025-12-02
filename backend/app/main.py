from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import db, client # Importamos la conexión Mongo directa
from app.services.ml_engine import ai_engine # Importamos tu nuevo cerebro IA
from app.api import routes

app = FastAPI(title="API TDAH - Arquitectura NoSQL + ML", version="2.0.0")

app.include_router(routes.router, prefix="/api")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ZONA DE PRUEBAS ---

@app.on_event("startup")
async def startup_event():
    print("🧠 Inicializando Sistema Multi-Modelo...")
    ai_engine.train_mock_models() 
    print("✅ IA Calibrada para 4 juegos.")

@app.get("/")
def read_root():
    return {"message": "Sistema TDAH v2.0 (Mongo + AI)"}

@app.get("/health-check")
def health_check():
    """
    Verifica Mongo y hace una prueba de predicción en vivo.
    """
    status = {
        "mongo_status": "Desconectado",
        "ai_status": "Inactivo",
        "prueba_prediccion": None
    }

    # 1. Probar MongoDB
    try:
        client.admin.command('ping')
        # Contar documentos en la colección de usuarios para ver si lee
        doc_count = db["users"].count_documents({})
        status["mongo_status"] = f"✅ Conectado (Docs en users: {doc_count})"
    except Exception as e:
        status["mongo_status"] = f"❌ Error: {str(e)}"

    # 2. Probar Machine Learning
    try:
        # Simulamos un niño con tiempo de reacción 400ms (Normal)
        prediccion_normal = ai_engine.predict(400, 2) 
        
        # Simulamos un niño con tiempo 900ms y muchos errores (Riesgo)
        prediccion_riesgo = ai_engine.predict(900, 15)
        
        status["ai_status"] = "✅ Motor Funcionando"
        status["prueba_prediccion"] = {
            "caso_normal": prediccion_normal,
            "caso_riesgo": prediccion_riesgo
        }
    except Exception as e:
        status["ai_status"] = f"❌ Error IA: {str(e)}"

    return status