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


def _extract_card_metadata_llm(job_description: str) -> dict | None:
    """Usa Gemini Flash para extrair target_role, target_company e category da job description."""
    import json
    import os
    try:
        from google import genai
        from google.genai import types

        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return None

        client = genai.Client(api_key=api_key)

        # Enviar apenas os primeiros 1500 chars para economizar tokens
        jd_trimmed = job_description[:1500]

        prompt = f"""Analise esta descrição de vaga e extraia EXATAMENTE 3 campos em JSON.
Regras:
- target_role: O título/cargo da vaga (ex: "Credit Risk Specialist", "Product Designer", "Analista de Dados"). Seja conciso, máximo 60 caracteres.
- target_company: O nome da empresa que está contratando (ex: "Nubank", "Google", "TOTVS"). Se não encontrar, retorne string vazia.
- category: Classifique em UMA destas categorias: Tecnologia, Design, Marketing, Vendas, Gestão, Financeiro, RH, Operações, Geral.

Retorne APENAS o JSON, sem markdown, sem explicação.

Descrição da vaga:
{jd_trimmed}"""

        response = client.models.generate_content(
            model="models/gemini-2.0-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=150,
            ),
        )

        text = response.text.strip()
        # Limpar possível markdown
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        result = {
            "target_role": str(data.get("target_role", ""))[:80],
            "target_company": str(data.get("target_company", ""))[:60],
            "category": str(data.get("category", "Geral")),
        }

        # Validar category
        valid_categories = {"Tecnologia", "Design", "Marketing", "Vendas", "Gestão", "Financeiro", "RH", "Operações", "Geral"}
        if result["category"] not in valid_categories:
            result["category"] = "Geral"

        return result

    except Exception as e:
        print(f"⚠️ [CardMetadata] LLM extraction failed: {type(e).__name__}: {e}")
        return None


def _extract_card_metadata_fallback(job_description: str) -> dict:
    """Fallback simples caso a LLM falhe. Usa primeira linha significativa."""
    jd = job_description.strip()
    target_role = ""

    for line in jd.split("\n"):
        line = line.strip()
        if not line or len(line) < 4:
            continue
        line_lower = line.lower()
        if any(skip in line_lower for skip in [
            "about us", "sobre a empresa", "quem somos", "about the company",
            "busco oportunidades", "oportunidades profissionais",
            "about", "benefits", "benefícios", "requirements", "requisitos",
        ]):
            continue
        target_role = line[:80]
        break

    return {
        "target_role": target_role or "Otimização Geral",
        "target_company": "",
        "category": "Geral",
    }


_USER_AREA_TO_CATEGORY = {
    "ti_dados_ai": "Tecnologia",
    "ti_dev_gen": "Tecnologia",
    "ti_suporte": "Tecnologia",
    "produto_agil": "Gestão",
    "marketing_growth": "Marketing",
    "vendas_cs": "Vendas",
    "rh_lideranca": "RH",
    "financeiro_corp": "Financeiro",
    "global_soft_skills": "Geral",
}


_JD_AREA_KEYWORDS_TO_CATEGORY = {
    "financeiro": "Financeiro",
    "finanças": "Financeiro",
    "corporativo": "Financeiro",
    "tecnologia": "Tecnologia",
    "dados": "Tecnologia",
    "software": "Tecnologia",
    "suporte técnico": "Tecnologia",
    "ti/suporte": "Tecnologia",
    "produto": "Gestão",
    "agile": "Gestão",
    "marketing": "Marketing",
    "growth": "Marketing",
    "vendas": "Vendas",
    "customer success": "Vendas",
    "rh": "RH",
    "liderança": "RH",
    "recursos humanos": "RH",
}


def _detect_area_from_jd(job_description: str) -> str:
    """Detect user-selected area from job_description text patterns.
    The orchestrator prepends 'Vaga na área de X' to generic job descriptions."""
    jd_lower = job_description[:200].lower()
    for keyword, cat in _JD_AREA_KEYWORDS_TO_CATEGORY.items():
        if keyword in jd_lower:
            return cat
    return ""


