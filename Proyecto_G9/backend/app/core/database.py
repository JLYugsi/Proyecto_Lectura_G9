from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pymongo import MongoClient

# --- 1. CONFIGURACIÓN POSTGRESQL (Relacional) ---
# Usuario: admin, Pass: password123, Puerto: 5432 (Docker), BD: tdah_gamification_db
SQLALCHEMY_DATABASE_URL = "postgresql://admin:password123@127.0.0.1:5432/tdah_gamification_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Función para obtener la sesión de BD en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 2. CONFIGURACIÓN MONGODB (No Relacional) ---
# Importante: Puerto 27018 (el que definimos en docker-compose para evitar conflictos)
MONGO_URI = "mongodb://admin:password123@127.0.0.1:27018/"
MONGO_DB_NAME = "tdah_logs_db"

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = client[MONGO_DB_NAME]
    telemetry_collection = mongo_db["game_telemetry"]
    print("✅ Conexión a MongoDB configurada (Lazy Loading)")
except Exception as e:
    print(f"❌ Error configurando MongoDB: {e}")