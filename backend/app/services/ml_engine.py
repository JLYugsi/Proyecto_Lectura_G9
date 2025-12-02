import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

class MultiGameAIDetector:
    def __init__(self):
        # Diccionario para guardar un modelo experto por cada juego
        self.models = {}
        self.is_trained = False

    def train_mock_models(self):
        """
        Entrena 4 modelos distintos, cada uno con la escala de datos correcta
        para su juego específico.
        """
        print("🧠 Entrenando Clúster de Modelos de IA...")

        # 1. CPT (Inhibición): Tiempos rápidos (ms), Errores críticos
        # Normal: 350-550ms, 0-2 errores.
        self.models['cpt'] = self._train_single_model(time_loc=450, time_scale=50, err_loc=1, err_scale=1)

        # 2. TOVA (Vigilancia): Tiempos más lentos (ms), Errores por aburrimiento
        # Normal: 450-650ms, 0-3 errores.
        self.models['tova'] = self._train_single_model(time_loc=550, time_scale=60, err_loc=1, err_scale=1)

        # 3. TMT (Planning): ¡OJO! Aquí medimos SEGUNDOS o miles de ms.
        # Normal: 25,000ms - 45,000ms.
        self.models['tmt'] = self._train_single_model(time_loc=35000, time_scale=5000, err_loc=0, err_scale=1)

        # 4. CARAS (Percepción): Tiempos medios.
        # Normal: 800-1200ms por ítem.
        self.models['caras'] = self._train_single_model(time_loc=1000, time_scale=150, err_loc=2, err_scale=2)

        self.is_trained = True
        print("✅ 4 Modelos Expertos Cargados en Memoria.")

    def _train_single_model(self, time_loc, time_scale, err_loc, err_scale):
        """Función auxiliar para crear un IsolationForest específico"""
        # Datos Normales
        X_normal = np.random.normal(loc=[time_loc, err_loc], scale=[time_scale, err_scale], size=(1000, 2))
        # Datos Anómalos (TDAH simulado)
        X_anomalo = np.random.normal(loc=[time_loc*1.5, err_loc+5], scale=[time_scale*2, err_scale*3], size=(100, 2))
        
        X_train = np.vstack([X_normal, X_anomalo])
        clf = IsolationForest(contamination=0.1, random_state=42)
        clf.fit(X_train)
        return clf

    def predict(self, game_code, reaction_time, errors):
        """
        Selecciona el modelo correcto según el game_code.
        """
        if not self.is_trained:
            self.train_mock_models()

        # Normalizamos el código del juego (por si llega 'cpt_ii' lo pasamos a 'cpt')
        model_key = 'cpt' # Default
        if 'tova' in game_code: model_key = 'tova'
        elif 'tmt' in game_code: model_key = 'tmt'
        elif 'caras' in game_code: model_key = 'caras'

        selected_model = self.models.get(model_key)
        
        if not selected_model:
            return "Error: Modelo no encontrado"

        # Predicción
        prediction = selected_model.predict([[reaction_time, errors]])[0]
        
        if prediction == -1:
            return "Riesgo Detectado (Patrón Atípico)"
        else:
            return "Patrón Neurotípico (Normal)"

# Instancia única
ai_engine = MultiGameAIDetector()