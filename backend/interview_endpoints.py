"""
Endpoints para persistência do simulador WOW
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from backend.interview_persistence import InterviewPersistenceManager

# Função temporária para get_current_user
def get_current_user():
    """Placeholder para autenticação - retornará usuário mock por enquanto"""
    return {"id": "test-user-id"}

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/interview", tags=["interview"])

# Models Pydantic
class CreateSessionRequest(BaseModel):
    cv_analysis_id: str
    interview_mode: str = "standard"
    difficulty: str = "médio"
    sector_detected: str
    focus_areas: List[str] = []
    questions: List[Dict]

class AnswerRequest(BaseModel):
    session_id: str
    question_id: int
    answer_text: str
    audio_url: Optional[str] = None
    transcription: Optional[str] = None
    response_time: int = 0

class FeedbackRequest(BaseModel):
    session_id: str
    question_id: int
    feedback: Dict[str, Any]

# Dependency para obter o manager
def get_interview_manager():
    return InterviewPersistenceManager()

@router.post("/session/create")
async def create_session(
    request: CreateSessionRequest,
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Cria uma nova sessão de entrevista"""
    try:
        user_id = current_user["id"]
        
        session = manager.create_interview_session(
            user_id=user_id,
            cv_analysis_id=request.cv_analysis_id,
            interview_mode=request.interview_mode,
            difficulty=request.difficulty,
            sector_detected=request.sector_detected,
            focus_areas=request.focus_areas,
            questions=request.questions
        )
        
        return {
            "success": True,
            "session": session,
            "message": "Sessão criada com sucesso"
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar sessão: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Busca uma sessão específica"""
    try:
        user_id = current_user["id"]
        session = manager.get_session(session_id, user_id)
        
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        return {
            "success": True,
            "session": session
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao buscar sessão: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/answer")
async def submit_answer(
    request: AnswerRequest,
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Submete uma resposta e atualiza o progresso"""
    try:
        user_id = current_user["id"]
        
        answer_data = {
            "user_id": user_id,
            "text": request.answer_text,
            "audio_url": request.audio_url,
            "transcription": request.transcription,
            "response_time": request.response_time
        }
        
        # Por enquanto, vamos gerar feedback básico
        # Em produção, isso viria da análise da IA
        feedback_data = {
            "nota_final": 75,  # Placeholder
            "feedback_curto": "Boa resposta",
            "pontos_melhoria": ["Seja mais específico"],
            "analise_fina": {
                "clareza": 80,
                "estrutura": 70,
                "impacto": 75,
                "conteudo_tecnico": 75
            },
            "sentiment_analysis": {
                "confidence": 0.8,
                "clarity": 0.7,
                "engagement": 0.8
            },
            "benchmark_comparison": {
                "user_score": 75,
                "average_approved": 75,
                "top_10_percent": 90,
                "percentile": 50,
                "ranking": "Na média"
            },
            "cultural_fit": {
                "company_match": 0.7,
                "team_fit": 0.8,
                "leadership_potential": 0.6
            }
        }
        
        success = manager.update_session_progress(
            session_id=request.session_id,
            question_id=request.question_id,
            answer_data=answer_data,
            feedback_data=feedback_data
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Erro ao atualizar sessão")
        
        return {
            "success": True,
            "message": "Resposta salva com sucesso",
            "feedback": feedback_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao submeter resposta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Submete feedback detalhado (para integração com análise avançada)"""
    try:
        user_id = current_user["id"]
        
        # Buscar a resposta correspondente
        session = manager.get_session(request.session_id, user_id)
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        answers = session.get("answers", [])
        answer_data = None
        
        for answer in answers:
            if answer.get("question_id") == request.question_id:
                answer_data = answer.get("answer", {})
                break
        
        if not answer_data:
            raise HTTPException(status_code=404, detail="Resposta não encontrada")
        
        success = manager.update_session_progress(
            session_id=request.session_id,
            question_id=request.question_id,
            answer_data=answer_data,
            feedback_data=request.feedback
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Erro ao atualizar sessão")
        
        return {
            "success": True,
            "message": "Feedback salvo com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao submeter feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_user_sessions(
    limit: int = 10,
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Busca sessões do usuário"""
    try:
        user_id = current_user["id"]
        sessions = manager.get_user_sessions(user_id, limit)
        
        return {
            "success": True,
            "sessions": sessions,
            "total": len(sessions)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar sessões: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile")
async def get_user_profile(
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Busca perfil completo do usuário com estatísticas"""
    try:
        user_id = current_user["id"]
        profile = manager.get_user_profile(user_id)
        
        if not profile:
            # Criar perfil se não existir
            manager._ensure_user_profile(user_id)
            profile = manager.get_user_profile(user_id)
        
        return {
            "success": True,
            "profile": profile
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar perfil: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/achievements")
async def get_user_achievements(
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Busca conquistas do usuário"""
    try:
        user_id = current_user["id"]
        achievements = manager.get_user_achievements(user_id)
        
        return {
            "success": True,
            "achievements": achievements,
            "total": len(achievements)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar conquistas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/leaderboard")
async def get_leaderboard(
    sector: Optional[str] = None,
    limit: int = 10,
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Busca leaderboard (ranking de usuários)"""
    try:
        # Buscar todos os perfis ordenados por XP
        result = manager.supabase.table("user_interview_profile")\
            .select("user_id, current_level, total_xp, current_rank, current_streak")\
            .order("total_xp", desc=True)\
            .limit(limit)\
            .execute()
        
        leaderboard = result.data if result.data else []
        
        # Adicionar ranking (1-based)
        for i, user in enumerate(leaderboard, 1):
            user["rank"] = i
            user["is_current_user"] = user["user_id"] == current_user["id"]
        
        return {
            "success": True,
            "leaderboard": leaderboard,
            "current_user_rank": next((i for i, u in enumerate(leaderboard, 1) 
                                    if u["user_id"] == current_user["id"]), None)
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Exclui uma sessão"""
    try:
        user_id = current_user["id"]
        
        # Verificar se a sessão pertence ao usuário
        session = manager.get_session(session_id, user_id)
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        # Excluir sessão (respostas serão excluídas em cascata)
        result = manager.supabase.table("interview_sessions")\
            .delete()\
            .eq("id", session_id)\
            .eq("user_id", user_id)\
            .execute()
        
        return {
            "success": True,
            "message": "Sessão excluída com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao excluir sessão: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_user_stats(
    current_user: Dict = Depends(get_current_user),
    manager: InterviewPersistenceManager = Depends(get_interview_manager)
):
    """Busca estatísticas detalhadas do usuário"""
    try:
        user_id = current_user["id"]
        profile = manager.get_user_profile(user_id)
        
        if not profile:
            return {
                "success": True,
                "stats": {
                    "total_interviews": 0,
                    "completed_interviews": 0,
                    "current_level": 1,
                    "total_xp": 0,
                    "current_streak": 0,
                    "best_streak": 0,
                    "sector_performance": {},
                    "achievements_count": 0
                }
            }
        
        stats = {
            "total_interviews": profile.get("total_interviews", 0),
            "completed_interviews": profile.get("completed_interviews", 0),
            "current_level": profile.get("current_level", 1),
            "total_xp": profile.get("total_xp", 0),
            "current_streak": profile.get("current_streak", 0),
            "best_streak": profile.get("best_streak", 0),
            "sector_performance": profile.get("sector_performance", {}),
            "achievements_count": len(profile.get("achievements", [])),
            "current_rank": profile.get("current_rank", "Iniciante"),
            "favorite_mode": profile.get("favorite_interview_mode"),
            "preferred_difficulty": profile.get("preferred_difficulty"),
            "strongest_areas": profile.get("strongest_areas", []),
            "improvement_areas": profile.get("improvement_areas", [])
        }
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar estatísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))
