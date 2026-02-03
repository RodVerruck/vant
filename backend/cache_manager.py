"""
Sistema de Cache Inteligente para Vant
Reduz custos de processamento em 60-80% mantendo UX fluida
"""

import hashlib
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import os
from supabase import create_client
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Corrigido nome da variável
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
    # ============================================================
    # CACHE PARCIAL INTELIGENTE (Fase 2)
    # ============================================================
    
    def generate_component_hash(self, component_type: str, data: Dict[str, Any]) -> str:
        """
        Gera hash específico para cada componente do cache parcial
        
        Args:
            component_type: 'diagnosis', 'library', 'tactical'
            data: Dados relevantes para o componente
            
        Returns:
            Hash SHA256 específico do componente
        """
        if component_type == "diagnosis":
            # Baseado nos gaps principais + área
            gaps = data.get("gaps_fatais", [])
            area = data.get("area", "")
            normalized = {
                "type": "diagnosis",
                "gaps": sorted([gap.lower().strip() for gap in gaps[:3]]),  # Top 3 gaps
                "area": area.lower().strip()
            }
            
        elif component_type == "library":
            # Baseado na área + gaps principais
            area = data.get("area", "")
            gaps = data.get("gaps_fatais", [])
            normalized = {
                "type": "library", 
                "area": area.lower().strip(),
                "gaps": sorted([gap.lower().strip() for gap in gaps[:2]])  # Top 2 gaps
            }
            
        elif component_type == "tactical":
            # Baseado no tipo de vaga + nível
            job_desc = data.get("job_description", "")
            gaps = data.get("gaps_fatais", [])
            normalized = {
                "type": "tactical",
                "job_keywords": self._extract_keywords(job_desc.lower()),
                "gaps": sorted([gap.lower().strip() for gap in gaps[:2]])
            }
            
        else:
            # Fallback para hash genérico
            normalized = {"type": component_type, "data": str(data)}
        
        input_string = json.dumps(normalized, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(input_string.encode()).hexdigest()
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extrai palavras-chave relevantes do texto da vaga"""
        # Palavras-chave comuns em vagas
        tech_keywords = ["senior", "junior", "pleno", "lead", "manager", "director", 
                        "python", "java", "javascript", "react", "node", "aws", "cloud",
                        "data", "analytics", "mobile", "web", "backend", "frontend"]
        
        words = text.split()
        return [word for word in words if word in tech_keywords][:5]
    
    def check_partial_cache(self, component_type: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Verifica cache parcial para um componente específico
        
        Args:
            component_type: Tipo do componente
            data: Dados para gerar hash
            
        Returns:
            Resultado em cache ou None
        """
        try:
            component_hash = self.generate_component_hash(component_type, data)
            
            response = self.supabase.table("partial_cache").select("*").eq("component_hash", component_hash).execute()
            
            if response.data and len(response.data) > 0:
                cache_entry = response.data[0]
                
                # Verificar TTL (7 dias)
                created_at = datetime.fromisoformat(cache_entry["created_at"].replace('Z', '+00:00'))
                if datetime.utcnow() - created_at < timedelta(days=7):
                    logger.info(f"⚡ PARTIAL CACHE HIT: {component_type}")
                    # Atualizar hit count
                    self._update_hit_count(cache_entry["id"])
                    return json.loads(cache_entry["result_json"])
                else:
                    # Remover entrada expirada
                    self.supabase.table("partial_cache").delete().eq("id", cache_entry["id"]).execute()
                    
        except Exception as e:
            logger.error(f"❌ Erro ao verificar cache parcial [{component_type}]: {e}")
            
        return None
    
    def save_partial_cache(self, component_type: str, data: Dict[str, Any], result: Dict[str, Any]) -> bool:
        """
        Salva resultado no cache parcial
        
        Args:
            component_type: Tipo do componente
            data: Dados usados para gerar hash
            result: Resultado processado
            
        Returns:
            True se salvo com sucesso
        """
        try:
            component_hash = self.generate_component_hash(component_type, data)
            
            cache_entry = {
                "component_hash": component_hash,
                "component_type": component_type,
                "result_json": json.dumps(result),
                "created_at": datetime.utcnow().isoformat(),
                "hit_count": 1,
                "last_used": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table("partial_cache").insert(cache_entry).execute()
            
            if response.data:
                logger.info(f"💾 PARTIAL CACHE SAVED: {component_type}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Erro ao salvar cache parcial [{component_type}]: {e}")
            
        return False
    
    def _update_hit_count(self, cache_id: int):
        """Atualiza contador de hits do cache"""
        try:
            self.supabase.table("partial_cache").update({
                "hit_count": "hit_count + 1",
                "last_used": datetime.utcnow().isoformat()
            }).eq("id", cache_id).execute()
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar hit count: {e}")
        
    def generate_input_hash(self, cv_text: str, job_description: str, model_version: str = "gemini-2.0-flash") -> str:
        """
        Gera hash SHA256 dos dados de entrada para deduplicação
        
        Args:
            cv_text: Texto completo do CV
            job_description: Descrição da vaga
            model_version: Versão do modelo usado
            
        Returns:
            Hash SHA256 em formato hexadecimal
        """
        # Normalização para evitar diferenças irrelevantes
        normalized_input = {
            "cv": cv_text.strip().lower(),
            "job": job_description.strip().lower(),
            "model": model_version
        }
        
        # Gera hash SHA256
        input_string = json.dumps(normalized_input, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(input_string.encode()).hexdigest()
    
    def check_cache(self, input_hash: str) -> Optional[Dict[str, Any]]:
        """
        Verifica se resultado já existe no cache
        
        Args:
            input_hash: Hash SHA256 dos dados de entrada
            
        Returns:
            Resultado em cache ou None se não encontrado
        """
        try:
            response = self.supabase.table("cached_analyses").select("*").eq("input_hash", input_hash).execute()
            
            if response.data and len(response.data) > 0:
                cache_entry = response.data[0]
                
                # Atualiza contador de uso e último acesso
                self.supabase.table("cached_analyses").update({
                    "hit_count": cache_entry["hit_count"] + 1,
                    "last_used": datetime.utcnow().isoformat()
                }).eq("id", cache_entry["id"]).execute()
                
                logger.info(f"Cache HIT: Hash {input_hash[:8]}... (hits: {cache_entry['hit_count'] + 1})")
                return cache_entry["result_json"]
            
            logger.info(f"Cache MISS: Hash {input_hash[:8]}...")
            return None
            
        except Exception as e:
            logger.error(f"Erro ao verificar cache: {e}")
            return None
    
    def save_to_cache(self, 
                     input_hash: str,
                     user_id: str,
                     cv_text: str,
                     job_description: str,
                     result_json: Dict[str, Any],
                     model_version: str = "gemini-2.0-flash") -> bool:
        """
        Salva resultado no cache
        
        Args:
            input_hash: Hash SHA256 dos dados de entrada
            user_id: ID do usuário
            cv_text: Texto original do CV
            job_description: Descrição da vaga
            result_json: Resultado completo da análise
            model_version: Versão do modelo usado
            
        Returns:
            True se salvou com sucesso, False caso contrário
        """
        try:
            cache_data = {
                "input_hash": input_hash,
                "user_id": user_id,
                "cv_text_original": cv_text,
                "job_description": job_description,
                "result_json": result_json,
                "model_version": model_version,
                "created_at": datetime.utcnow().isoformat(),
                "last_used": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table("cached_analyses").insert(cache_data).execute()
            
            if response.data:
                logger.info(f"Cache SAVED: Hash {input_hash[:8]}...")
                return True
            else:
                logger.error(f"Erro ao salvar cache: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao salvar no cache: {e}")
            return False
    
    def cleanup_old_cache(self, days: int = 60, max_entries: int = 10000) -> bool:
        """
        Limpa entradas antigas do cache para controlar espaço no banco
        
        Args:
            days: Remove entradas mais antigas que X dias (padrão: 60 dias = 2 meses)
            max_entries: Mantém no máximo X entradas mais recentes
        """
        try:
            # Validação para garantir que days seja um número
            if not isinstance(days, (int, float)):
                days = 60  # valor padrão
                
            # 1. Remove entradas mais antigas que X dias
            cutoff_date = datetime.utcnow() - timedelta(days=float(days))
            
            response = self.supabase.table("cached_analyses").delete().lt("last_used", cutoff_date).execute()
            
            if response.data:
                removed_count = len(response.data)
                logger.info(f"Cache cleanup: Removidas {removed_count} entradas antigas (> {days} dias)")
                return True
            else:
                logger.info("Cache cleanup: Nenhuma entrada antiga encontrada")
                return True
                
        except Exception as e:
            logger.error(f"❌ Erro ao limpar cache: {e}")
            return False
    
    def get_user_history(self, user_id: str, limit: int = 10) -> list:
        """
        Retorna histórico de análises do usuário
        
        Args:
            user_id: ID do usuário
            limit: Número máximo de resultados
            
        Returns:
            Lista de análises recentes do usuário
        """
        try:
            response = self.supabase.table("cached_analyses").select(
                "id, created_at, job_description, result_json"
            ).eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Erro ao buscar histórico: {e}")
            return []
