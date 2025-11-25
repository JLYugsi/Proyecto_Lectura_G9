from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pymongo import MongoClient

# ---------------------------------------------------------
# CREDENCIALES: Deben coincidir con docker-compose.yml
# ---------------------------------------------------------
USER = "admin"
PASS = "password123"  # <--- ¡SI CAMBIASTE LA PASS EN DOCKER, CÁMBIALA AQUÍ!
HOST = "127.0.0.1"    # Usamos IP directa para evitar errores de localhost en Windows

# 1. CONFIGURACIÓN POSTGRESQL
# Puerto 5432 es el estándar
SQL_DB_NAME = "tdah_gamification_db"
SQLALCHEMY_DATABASE_URL = f"postgresql://{USER}:{PASS}@{HOST}:5432/{SQL_DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 2. CONFIGURACIÓN MONGODB
# Puerto 27018 es el que definimos en Docker para no chocar con tu Mongo local
MONGO_PORT = 27018
MONGO_DB_NAME = "tdah_logs_db"
MONGO_URI = f"mongodb://{USER}:{PASS}@{HOST}:{MONGO_PORT}/"

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    mongo_db = client[MONGO_DB_NAME]
    telemetry_collection = mongo_db["game_telemetry"]
    print(f"--- INTENTO DE CONEXIÓN MONGO A {HOST}:{MONGO_PORT} ---")
except Exception as e:
    print(f"--- ERROR CONFIGURANDO MONGO: {e} ---")