import statistics
from typing import Dict, Any, List, Optional

class AIEngine:
    def __init__(self):
        pass

    def train_mock_models(self):
        print("⚙️ Motor IA inicializado: Reglas heurísticas listas.")

    def calculate_profile(self, metrics: Dict[str, Any]) -> Dict[str, int]:
        """
        Calcula las 4 dimensiones cognitivas.
        Es 'agnóstico' del juego: confía en que el frontend ya mapeó 
        los errores a 'omission_errors' y 'commission_errors'.
        """
        # 1. ATENCIÓN (Basada en Omisiones)
        omissions = metrics.get("omission_errors", 0)
        # Penalización fuerte para Omisiones
        attn_score = max(0, 100 - (omissions * 15))

        # 2. IMPULSIVIDAD (Basada en Comisiones)
        commissions = metrics.get("commission_errors", 0)
        impulse_control = max(0, 100 - (commissions * 10))

        # 3. VELOCIDAD (Tiempo de Reacción)
        rt_avg = metrics.get("reaction_time_avg", 0)
        
        if rt_avg == 0:
            # Si es 0 (ej: Vigilancia sin aciertos), velocidad baja
            speed_score = 0
        elif rt_avg < 250:
            speed_score = 100 # Muy rápido
        elif rt_avg > 3000:
            # Para TMT o Vigilancia los tiempos son más altos
            # Ajustamos la escala si detectamos tiempos muy largos
            speed_score = 40
        else:
            # Escala genérica
            speed_score = max(0, 100 - int((rt_avg - 250) * 0.05))

        # 4. CONSISTENCIA (Desviación Estándar)
        rt_raw = metrics.get("reaction_times_raw", [])
        
        if rt_raw and len(rt_raw) > 1:
            try:
                stdev = statistics.stdev(rt_raw)
                consistency_score = max(0, 100 - ((stdev - 50) * 0.5))
            except:
                consistency_score = 50
        else:
            # Si el juego no mide consistencia temporal (ej: Vigilancia), 
            # asumimos un valor neutro o basado en la precisión.
            # Si tuvo buena atención, asumimos buena consistencia.
            consistency_score = attn_score 

        return {
            "atencion": round(attn_score),
            "impulsividad": round(impulse_control),
            "velocidad": round(speed_score),
            "consistencia": round(consistency_score),
        }

    def predict_verdict(self, profile: Dict[str, int]) -> str:
        risk_count = 0
        if profile["consistencia"] < 60: risk_count += 1
        if profile["impulsividad"] < 60: risk_count += 1
        if profile["atencion"] < 50: risk_count += 1

        if risk_count >= 2:
            return "Patrón de Riesgo TDAH"
        elif risk_count == 1:
            return "Patrón con Observaciones"
        else:
            return "Patrón Neurotípico (Normal)"

    # Método helper para pruebas manuales
    def predict(self, reaction_time_ms: float, commission_errors: int):
        metrics = {
            "omission_errors": 0,
            "commission_errors": commission_errors,
            "reaction_time_avg": reaction_time_ms,
            "reaction_times_raw": [reaction_time_ms] * 5
        }
        profile = self.calculate_profile(metrics)
        verdict = self.predict_verdict(profile)
        return {"profile": profile, "verdict": verdict}

ai_engine = AIEngine()