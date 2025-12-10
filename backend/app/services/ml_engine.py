import statistics
from typing import Dict, Any

class AIEngine:
    def __init__(self):
        # Aquí podrías cargar modelos entrenados (.pkl) en el futuro
        pass

    def calculate_profile(self, metrics: Dict[str, Any]) -> Dict[str, int]:
        """
        Calcula las 4 dimensiones cognitivas basándose en estadística robusta.
        """
        # 1. ATENCIÓN (Omisiones)
        # Cada error de omisión penaliza 15 puntos
        omissions = metrics.get("omission_errors", 0)
        attn_score = max(0, 100 - (omissions * 15))

        # 2. IMPULSIVIDAD (Comisiones)
        # Cada error de comisión penaliza 10 puntos
        commissions = metrics.get("commission_errors", 0)
        impulse_control = max(0, 100 - (commissions * 10))

        # 3. VELOCIDAD (Tiempo de Reacción)
        # < 250ms: Demasiado rápido (posible anticipación), pero se puntúa alto en velocidad pura
        # > 800ms: Lento (distracción)
        rt_avg = metrics.get("reaction_time_avg", 0)
        
        if rt_avg == 0: 
            speed_score = 0
        elif rt_avg < 250: 
            speed_score = 100 
        elif rt_avg > 800: 
            speed_score = 40
        else:
            # Escala lineal: 250ms=100pts ... 800ms=40pts
            # Fórmula: 100 - ((Tiempo - 250) * Factor)
            speed_score = 100 - ((rt_avg - 250) * 0.11)

        # 4. CONSISTENCIA (Desviación Estándar) - CRÍTICO PARA TDAH
        # Requiere el array crudo 'reaction_times_raw'
        rt_raw = metrics.get("reaction_times_raw", [])
        
        if len(rt_raw) > 1:
            stdev = statistics.stdev(rt_raw)
            # Neurotípico ~50-80ms de variación. TDAH > 150ms.
            # Fórmula: Si stdev es 50, puntaje 100. Si stdev sube, puntaje baja.
            consistency_score = max(0, 100 - ((stdev - 50) * 0.5))
        else:
            consistency_score = 50 # Neutro si no hay datos suficientes

        return {
            "atencion": round(attn_score),
            "impulsividad": round(impulse_control),
            "velocidad": round(speed_score),
            "consistencia": round(consistency_score)
        }

    def predict_verdict(self, profile: Dict[str, int]) -> str:
        """
        Emite un diagnóstico preliminar basado en el perfil calculado.
        """
        risk_count = 0
        if profile["consistencia"] < 60: risk_count += 1 # Inconsistente
        if profile["impulsividad"] < 60: risk_count += 1 # Impulsivo
        if profile["atencion"] < 50: risk_count += 1    # Desatento

        if risk_count >= 2:
            return "Patrón de Riesgo TDAH"
        elif risk_count == 1:
            return "Patrón con Observaciones"
        else:
            return "Patrón Neurotípico (Normal)"

# Instancia global para importar
ai_engine = AIEngine()