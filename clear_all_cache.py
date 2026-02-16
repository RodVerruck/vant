#!/usr/bin/env python3
"""
Script para limpar TODOS os caches do sistema Vant
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Carregar variáveis do .env do backend
load_dotenv("backend/.env.local")

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("🗑️  Iniciando limpeza TOTAL de cache...")
print()

try:
    # 1. Limpar cache da base de dados (cached_analyses)
    print("📊 Verificando cache da base de dados...")
    response = supabase.table("cached_analyses").select("*", count="exact").execute()
    
    if response.count and response.count > 0:
        print(f"   Encontradas {response.count} entradas no cache")
        
        # Deletar TUDO
        delete_result = supabase.table("cached_analyses").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        if delete_result.data:
            print(f"✅ Cache da base de dados limpo: {len(delete_result.data)} entradas removidas")
        else:
            print("⚠️  Nenhuma entrada foi removida (talvez já estivesse vazio)")
    else:
        print("✅ Cache da base de dados já estava vazio")
    
    # 2. Limpar sessões de análise (analysis_sessions)
    print("\n📋 Verificando sessões de análise...")
    sessions_response = supabase.table("analysis_sessions").select("*", count="exact").execute()
    
    if sessions_response.count and sessions_response.count > 0:
        print(f"   Encontradas {sessions_response.count} sessões ativas")
        
        # Deletar todas as sessões
        delete_sessions = supabase.table("analysis_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        if delete_sessions.data:
            print(f"✅ Sessões de análise limpas: {len(delete_sessions.data)} sessões removidas")
        else:
            print("⚠️  Nenhuma sessão foi removida")
    else:
        print("✅ Não há sessões ativas para limpar")
    
    # 3. Verificar se existem outras tabelas de cache
    print("\n🔍 Verificando outras possíveis tabelas de cache...")
    
    # Tentar limpar partial_cache se existir
    try:
        partial_response = supabase.table("partial_cache").select("*", count="exact").execute()
        if partial_response.count and partial_response.count > 0:
            print(f"   Encontradas {partial_response.count} entradas em partial_cache")
            delete_partial = supabase.table("partial_cache").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            if delete_partial.data:
                print(f"✅ Partial cache limpo: {len(delete_partial.data)} entradas removidas")
        else:
            print("✅ Partial cache já estava vazio")
    except Exception as e:
        print(f"ℹ️  Tabela partial_cache não existe ou não acessível: {e}")
    
    # 4. Estatísticas finais
    print("\n📈 Verificando limpeza...")
    final_check = supabase.table("cached_analyses").select("*", count="exact").execute()
    final_sessions = supabase.table("analysis_sessions").select("*", count="exact").execute()
    
    print(f"   cached_analyses: {final_check.count or 0} entradas restantes")
    print(f"   analysis_sessions: {final_sessions.count or 0} sessões restantes")
    
    print("\n🎉 LIMPEZA COMPLETA!")
    print("✅ Cache da base de dados: LIMPO")
    print("✅ Sessões de análise: LIMPAS")
    print("✅ Sistema pronto para funcionar fresh")
    
    print("\n💡 Recomendações:")
    print("   - Reiniciar o backend para limpar cache em memória")
    print("   - Limpar cache do navegador (F12 > Application > Storage > Clear)")
    print("   - Próximas análises serão 100% fresh da IA")

except Exception as e:
    print(f"❌ Erro durante limpeza: {e}")
    exit(1)
