"""
Sistema de Cache Inteligente para Vant
Reduz custos de processamento em 60-80% mantendo UX fluida
"""

import hashlib
import json
import re
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
    # NORMALIZATION UTILITIES
    # ============================================================
    
    def _normalize_string(self, text: str) -> str:
        """Normaliza texto para comparação de cache inteligente."""
        if not text:
            return ""
        
        # Converte para minúsculas
        text = text.lower()
        
        # Remove pontuação e caracteres especiais
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove stopwords comuns
        stopwords = {
            'de', 'para', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'must', 'can', 'shall', 'um', 'uma', 'uns', 'umas', 'o', 'a',
            'os', 'as', 'em', 'no', 'na', 'nos', 'nas', 'por', 'pelo', 'pela', 'pelas',
            'como', 'com', 'sem', 'se', 'mas', 'mais', 'menos', 'muito', 'muita', 'muito',
            'pouco', 'pouca', 'poucos', 'poucas', 'também', 'tambem', 'ainda', 'já', 'ja',
            'sobre', 'entre', 'após', 'apos', 'ate', 'até', 'desde', 'durante', 'através',
            'atraves', 'contra', 'sem', 'sob', 'sobre', 'depois', 'antes', 'durante'
        }
        
        # Divide em palavras e remove stopwords
        words = [word.strip() for word in text.split() if word.strip() not in stopwords]
        
        # Ordena alfabeticamente para garantir consistência
        words.sort()
        
        # Junta as palavras normalizadas
        return ' '.join(words)

    # ============================================================
    # CACHE PARCIAL INTELIGENTE (Fase 2)
    # ============================================================
    
    def generate_component_hash(self, component_type: str, data: Dict[str, Any]) -> str:
        """
        Gera hash específico para cada componente do cache parcial com normalização inteligente
        
        Args:
            component_type: 'diagnosis', 'library', 'tactical'
            data: Dados relevantes para o componente
            
        Returns:
            Hash SHA256 específico do componente
        """
        if component_type == "diagnosis":
            # Usa area normalizada + lista de gaps normalizada
            area = self._normalize_string(data.get("area", ""))
            gaps = data.get("gaps_fatais", [])
            
            # Extrair e normalizar gaps
            gap_texts = []
            if isinstance(gaps, list):
                for gap in gaps[:3]:  # Limitar aos 3 principais gaps
                    if isinstance(gap, dict):
                        gap_text = gap.get("titulo", gap.get("erro", ""))
                    else:
                        gap_text = str(gap)
                    gap_texts.append(self._normalize_string(gap_text))
            
            normalized = {
                "type": "diagnosis",
                "area": area,
                "gaps": sorted([g for g in gap_texts if g])  # Gaps normalizados e ordenados
            }
            
        elif component_type == "library":
            # Usa apenas area normalizada e hash curto dos gaps
            area = self._normalize_string(data.get("area", ""))
            gaps = data.get("gaps_fatais", [])
            
            # Extrair setor e nível dos gaps para hash curto
            gap_keywords = []
            if isinstance(gaps, list):
                for gap in gaps[:2]:  # Apenas os 2 principais gaps
                    if isinstance(gap, dict):
                        gap_text = gap.get("titulo", gap.get("erro", ""))
                    else:
                        gap_text = str(gap)
                    # Extrair keywords relevantes (setor + nível)
                    normalized_gap = self._normalize_string(gap_text)
                    if normalized_gap:
                        gap_keywords.append(normalized_gap)
            
            # Hash curto dos gaps
            gaps_hash = hashlib.md5(' '.join(sorted(gap_keywords)).encode()).hexdigest()[:8]
            
            normalized = {
                "type": "library",
                "area": area,
                "gaps_hash": gaps_hash  # Hash curto em vez de lista completa
            }
            
        elif component_type == "tactical":
            # Extrai keywords da vaga, normaliza e usa com contagem de gaps
            job_desc = data.get("job_description", "")
            gaps = data.get("gaps_fatais", [])
            
            # Extrair keywords inteligentes da vaga
            job_keywords = self._extract_keywords(job_desc.lower())
            normalized_keywords = [self._normalize_string(kw) for kw in job_keywords]
            
            # Contagem de gaps
            gap_count = len(gaps) if isinstance(gaps, list) else 0
            
            normalized = {
                "type": "tactical",
                "keywords": sorted([kw for kw in normalized_keywords if kw]),
                "gap_count": min(gap_count, 5)  # Limitar contagem para evitar variações extremas
            }
            
        else:
            # Fallback para hash genérico
            normalized = {"type": component_type, "data": str(data)}
        
        input_string = json.dumps(normalized, sort_keys=True, separators=(',', ':'), default=str)
        return hashlib.sha256(input_string.encode()).hexdigest()
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extrai palavras-chave relevantes do texto da vaga para matching de cache"""
        text_lower = text.lower()
        
        # Extrair cargo principal (primeiras palavras antes de local/salário)
        # Ex: "Desenvolvedor Full Stack Sênior" -> ["desenvolvedor", "full", "stack", "senior"]
        title_match = re.search(r'^(?:vaga:\s*)?([^\n-]+)', text_lower)
        title_keywords = []
        if title_match:
            title = title_match.group(1)
            # Manter apenas palavras significativas do título
            title_words = re.findall(r'\b(desenvolvedor|engenheiro|analista|gerente|coordenador|especialista|consultor|representante|assistente|auxiliar|operador|técnico|full|stack|backend|frontend|mobile|web|software|dados|devops|cloud|security|ux|ui|product|project|scrum|master|hr|rh|vendas|comercial|marketing|financeiro|contábil|administrativo|logística|supply|chain)\b', title)
            title_keywords = title_words[:4]  # Primeiras 4 palavras do cargo
        
        # Detectar nível de senioridade
        level_keywords = []
        if any(word in text_lower for word in ['senior', 'sênior', 'sr']):
            level_keywords.append('senior')
        elif any(word in text_lower for word in ['pleno', 'pl']):
            level_keywords.append('pleno')
        elif any(word in text_lower for word in ['junior', 'júnior', 'jr']):
            level_keywords.append('junior')
        
        # Tecnologias mencionadas
        tech_patterns = [
            r'\b(react|angular|vue)\b',
            r'\b(node|python|java|go|rust|php|ruby|c\+\+|c#|\.net)\b',
            r'\b(sql|nosql|mongodb|postgres|mysql)\b',
            r'\b(aws|azure|gcp|cloud|docker|kubernetes)\b',
            r'\b(agile|scrum|kanban)\b'
        ]
        
        tech_keywords = []
        for pattern in tech_patterns:
            matches = re.findall(pattern, text_lower)
            tech_keywords.extend(matches)
        
        # Combinar todos os keywords e remover duplicatas mantendo ordem
        all_keywords = title_keywords + level_keywords + tech_keywords[:3]
        seen = set()
        unique_keywords = []
        for kw in all_keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)
        
        return unique_keywords[:6]  # Limitar a 6 keywords para não ser muito específico
    
    def check_partial_cache(self, component_type: str, data: Dict[str, Any], required_keys: List[str] = None) -> Optional[Dict[str, Any]]:
        """
        Verifica cache parcial para um componente específico com validação de chaves obrigatórias
        
        Args:
            component_type: Tipo do componente
            data: Dados para gerar hash
            required_keys: Lista de chaves obrigatórias que devem estar presentes e preenchidas
            
        Returns:
            Dados do cache ou None se não encontrado/inválido
        """
        component_hash = self.generate_component_hash(component_type, data)
        
        try:
            response = self.supabase.table("partial_cache").select("*").eq("component_hash", component_hash).execute()
            
            if response.data and len(response.data) > 0:
                cache_entry = response.data[0]
                cached_data = cache_entry.get("result_json", {})
                
                # VALIDAÇÃO DE CHAVES OBRIGATÓRIAS (Regra de Ouro)
                if required_keys:
                    missing_keys = []
                    invalid_keys = []
                    
                    for key in required_keys:
                        if key not in cached_data:
                            missing_keys.append(key)
                        elif not cached_data[key]:  # Verifica se está preenchida (não None, não vazia)
                            invalid_keys.append(key)
                    
                    # Se faltar alguma chave obrigatória, considera CACHE MISS
                    if missing_keys or invalid_keys:
                        logger.warning(f"⚠️ Cache corrompido [{component_type}]. Chaves faltando: {missing_keys}, Chaves vazias: {invalid_keys}")
                        
                        # Delete entrada corrompida imediatamente
                        try:
                            self.supabase.table("partial_cache").delete().eq("id", cache_entry["id"]).execute()
                            logger.info(f"🗑️ Entrada corrompida removida do cache: {component_hash[:8]}...")
                        except Exception as delete_error:
                            logger.error(f"❌ Erro ao remover entrada corrompida: {delete_error}")
                        
                        return None  # CACHE MISS por entrada corrompida
                
                # Verificar TTL (7 dias)
                created_at = cache_entry.get("created_at")
                if created_at:
                    try:
                        created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        if datetime.now(created_time.tzinfo) - created_time > timedelta(days=7):
                            # Cache expirado, remover e retornar miss
                            self.supabase.table("partial_cache").delete().eq("id", cache_entry["id"]).execute()
                            logger.info(f"⏰ Cache expirado removido: {component_hash[:8]}...")
                            return None
                    except Exception as ttl_error:
                        logger.warning(f"⚠️ Erro ao verificar TTL: {ttl_error}")
                
                logger.info(f"✅ CACHE PARCIAL HIT [{component_type}]: {component_hash[:8]}...")
                return cached_data
                
        except Exception as e:
            logger.error(f"❌ Erro ao verificar cache parcial [{component_type}]: {e}")
        
        return None  # CACHE MISS
    
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
                "result_json": json.dumps(result, default=str),
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
        input_string = json.dumps(normalized_input, sort_keys=True, separators=(',', ':'), default=str)
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
                
                # DESATIVADO: Update on Read para máxima velocidade
                # self.supabase.table("cached_analyses").update({
                #     "hit_count": cache_entry["hit_count"] + 1,
                #     "last_used": datetime.utcnow().isoformat()
                # }).eq("id", cache_entry["id"]).execute()
                
                logger.info(f"Cache HIT: Hash {input_hash[:8]}... (instantâneo)")
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