def _extract_card_metadata(job_description: str, result_json: dict) -> dict:
    """Extrai metadados do card via LLM (Gemini Flash) com fallback simples.
    Prioriza a área selecionada pelo usuário (_user_area) se disponível."""
    # Tentar LLM primeiro
    result = _extract_card_metadata_llm(job_description)
    if not result or not result.get("target_role"):
        result = _extract_card_metadata_fallback(job_description)

    # Sobrescrever category com a área explícita do usuário, se existir
    user_area = result_json.get("_user_area", "")
    if user_area and user_area in _USER_AREA_TO_CATEGORY:
        result["category"] = _USER_AREA_TO_CATEGORY[user_area]
    elif result.get("category", "Geral") == "Geral":
        # Fallback: detect area from job_description text for legacy items
        detected = _detect_area_from_jd(job_description)
        if detected:
            result["category"] = detected

    return result


@router.get("/user/history")
def get_user_history(user_id: str, page: int = 1, page_size: int = 6) -> JSONResponse:
    try:
        from cache_manager import CacheManager
        
        cache_manager = CacheManager()
        offset = (max(1, page) - 1) * page_size
        total = cache_manager.get_user_history_count(user_id)
        history = cache_manager.get_user_history(user_id, limit=page_size, offset=offset)
        
        # Formata os dados para o frontend
        formatted_history = []
        for item in history:
            result_json = item.get("result_json", {}) or {}

            # Verificar se já temos metadados cacheados no result_json
            cached_meta = result_json.get("_card_metadata")
            # Re-extract if cached category is wrong
            needs_reextract = False
            if cached_meta:
                cached_cat = cached_meta.get("category", "Geral")
                # Check 1: _user_area exists and doesn't match cached category
                user_area = result_json.get("_user_area", "")
                expected_cat = _USER_AREA_TO_CATEGORY.get(user_area, "")
                if expected_cat and cached_cat != expected_cat:
                    needs_reextract = True
                # Check 2: Legacy items — cached "Geral" but JD has area keywords
                elif cached_cat == "Geral" and _detect_area_from_jd(item.get("job_description", "")):
                    needs_reextract = True
            if cached_meta and cached_meta.get("target_role") and not needs_reextract:
                meta = cached_meta
            else:
                # Extrair via LLM (com fallback) e persistir no DB
                meta = _extract_card_metadata(item.get("job_description", ""), result_json)
                try:
                    result_json["_card_metadata"] = meta
                    if supabase_admin:
                        supabase_admin.table("cached_analyses").update({
                            "result_json": result_json
                        }).eq("id", item["id"]).execute()
                        print(f"💾 [CardMetadata] Cached for item {item['id'][:8]}...: {meta.get('target_role', '?')} @ {meta.get('target_company', '?')}")
                except Exception as persist_err:
                    print(f"⚠️ [CardMetadata] Failed to persist: {persist_err}")

            score = result_json.get("score_ats", 0) or result_json.get("nota_ats", 0) or 0

            formatted_history.append({
                "id": item["id"],
                "created_at": item["created_at"],
                "job_description": item["job_description"][:100] + "..." if len(item["job_description"]) > 100 else item["job_description"],
                "target_role": meta.get("target_role", "Otimização Geral"),
                "target_company": meta.get("target_company", ""),
                "category": meta.get("category", "Geral"),
                "result_preview": {
                    "veredito": result_json.get("veredito", "N/A"),
                    "score_ats": score,
                    "gaps_count": len(result_json.get("gaps_fatais", []))
                }
            })
        
        return JSONResponse(content={
            "history": formatted_history,
            "total": total,
            "page": max(1, page),
            "page_size": page_size,
            "has_more": (offset + page_size) < total,
        })
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})
