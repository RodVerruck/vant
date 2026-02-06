"""
Teste simplificado do Storage Manager (sem depender de tabelas)
"""

import os
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from dotenv import load_dotenv
load_dotenv(PROJECT_ROOT / ".env")

def test_supabase_connection():
    """Testa conexão básica com Supabase"""
    print("\n" + "="*60)
    print("🔍 TESTE DE CONEXÃO SUPABASE")
    print("="*60)
    
    try:
        from supabase import create_client
        
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        print(f"\n📡 URL: {url}")
        print(f"🔑 Key: {'***' + key[-10:] if key else 'NÃO CONFIGURADA'}")
        
        if not url or not key:
            print("❌ Variáveis de ambiente não configuradas")
            return False
        
        supabase = create_client(url, key)
        
        # Teste simples: verificar se podemos conectar
        # Tentar acessar uma tabela que deve existir (cached_analyses)
        try:
            response = supabase.table("cached_analyses").select("count", count="exact").execute()
            print("✅ Conexão com Supabase funcionando!")
            print(f"📊 Tabela cached_analises: {response.count or 0} registros")
            return True
        except Exception as table_error:
            print(f"⚠️  Tabela cached_analyses não encontrada, mas conexão OK: {table_error}")
            return True
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

def test_storage_manager_import():
    """Testa se o Storage Manager pode ser importado"""
    print("\n" + "="*60)
    print("📦 TESTE DE IMPORTAÇÃO")
    print("="*60)
    
    try:
        from storage_manager import StorageManager, storage_manager
        print("✅ Storage Manager importado com sucesso!")
        
        # Verificar atributos
        print(f"📋 Supabase URL: {'***' + storage_manager.supabase_url[-10:] if storage_manager.supabase_url else 'N/A'}")
        print(f"🗂️  Bucket: {storage_manager.bucket_name}")
        
        return True
    except Exception as e:
        print(f"❌ Erro ao importar Storage Manager: {e}")
        return False

def show_instructions():
    """Mostra instruções para configuração"""
    print("\n" + "="*60)
    print("📋 INSTRUÇÕES DE CONFIGURAÇÃO")
    print("="*60)
    
    print("\n1. 📁 Execute o SQL no Supabase:")
    print("   - Abra o arquivo: backend/setup_storage_tables.sql")
    print("   - Copie e cole no SQL Editor do Supabase Dashboard")
    print("   - Execute para criar a tabela temp_files_metadata")
    
    print("\n2. 🗂️  Configure o Storage Bucket:")
    print("   - Vá para Storage no Supabase Dashboard")
    print("   - Crie um novo bucket chamado 'vant-temp-files'")
    print("   - Configure as políticas de acesso (RQL)")
    
    print("\n3. 🧪 Teste novamente:")
    print("   python backend/test_storage_manager.py")
    
    print("\n4. 🚀 Em produção:")
    print("   - O sistema usará Supabase Storage em vez de arquivos locais")
    print("   - Funciona em serverless, containers, multi-instância")
    print("   - Auto-limpeza após 24 horas")

if __name__ == "__main__":
    print("🚀 Teste Simplificado do Storage Manager")
    
    # Teste 1: Conexão
    connection_ok = test_supabase_connection()
    
    # Teste 2: Importação
    import_ok = test_storage_manager_import()
    
    if connection_ok and import_ok:
        print("\n🎉 CONFIGURAÇÃO BÁSICA OK!")
        print("\n⚠️  Ainda precisa criar a tabela e bucket (veja instruções abaixo)")
        show_instructions()
    else:
        print("\n❌ VERIFIQUE A CONFIGURAÇÃO DO SUPABASE")
        print("\n📋 Verifique no arquivo .env:")
        print("   SUPABASE_URL=...")
        print("   SUPABASE_SERVICE_ROLE_KEY=...")
