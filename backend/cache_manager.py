"""
Sistema de Cache Inteligente para Vant
Reduz custos de processamento em 60-80% mantendo UX fluida
"""

import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import os
from supabase import create_client
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
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
    
    def cleanup_old_cache(self, days: int = 7) -> int:
        """
        Limpa entradas de cache antigas para evitar crescimento infinito
        
        Args:
            days: Número de dias para manter entradas
            
        Returns:
            Número de entradas removidas
        """
        try:
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            response = self.supabase.table("cached_analyses").delete().lt("last_used", cutoff_date).execute()
            
            if response.data:
                removed_count = len(response.data)
                logger.info(f"Cache cleanup: Removidas {removed_count} entradas antigas")
                return removed_count
            else:
                logger.info("Cache cleanup: Nenhuma entrada antiga encontrada")
                return 0
                
        except Exception as e:
            logger.error(f"Erro no cleanup do cache: {e}")
            return 0
    
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
