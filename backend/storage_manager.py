"""
Storage Manager - Sistema de Armazenamento Seguro para Produção
Substitui sistema de arquivos local por Supabase Storage

🎯 OBJETIVO:
- Arquivos temporários em Supabase Storage (bucket)
- Cache entre requisições em banco de dados
- Funciona em serverless, containers, multi-instância

📁 ESTRUTURA:
- bucket: "vant-temp-files"
- path: "cache/{timestamp}/{user_id}/{filename}"
- TTL: 24 horas (auto-limpeza)
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, BinaryIO
from supabase import create_client
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

class StorageManager:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        if self.supabase_url and not self.supabase_url.endswith("/"):
            self.supabase_url = f"{self.supabase_url}/"
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        self.bucket_name = "vant-temp-files"
        self._last_cleanup: Optional[datetime] = None

    def _maybe_cleanup(self) -> None:
        """Executa limpeza periódica (no máximo 1x por hora)."""
        try:
            now = datetime.now()
            if self._last_cleanup and (now - self._last_cleanup) < timedelta(hours=1):
                return
            cleaned = self.cleanup_expired()
            self._last_cleanup = now
            if cleaned:
                logger.info(f"🧹 Limpeza automática executada: {cleaned} batches expirados")
        except Exception as e:
            logger.warning(f"⚠️ Falha na limpeza automática: {e}")
        
    def save_temp_files(self, 
                       cv_bytes: bytes, 
                       job_description: str, 
                       user_id: Optional[str] = None) -> Dict[str, str]:
        """
        Salva CV e job description temporariamente no Supabase Storage.
        
        Returns:
            Dict com paths para acesso futuro
        """
        try:
            self._maybe_cleanup()
            # Gerar timestamp único para este batch
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            batch_id = str(uuid.uuid4())[:8]
            
            # Paths no storage
            base_path = f"cache/{timestamp}"
            if user_id:
                base_path += f"/{user_id}"
            base_path += f"/{batch_id}"
            
            cv_path = f"{base_path}/cv.pdf"
            job_path = f"{base_path}/job_description.txt"
            
            # Upload do CV
            cv_file = BytesIO(cv_bytes)
            cv_file.name = "cv.pdf"
            
            cv_result = self.supabase.storage \
                .from_(self.bucket_name) \
                .upload(
                    path=cv_path, 
                    file=cv_file.getvalue(),
                    file_options={"content-type": "application/pdf"}
                )
            
            # Upload da job description
            job_bytes = job_description.encode('utf-8')
            job_file = BytesIO(job_bytes)
            job_file.name = "job_description.txt"
            
            job_result = self.supabase.storage \
                .from_(self.bucket_name) \
                .upload(
                    path=job_path,
                    file=job_file.getvalue(),
                    file_options={"content-type": "text/plain"}
                )
            
            # Salvar metadados no banco para fácil recuperação
            metadata = {
                "batch_id": batch_id,
                "user_id": user_id,
                "timestamp": timestamp,
                "cv_path": cv_path,
                "job_path": job_path,
                "expires_at": (datetime.now() + timedelta(hours=24)).isoformat(),
                "job_description": job_description  # Também salvo como texto para fácil acesso
            }
            
            # Inserir na tabela temp_files_metadata
            self.supabase.table("temp_files_metadata").insert(metadata).execute()
            
            logger.info(f"💾 Arquivos salvos no storage: {batch_id}")
            
            return {
                "batch_id": batch_id,
                "cv_path": cv_path,
                "job_path": job_path,
                "timestamp": timestamp
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar arquivos no storage: {e}")
            return {}
    
    def get_temp_files(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """
        Recupera metadados dos arquivos temporários.
        
        Args:
            batch_id: ID do batch salvo anteriormente
            
        Returns:
            Dict com metadados ou None se não encontrado/expirado
        """
        try:
            response = self.supabase.table("temp_files_metadata") \
                .select("*") \
                .eq("batch_id", batch_id) \
                .execute()
            
            if not response.data:
                return None
                
            metadata = response.data[0]
            
            # Verificar se não expirou
            expires_at = datetime.fromisoformat(metadata["expires_at"])
            now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.now()
            if now > expires_at:
                # Auto-limpeza
                self.cleanup_batch(batch_id)
                return None
                
            return metadata
            
        except Exception as e:
            logger.error(f"❌ Erro ao recuperar metadados {batch_id}: {e}")
            return None
    
    def get_cv_bytes(self, cv_path: str) -> Optional[bytes]:
        """
        Recupera bytes do CV do Supabase Storage.
        """
        try:
            response = self.supabase.storage \
                .from_(self.bucket_name) \
                .download(cv_path)
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Erro ao baixar CV {cv_path}: {e}")
            return None
    
    def get_job_description(self, batch_id: str) -> Optional[str]:
        """
        Recupera job description (do metadado para eficiência).
        """
        try:
            metadata = self.get_temp_files(batch_id)
            if metadata:
                return metadata.get("job_description")
            return None
            
        except Exception as e:
            logger.error(f"❌ Erro ao recuperar job description {batch_id}: {e}")
            return None
    
    def cleanup_batch(self, batch_id: str) -> bool:
        """
        Remove arquivos e metadados de um batch específico.
        """
        try:
            # Recuperar metadados para saber os paths
            metadata = self.get_temp_files(batch_id)
            if not metadata:
                return True
                
            # Remover arquivos do storage
            paths_to_remove = [metadata["cv_path"], metadata["job_path"]]
            
            self.supabase.storage \
                .from_(self.bucket_name) \
                .remove(paths_to_remove)
            
            # Remover metadados do banco
            self.supabase.table("temp_files_metadata") \
                .delete() \
                .eq("batch_id", batch_id) \
                .execute()
            
            logger.info(f"🧹 Batch {batch_id} limpo com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao limpar batch {batch_id}: {e}")
            return False
    
    def cleanup_expired(self) -> int:
        """
        Limpa todos os arquivos expirados (para rodar periodicamente).
        """
        try:
            now = datetime.now().isoformat()
            
            # Buscar batches expirados
            response = self.supabase.table("temp_files_metadata") \
                .select("batch_id") \
                .lt("expires_at", now) \
                .execute()
            
            expired_batches = [item["batch_id"] for item in response.data]
            
            cleaned_count = 0
            for batch_id in expired_batches:
                if self.cleanup_batch(batch_id):
                    cleaned_count += 1
            
            logger.info(f"🧹 Limpos {cleaned_count} batches expirados")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"❌ Erro na limpeza automática: {e}")
            return 0

# Instância global para uso nos endpoints
storage_manager = StorageManager()
