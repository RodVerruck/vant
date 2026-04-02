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
    ErrorResponse,
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
    import concurrent.futures
    try:
        from google import genai
        from google.genai import types

        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return None

        client = genai.Client(api_key=api_key)

        # Enviar apenas os primeiros 1500 chars para economizar tokens
        jd_trimmed = job_description[:1500]

        prompt = f"""Analise esta descrição de vaga e extraia EXATAMENTE 4 campos em JSON.
Regras:
- target_role: O título/cargo da vaga (ex: "Credit Risk Specialist", "Product Designer", "Analista de Dados"). Seja conciso, máximo 60 caracteres.
- target_company: O nome da empresa que está contratando (ex: "Nubank", "Google", "TOTVS"). Se não encontrar, retorne string vazia.
- category: Classifique em UMA destas categorias com base na área da vaga:
  Tecnologia (dev, dados, IA, suporte técnico, TI, infra, DevOps, QA, helpdesk)
  Design (UX, UI, product design, design gráfico)
  Marketing (marketing, growth, conteúdo, mídia, branding)
  Vendas (vendas, comercial, SDR, BDR, customer success, representação comercial)
  Gestão (product manager, gestão de projetos, scrum master, coordenação)
  Financeiro (finanças, contabilidade, fiscal, tesouraria, auditoria, crédito, risco)
  RH (recursos humanos, recrutamento, DP, gestão de pessoas)
  Operações (logística, supply chain, operações, produção)
  Geral (APENAS se não se encaixar em nenhuma acima)
- company_domain: O domínio do site oficial da empresa (ex: "nubank.com.br", "google.com", "totvs.com", "advicehealth.com.br"). Apenas o domínio, sem https://. Tente inferir o domínio a partir do nome da empresa. Se não conseguir, retorne null.

Retorne APENAS o JSON, sem markdown, sem explicação.

Descrição da vaga:
{jd_trimmed}"""

        def _call_gemini():
            return client.models.generate_content(
                model="models/gemini-2.0-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    max_output_tokens=200,
                ),
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_call_gemini)
            response = future.result(timeout=10)

        text = response.text.strip()
        # Limpar possível markdown
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        raw_domain = data.get("company_domain") or ""
        # Sanitize domain: strip protocol, paths, whitespace
        clean_domain = str(raw_domain).strip().lower()
        for prefix in ["https://", "http://", "www."]:
            if clean_domain.startswith(prefix):
                clean_domain = clean_domain[len(prefix):]
        clean_domain = clean_domain.split("/")[0].strip()
        if not clean_domain or "." not in clean_domain:
            clean_domain = ""

        result = {
            "target_role": str(data.get("target_role", ""))[:80],
            "target_company": str(data.get("target_company", ""))[:60],
            "category": str(data.get("category", "Geral")),
            "company_domain": clean_domain[:80],
            "_v": 2,
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
        "company_domain": "",
        "_v": 2,
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

    result["_v"] = 2
    return result


@router.get("/user/last-cv/{user_id}")
def get_last_cv(user_id: str) -> JSONResponse:
    """Retorna informações do último CV analisado pelo usuário."""
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
        from cache_manager import CacheManager
        from datetime import datetime, timedelta
        
        cache_manager = CacheManager()
        
        # Busca o histórico mais recente do usuário (limit=1)
        history = cache_manager.get_user_history(user_id, limit=1, offset=0)
        
        if not history:
            return JSONResponse(content={
                "has_last_cv": False,
                "message": "Nenhum CV encontrado no histórico"
            })
        
        # Pega o item mais recente
        last_analysis = history[0]
        created_at = datetime.fromisoformat(last_analysis["created_at"].replace('Z', '+00:00'))
        now = datetime.now(created_at.tzinfo)
        
        # Calcula tempo decorrido
        time_diff = now - created_at
        hours_ago = time_diff.total_seconds() / 3600
        
        # Considera "recente" se tiver menos de 24 horas
        is_recent = hours_ago < 24
        
        # Extrai nome do arquivo do result_json se disponível
        result_json = last_analysis.get("result_json", {})
        filename = result_json.get("_original_filename", "CV analisado")
        
        # Formata tempo relativo
        if hours_ago < 1:
            time_ago = "há menos de 1 hora"
        elif hours_ago < 24:
            hours = int(hours_ago)
            time_ago = f"há {hours} hora{'s' if hours > 1 else ''}"
        else:
            days = int(hours_ago / 24)
            time_ago = f"há {days} dia{'s' if days > 1 else ''}"
        
        return JSONResponse(content={
            "has_last_cv": True,
            "filename": filename,
            "created_at": last_analysis["created_at"],
            "time_ago": time_ago,
            "hours_ago": round(hours_ago, 1),
            "is_recent": is_recent,
            "job_description": last_analysis.get("job_description", "")[:100],
            "analysis_id": last_analysis["id"]
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


@router.get("/user/last-cv-file/{analysis_id}")
def get_last_cv_file(analysis_id: str, user_id: str) -> JSONResponse:
    """Retorna o cv_text_original de uma análise para reutilização."""
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
        response = supabase_admin.table("cached_analyses").select(
            "cv_text_original"
        ).eq("id", analysis_id).eq("user_id", user_id).single().execute()
        
        if not response.data or not response.data.get("cv_text_original"):
            return JSONResponse(
                status_code=404,
                content={"error": "CV não encontrado"}
            )
        
        return JSONResponse(content={
            "cv_text": response.data["cv_text_original"]
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


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
        llm_extractions = 0  # Limit LLM calls per request to avoid slow responses
        MAX_LLM_PER_REQUEST = 2
        for item in history:
            result_json = item.get("result_json", {}) or {}

            # Verificar se já temos metadados cacheados no result_json
            cached_meta = result_json.get("_card_metadata")
            # Re-extract if metadata is outdated or wrong
            needs_reextract = False
            if cached_meta:
                # Check 1: metadata version outdated (prompt was improved)
                if cached_meta.get("_v", 0) < 2:
                    needs_reextract = True
                # Check 2: _user_area exists and doesn't match cached category
                else:
                    user_area = result_json.get("_user_area", "")
                    expected_cat = _USER_AREA_TO_CATEGORY.get(user_area, "")
                    if expected_cat and cached_meta.get("category", "Geral") != expected_cat:
                        needs_reextract = True

            # Skip LLM re-extraction if we've hit the limit for this request
            if needs_reextract and llm_extractions >= MAX_LLM_PER_REQUEST:
                needs_reextract = False

            if cached_meta and cached_meta.get("target_role") and not needs_reextract:
                meta = cached_meta
            else:
                llm_extractions += 1
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
                "company_domain": meta.get("company_domain", ""),
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
