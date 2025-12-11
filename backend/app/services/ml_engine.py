import statistics
from typing import Dict, Any, List, Optional

class AIEngine:
    def __init__(self):
        # Aquí podrías cargar modelos entrenados (.pkl) en el futuro
        # Por ahora usamos reglas estadísticas simples.
        pass

    # ---------- NUEVO: método llamado en el startup ----------
    def train_mock_models(self):
        """
        Método de compatibilidad llamado desde main.py al iniciar la API.
        Aquí podrías cargar/entrenar modelos reales.
        Por ahora solo imprime un mensaje.
        """
        print("⚙️ train_mock_models(): usando reglas estadísticas simples (sin modelo ML entrenado).")

    # ---------- EXISTENTE ----------
    def calculate_profile(self, metrics: Dict[str, Any]) -> Dict[str, int]:
        """
        Calcula las 4 dimensiones cognitivas basándose en estadística robusta.
        """
        # 1. ATENCIÓN (Omisiones)
        omissions = metrics.get("omission_errors", 0)
        attn_score = max(0, 100 - (omissions * 15))

        # 2. IMPULSIVIDAD (Comisiones)
        commissions = metrics.get("commission_errors", 0)
        impulse_control = max(0, 100 - (commissions * 10))

        # 3. VELOCIDAD (Tiempo de Reacción)
        rt_avg = metrics.get("reaction_time_avg", 0)
        if rt_avg == 0:
            speed_score = 0
        elif rt_avg < 250:
            speed_score = 100
        elif rt_avg > 800:
            speed_score = 40
        else:
            speed_score = 100 - ((rt_avg - 250) * 0.11)

        # 4. CONSISTENCIA (Desviación Estándar)
        rt_raw = metrics.get("reaction_times_raw", [])
        if len(rt_raw) > 1:
            stdev = statistics.stdev(rt_raw)
            consistency_score = max(0, 100 - ((stdev - 50) * 0.5))
        else:
            consistency_score = 50  # neutro si no hay datos suficientes

        return {
            "atencion": round(attn_score),
            "impulsividad": round(impulse_control),
            "velocidad": round(speed_score),
            "consistencia": round(consistency_score),
        }

    # ---------- EXISTENTE ----------
    def predict_verdict(self, profile: Dict[str, int]) -> str:
        """
        Emite un diagnóstico preliminar basado en el perfil calculado.
        """
        risk_count = 0
        if profile["consistencia"] < 60:
            risk_count += 1  # Inconsistente
        if profile["impulsividad"] < 60:
            risk_count += 1  # Impulsivo
        if profile["atencion"] < 50:
            risk_count += 1  # Desatento

        if risk_count >= 2:
            return "Patrón de Riesgo TDAH"
        elif risk_count == 1:
            return "Patrón con Observaciones"
        else:
            return "Patrón Neurotípico (Normal)"

    # ---------- NUEVO: método usado en /health-check ----------
    def predict(
        self,
        reaction_time_ms: float,
        commission_errors: int,
        omission_errors: int = 0,
        reaction_times_raw: Optional[List[float]] = None,
    ):
        """
        Interfaz sencilla para hacer una predicción rápida.
        Usa calculate_profile + predict_verdict.
        """
        if reaction_times_raw is None:
            # simulamos varios tiempos similares para poder calcular stdev
            reaction_times_raw = [reaction_time_ms] * 5

        metrics = {
            "omission_errors": omission_errors,
            "commission_errors": commission_errors,
            "reaction_time_avg": reaction_time_ms,
            "reaction_times_raw": reaction_times_raw,
        }

        profile = self.calculate_profile(metrics)
        verdict = self.predict_verdict(profile)

        return {
            "profile": profile,
            "verdict": verdict,
        }


# Instancia global para importar
ai_engine = AIEngine()
