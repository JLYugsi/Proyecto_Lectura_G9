import statistics
from typing import Dict, Any, List, Optional

class AIEngine:
    def __init__(self):
        pass

    def train_mock_models(self):
        print("⚙️ Motor IA calibrado: Normas ajustadas a población infantil.")

    def calculate_profile(self, metrics: Dict[str, Any]) -> Dict[str, int]:
        """
        Calcula dimensiones cognitivas (Escala 0-100).
        CALIBRACIÓN CIENTÍFICA V2 (Ajustada para niños):
        - Penalizaciones suavizadas.
        - Tiempos de reacción base aumentados (250ms -> 450ms).
        """
        
        # 1. ATENCIÓN (Basada en Omisiones - No ver el objetivo)
        omissions = metrics.get("omission_errors", 0)
        # Antes: x15 (muy castigador). Ahora: x8. 
        # Permite hasta 3-4 errores manteniendo un puntaje "Normal" (>70).
        attn_score = max(0, 100 - (omissions * 8))

        # 2. IMPULSIVIDAD (Basada en Comisiones - Clics incorrectos)
        commissions = metrics.get("commission_errors", 0)
        # La impulsividad es clave en TDAH, castigamos un poco más que la atención pero no tanto.
        impulse_control = max(0, 100 - (commissions * 10))

        # 3. VELOCIDAD (Tiempo de Reacción Promedio)
        rt_avg = metrics.get("reaction_time_avg", 0)
        
        if rt_avg == 0:
            speed_score = 0 # No jugó o no acertó nada
        elif rt_avg < 200:
            speed_score = 100 # Imposiblemente rápido (o anticipación), lo dejamos en 100
        else:
            # CALIBRACIÓN: Un niño promedio reacciona en 450-550ms.
            # Antes penalizábamos desde 250ms. Ahora desde 400ms.
            # Fórmula: 100 - (ms extra sobre 400) / 8
            # Ejemplo: 600ms -> 100 - (200/8) = 75 (Normal)
            # Ejemplo: 1000ms -> 100 - (600/8) = 25 (Lento/Distraído)
            penalty = max(0, (rt_avg - 400) / 8)
            speed_score = max(0, 100 - int(penalty))

        # 4. CONSISTENCIA (Desviación Estándar del Tiempo)
        # ¿Qué tan robot es? Variar mucho es signo de inatención fluctuante.
        rt_raw = metrics.get("reaction_times_raw", [])
        
        if rt_raw and len(rt_raw) > 2:
            try:
                stdev = statistics.stdev(rt_raw)
                # Calibración: STDEV de 100ms es normal. 200ms es inestable.
                # 100 - ((150 - 80) * 0.5) = 65
                consistency_score = max(0, 100 - int((stdev - 80) * 0.6))
            except:
                consistency_score = 70 # Valor por defecto seguro
        else:
            # Si no hay datos temporales (ej. Vigilancia a veces), 
            # asumimos que la consistencia va ligada a la atención general.
            consistency_score = attn_score 

        return {
            "atencion": round(attn_score),
            "impulsividad": round(impulse_control),
            "velocidad": round(speed_score),
            "consistencia": round(consistency_score),
        }

    def predict_verdict(self, profile: Dict[str, int]) -> str:
        # Umbrales clínicos ajustados (Escala Conners/DSM-5 simulada)
        risk_factors = 0
        
        # Si baja de 60 es "Borderline/Riesgo". Si baja de 40 es "Clínico".
        if profile["consistencia"] < 55: risk_factors += 1
        if profile["impulsividad"] < 55: risk_factors += 1
        if profile["atencion"] < 60: risk_factors += 1
        
        # Velocidad muy lenta también cuenta
        if profile["velocidad"] < 50: risk_factors += 1

        if risk_factors >= 3:
            return "Alta Probabilidad TDAH"
        elif risk_factors == 2:
            return "Sospecha Leve (Seguimiento)"
        elif risk_factors == 1:
            return "Dentro de Norma (Con observaciones)"
        else:
            return "Neurotípico (Sin hallazgos)"

ai_engine = AIEngine()