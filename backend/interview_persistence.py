"""
Gerenciador de Persistência do Simulador WOW
Gerencia sessões, respostas, gamificação e conquistas
"""

import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from supabase import create_client
from backend.llm_core import logger
import os

class InterviewPersistenceManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            logger.error("❌ Supabase credentials not found")
            raise ValueError("Supabase credentials are required")
        
        self.supabase = create_client(self.supabase_url, self.supabase_key)
    
    def create_interview_session(
        self,
        user_id: str,
        cv_analysis_id: str,
        interview_mode: str,
        difficulty: str,
        sector_detected: str,
        focus_areas: List[str],
        questions: List[Dict]
    ) -> Dict[str, Any]:
        """Cria uma nova sessão de entrevista"""
        try:
            # Garantir que o perfil do usuário existe
            self._ensure_user_profile(user_id)
            
            session_data = {
                "user_id": user_id,
                "cv_analysis_id": cv_analysis_id,
                "interview_mode": interview_mode,
                "difficulty": difficulty,
                "sector_detected": sector_detected,
                "focus_areas": focus_areas,
                "status": "created",
                "current_question": 1,
                "total_questions": len(questions),
                "questions": questions,
                "answers": [],
                "feedbacks": []
            }
            
            result = self.supabase.table("interview_sessions").insert(session_data).execute()
            
            if result.data:
                session = result.data[0]
                logger.info(f"✅ Sessão criada: {session['id']}")
                return session
            else:
                raise Exception("Failed to create session")
                
        except Exception as e:
            logger.error(f"❌ Erro ao criar sessão: {e}")
            raise
    
    def get_session(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Busca uma sessão específica"""
        try:
            result = self.supabase.table("interview_sessions")\
                .select("*")\
                .eq("id", session_id)\
                .eq("user_id", user_id)\
                .execute()
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar sessão: {e}")
            return None
    
    def update_session_progress(
        self,
        session_id: str,
        question_id: int,
        answer_data: Dict[str, Any],
        feedback_data: Dict[str, Any]
    ) -> bool:
        """Atualiza o progresso da sessão com uma nova resposta"""
        try:
            # Buscar sessão atual
            session = self.get_session(session_id, answer_data.get("user_id", ""))
            if not session:
                return False
            
            # Adicionar resposta e feedback
            answers = session.get("answers", [])
            feedbacks = session.get("feedbacks", [])
            
            answers.append({
                "question_id": question_id,
                "answer": answer_data,
                "answered_at": datetime.now().isoformat()
            })
            
            feedbacks.append({
                "question_id": question_id,
                "feedback": feedback_data,
                "score": feedback_data.get("nota_final", 0),
                "answered_at": datetime.now().isoformat()
            })
            
            # Calcular progresso
            current_question = question_id + 1
            total_questions = session.get("total_questions", 5)
            status = "completed" if current_question > total_questions else "in_progress"
            
            # Atualizar sessão
            update_data = {
                "answers": answers,
                "feedbacks": feedbacks,
                "current_question": current_question,
                "status": status,
                "updated_at": datetime.now().isoformat()
            }
            
            if status == "completed":
                update_data["completed_at"] = datetime.now().isoformat()
                # Calcular score final e XP
                final_score = sum(f.get("score", 0) for f in feedbacks) / len(feedbacks)
                update_data["final_score"] = int(final_score)
                update_data["total_xp_earned"] = self._calculate_xp(feedbacks)
                update_data["perfect_answers"] = sum(1 for f in feedbacks if f.get("score", 0) >= 90)
            
            result = self.supabase.table("interview_sessions")\
                .update(update_data)\
                .eq("id", session_id)\
                .execute()
            
            if result.data:
                # Salvar resposta detalhada
                self._save_detailed_answer(session_id, question_id, session, answer_data, feedback_data)
                
                # Atualizar perfil do usuário se completou
                if status == "completed":
                    self._update_user_profile(answer_data.get("user_id", ""), session, feedbacks)
                    self._check_achievements(answer_data.get("user_id", ""), session)
                
                logger.info(f"✅ Sessão {session_id} atualizada: {current_question}/{total_questions}")
                return True
            else:
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar sessão: {e}")
            return False
    
    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Busca sessões do usuário"""
        try:
            result = self.supabase.table("interview_sessions")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar sessões do usuário: {e}")
            return []
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Busca perfil completo do usuário com estatísticas"""
        try:
            result = self.supabase.table("user_interview_profile")\
                .select("*")\
                .eq("user_id", user_id)\
                .execute()
            
            if result.data:
                profile = result.data[0]
                
                # Adicionar estatísticas adicionais
                profile["recent_sessions"] = self.get_user_sessions(user_id, 5)
                profile["achievements"] = self.get_user_achievements(user_id)
                
                return profile
            else:
                return None
                
        except Exception as e:
            logger.error(f"❌ Erro ao buscar perfil do usuário: {e}")
            return None
    
    def get_user_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Busca conquistas do usuário"""
        try:
            result = self.supabase.table("user_achievements")\
                .select("""
                    *,
                    achievement:achievements(name, description, icon, category)
                """)\
                .eq("user_id", user_id)\
                .order("unlocked_at", desc=True)\
                .execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar conquistas: {e}")
            return []
    
    def _ensure_user_profile(self, user_id: str):
        """Garante que o perfil do usuário existe"""
        try:
            self.supabase.rpc("ensure_user_profile", {"user_uuid": user_id}).execute()
        except Exception as e:
            logger.warning(f"⚠️ Erro ao garantir perfil: {e}")
    
    def _save_detailed_answer(
        self,
        session_id: str,
        question_id: int,
        session: Dict,
        answer_data: Dict,
        feedback_data: Dict
    ):
        """Salva resposta detalhada na tabela answers"""
        try:
            questions = session.get("questions", [])
            question = questions[question_id - 1] if question_id <= len(questions) else {}
            
            answer_record = {
                "session_id": session_id,
                "question_id": question_id,
                "question_text": question.get("text", ""),
                "question_type": question.get("type", ""),
                "question_intent": question.get("intent", ""),
                "question_focus": question.get("focus", []),
                "answer_text": answer_data.get("text", ""),
                "audio_file_url": answer_data.get("audio_url", ""),
                "transcription": answer_data.get("transcription", ""),
                "response_time_seconds": answer_data.get("response_time", 0),
                "feedback": feedback_data,
                "score": feedback_data.get("nota_final", 0),
                "sentiment_analysis": feedback_data.get("sentiment_analysis", {}),
                "benchmark_comparison": feedback_data.get("benchmark_comparison", {}),
                "cultural_fit": feedback_data.get("cultural_fit", {})
            }
            
            self.supabase.table("interview_answers").insert(answer_record).execute()
            
        except Exception as e:
            logger.warning(f"⚠️ Erro ao salvar resposta detalhada: {e}")
    
    def _calculate_xp(self, feedbacks: List[Dict]) -> int:
        """Calcula XP baseado nos feedbacks"""
        base_xp = sum(f.get("score", 0) for f in feedbacks)
        
        # Bônus por respostas perfeitas
        perfect_bonus = sum(10 for f in feedbacks if f.get("score", 0) >= 90)
        
        # Bônus de streak (se houver)
        streak_bonus = len(feedbacks) * 5  # 5 XP por resposta consecutiva
        
        return base_xp + perfect_bonus + streak_bonus
    
    def _update_user_profile(self, user_id: str, session: Dict, feedbacks: List[Dict]):
        """Atualiza perfil do usuário com estatísticas da sessão"""
        try:
            # Buscar perfil atual
            profile_result = self.supabase.table("user_interview_profile")\
                .select("*")\
                .eq("user_id", user_id)\
                .execute()
            
            if not profile_result.data:
                return
            
            profile = profile_result.data[0]
            
            # Calcular novas estatísticas
            total_interviews = profile.get("total_interviews", 0) + 1
            completed_interviews = profile.get("completed_interviews", 0) + 1
            total_questions = profile.get("total_questions_answered", 0) + len(feedbacks)
            session_xp = self._calculate_xp(feedbacks)
            total_xp = profile.get("total_xp", 0) + session_xp
            
            # Calcular nível e rank
            level_result = self.supabase.rpc("calculate_level_and_rank", {"total_xp": total_xp}).execute()
            level_info = level_result.data[0] if level_result.data else {"level": 1, "rank": "Iniciante"}
            
            # Atualizar performance por setor
            sector_performance = profile.get("sector_performance", {})
            sector = session.get("sector_detected", "Desconhecido")
            sector_stats = sector_performance.get(sector, {"interviews": 0, "total_score": 0})
            
            sector_stats["interviews"] += 1
            sector_stats["total_score"] += session.get("final_score", 0)
            sector_stats["avg_score"] = sector_stats["total_score"] / sector_stats["interviews"]
            
            sector_performance[sector] = sector_stats
            
            # Atualizar streak
            last_interview_date = profile.get("last_interview_date")
            current_streak = profile.get("current_streak", 0)
            
            if last_interview_date:
                last_date = datetime.fromisoformat(last_interview_date.replace('Z', '+00:00'))
                if (datetime.now() - last_date).days <= 2:  # Até 2 dias de diferença
                    current_streak += 1
                else:
                    current_streak = 1
            else:
                current_streak = 1
            
            best_streak = max(profile.get("best_streak", 0), current_streak)
            
            # Atualizar perfil
            update_data = {
                "total_interviews": total_interviews,
                "completed_interviews": completed_interviews,
                "total_questions_answered": total_questions,
                "current_level": level_info.get("level", 1),
                "total_xp": total_xp,
                "current_streak": current_streak,
                "best_streak": best_streak,
                "current_rank": level_info.get("rank", "Iniciante"),
                "sector_performance": sector_performance,
                "last_interview_date": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            self.supabase.table("user_interview_profile")\
                .update(update_data)\
                .eq("user_id", user_id)\
                .execute()
            
            logger.info(f"✅ Perfil atualizado: Level {level_info.get('level', 1)}, {level_info.get('rank', 'Iniciante')}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar perfil: {e}")
    
    def _check_achievements(self, user_id: str, session: Dict):
        """Verifica e desbloqueia conquistas"""
        try:
            profile = self.get_user_profile(user_id)
            if not profile:
                return
            
            # Buscar todas as conquistas disponíveis
            achievements_result = self.supabase.table("achievements")\
                .select("*")\
                .eq("is_active", True)\
                .execute()
            
            if not achievements_result.data:
                return
            
            # Buscar conquistas já desbloqueadas
            user_achievements_result = self.supabase.table("user_achievements")\
                .select("achievement_id")\
                .eq("user_id", user_id)\
                .execute()
            
            unlocked_ids = set(ua["achievement_id"] for ua in user_achievements_result.data) if user_achievements_result.data else set()
            
            # Verificar cada conquista
            for achievement in achievements_result.data:
                if achievement["id"] in unlocked_ids:
                    continue
                
                if self._should_unlock_achievement(achievement, profile, session):
                    # Desbloquear conquista
                    self.supabase.table("user_achievements").insert({
                        "user_id": user_id,
                        "achievement_id": achievement["id"],
                        "session_id": session["id"],
                        "metadata": {
                            "session_score": session.get("final_score", 0),
                            "sector": session.get("sector_detected"),
                            "difficulty": session.get("difficulty")
                        }
                    }).execute()
                    
                    logger.info(f"🏆 Conquista desbloqueada: {achievement['name']}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao verificar conquistas: {e}")
    
    def _should_unlock_achievement(self, achievement: Dict, profile: Dict, session: Dict) -> bool:
        """Verifica se uma conquista deve ser desbloqueada"""
        req_type = achievement["requirement_type"]
        req_value = achievement["requirement_value"]
        conditions = achievement.get("conditions", {})
        
        if req_type == "count":
            if achievement["category"] == "streak":
                return profile.get("current_streak", 0) >= req_value
            elif achievement["category"] == "sector":
                sector = conditions.get("sector")
                if sector:
                    sector_perf = profile.get("sector_performance", {}).get(sector, {})
                    return sector_perf.get("interviews", 0) >= req_value
            elif achievement["category"] == "variety":
                unique_sectors = len(profile.get("sector_performance", {}))
                return unique_sectors >= req_value
            else:
                return profile.get("completed_interviews", 0) >= req_value
                
        elif req_type == "score":
            min_score = conditions.get("min_score", req_value)
            difficulty = conditions.get("difficulty")
            
            if difficulty and session.get("difficulty") != difficulty:
                return False
                
            return session.get("final_score", 0) >= min_score
            
        elif req_type == "perfect":
            return session.get("final_score", 0) >= req_value
            
        elif req_type == "level":
            return profile.get("current_level", 1) >= req_value
        
        return False
