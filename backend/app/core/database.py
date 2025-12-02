import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Cargar variables de entorno
load_dotenv()

USER = os.getenv("MONGO_USER")
PASS = os.getenv("MONGO_PASSWORD")
HOST = os.getenv("MONGO_HOST")
PORT = os.getenv("MONGO_PORT")
DB_NAME = os.getenv("MONGO_DB")

# Construir URI
# Nota: Si alguna variable es None, esto fallará. Asegúrate de tener el archivo .env
MONGO_URI = f"mongodb://{USER}:{PASS}@{HOST}:{PORT}/"

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # --- DEFINICIÓN DE COLECCIONES ---
    users_collection = db["users"]
    children_collection = db["children"]
    results_collection = db["results"]
    
    # ESTA FUE LA LÍNEA QUE FALTÓ:
    badges_collection = db["badges"] 
    
    print(f"--- CONEXIÓN MONGO EXITOSA A {DB_NAME} ---")

except Exception as e:
    print(f"❌ ERROR CRÍTICO DE BD: {e}")