"""
Test script para Storage Manager
Valida funcionamento do sistema de armazenamento seguro
"""

import os
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / ".env")

def test_storage_manager():
    print("\n" + "="*60)
    print("🧪 TESTE DO STORAGE MANAGER")
    print("="*60)
    
    try:
        from storage_manager import storage_manager
        
        # Teste 1: Salvar arquivos
        print("\n1️⃣  Testando salvamento de arquivos...")
        cv_bytes = b"PDF mock content for testing"
        job_description = "Vaga de Teste Júnior"
        user_id = "test-user-123"
        
        result = storage_manager.save_temp_files(cv_bytes, job_description, user_id)
        
        if result and result.get("batch_id"):
            batch_id = result["batch_id"]
            print(f"   ✅ Arquivos salvos com batch_id: {batch_id}")
        else:
            print("   ❌ Falha ao salvar arquivos")
            return False
        
        # Teste 2: Recuperar metadados
        print("\n2️⃣  Testando recuperação de metadados...")
        metadata = storage_manager.get_temp_files(batch_id)
        
        if metadata:
            print(f"   ✅ Metadados recuperados: {metadata['batch_id']}")
            print(f"   📄 Job description: {metadata['job_description'][:50]}...")
        else:
            print("   ❌ Falha ao recuperar metadados")
            return False
        
        # Teste 3: Recuperar CV bytes
        print("\n3️⃣  Testando recuperação de CV...")
        recovered_cv = storage_manager.get_cv_bytes(metadata["cv_path"])
        
        if recovered_cv == cv_bytes:
            print("   ✅ CV recuperado com sucesso (bytes idênticos)")
        else:
            print("   ❌ CV recuperado não corresponde ao original")
            return False
        
        # Teste 4: Recuperar job description
        print("\n4️⃣  Testando recuperação de job description...")
        recovered_job = storage_manager.get_job_description(batch_id)
        
        if recovered_job == job_description:
            print("   ✅ Job description recuperada com sucesso")
        else:
            print("   ❌ Job description recuperada não corresponde")
            return False
        
        # Teste 5: Limpeza
        print("\n5️⃣  Testando limpeza de batch...")
        cleanup_success = storage_manager.cleanup_batch(batch_id)
        
        if cleanup_success:
            print("   ✅ Batch limpo com sucesso")
        else:
            print("   ❌ Falha na limpeza do batch")
            return False
        
        # Verificar se realmente foi limpo
        metadata_after = storage_manager.get_temp_files(batch_id)
        if metadata_after is None:
            print("   ✅ Confirmação: batch não existe mais")
        else:
            print("   ❌ Batch ainda existe após limpeza")
            return False
        
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO NO TESTE: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_connection():
    """Testa conexão com Supabase"""
    print("\n🔍 Testando conexão com Supabase...")
    
    try:
        from supabase import create_client
        
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not url or not key:
            print("   ❌ Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas")
            return False
        
        supabase = create_client(url, key)
        
        # Teste simples: listar tabelas
        response = supabase.table("temp_files_metadata").select("count").execute()
        
        print("   ✅ Conexão com Supabase funcionando")
        return True
        
    except Exception as e:
        print(f"   ❌ Erro na conexão: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando testes do Storage Manager...")
    
    # Teste de conexão primeiro
    if not test_connection():
        print("\n❌ Falha na conexão. Verifique configuração do Supabase.")
        sys.exit(1)
    
    # Teste completo do storage
    if test_storage_manager():
        print("\n✅ Storage Manager está pronto para produção!")
    else:
        print("\n❌ Storage Manager precisa de correções.")
        sys.exit(1)
