"""
Endpoints de usuário (status, histórico, entitlements).
"""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from dependencies import (
    supabase_admin,
    validate_user_id,
    _entitlements_status,
    _consume_one_credit,
)

router = APIRouter(prefix="/api", tags=["user"])


class EntitlementsStatusRequest(BaseModel):
    user_id: str


class ConsumeOneCreditRequest(BaseModel):
    user_id: str


@router.get("/user/status/{user_id}")
def get_user_status(user_id: str) -> JSONResponse:
    """Endpoint público para verificar se usuário tem plano ativo."""
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado"}
        )
    
    if not validate_user_id(user_id):
        return JSONResponse(
            status_code=400,
            content={"error": "user_id inválido"}
        )
    
    try:
        status = _entitlements_status(user_id)
        return JSONResponse(content={
            "has_active_plan": status.get("payment_verified", False),
            "credits_remaining": status.get("credits_remaining", 0),
            "plan": status.get("plan")
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@router.post("/entitlements/status")
def entitlements_status(payload: EntitlementsStatusRequest) -> JSONResponse:
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    if payload.user_id and not validate_user_id(payload.user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        return JSONResponse(content=_entitlements_status(payload.user_id))
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.post("/entitlements/consume-one")
def entitlements_consume_one(payload: ConsumeOneCreditRequest) -> JSONResponse:
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    if payload.user_id and not validate_user_id(payload.user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        _consume_one_credit(payload.user_id)
        return JSONResponse(content=_entitlements_status(payload.user_id))
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})


@router.get("/user/history/detail")
def get_history_detail(id: str) -> JSONResponse:
    """Retorna detalhes de uma análise do histórico."""
    try:
        from cache_manager import CacheManager
        
        cache_manager = CacheManager()
        
        response = cache_manager.supabase.table("cached_analyses").select("*").eq("id", id).execute()
        
        if not response.data or len(response.data) == 0:
            return JSONResponse(status_code=404, content={"error": "Análise não encontrada"})
        
        item = response.data[0]
        
        return JSONResponse(content={"data": item["result_json"]})
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.delete("/user/history/{item_id}")
def delete_history_item(item_id: str, user_id: str) -> JSONResponse:
    """Exclui uma análise do histórico do usuário."""
    if not supabase_admin:
        return JSONResponse(status_code=500, content={"error": "Supabase não configurado"})

    if not validate_user_id(user_id):
        return JSONResponse(status_code=400, content={"error": "user_id inválido"})

    try:
        # Verifica se o item pertence ao usuário antes de deletar
        check = supabase_admin.table("cached_analyses").select("id").eq("id", item_id).eq("user_id", user_id).execute()

        if not check.data or len(check.data) == 0:
            return JSONResponse(status_code=404, content={"error": "Análise não encontrada ou não pertence a este usuário"})

        supabase_admin.table("cached_analyses").delete().eq("id", item_id).eq("user_id", user_id).execute()

        return JSONResponse(content={"success": True, "message": "Análise excluída com sucesso"})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.get("/user/history")
def get_user_history(user_id: str) -> JSONResponse:
    try:
        from cache_manager import CacheManager
        
        cache_manager = CacheManager()
        history = cache_manager.get_user_history(user_id, limit=10)
        
        # Formata os dados para o frontend
        formatted_history = []
        for item in history:
            formatted_history.append({
                "id": item["id"],
                "created_at": item["created_at"],
                "job_description": item["job_description"][:100] + "..." if len(item["job_description"]) > 100 else item["job_description"],
                "result_preview": {
                    "veredito": item["result_json"].get("veredito", "N/A"),
                    "score_ats": item["result_json"].get("score_ats", 0),
                    "gaps_count": len(item["result_json"].get("gaps_fatais", []))
                }
            })
        
        return JSONResponse(content={"history": formatted_history})
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})
