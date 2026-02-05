"""
Script para testar se todas as tabelas do simulador WOW foram criadas no Supabase
"""

import os
from supabase import create_client
from dotenv import load_dotenv
import json

def test_supabase_tables():
    """Testa se todas as tabelas foram criadas corretamente"""
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials não encontradas")
        print("   Verifique se SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env")
        return False
    
    # Criar cliente admin
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Conexão com Supabase estabelecida")
    except Exception as e:
        print(f"❌ Erro ao conectar com Supabase: {e}")
        return False
    
    # Tabelas esperadas
    expected_tables = [
        'interview_sessions',
        'interview_answers', 
        'user_interview_profile',
        'achievements',
        'user_achievements'
    ]
    
    print("\n🔍 Verificando tabelas criadas...")
    print("=" * 60)
    
    tables_created = []
    tables_missing = []
    
    for table_name in expected_tables:
        try:
            # Tentar fazer um SELECT simples na tabela
            result = supabase.table(table_name).select("*").limit(1).execute()
            
            if result is not None:
                print(f"✅ {table_name}: OK")
                tables_created.append(table_name)
                
                # Verificar se há dados
                if table_name == 'achievements':
                    count_result = supabase.table(table_name).select("id", count="exact").execute()
                    count = count_result.count if hasattr(count_result, 'count') else 0
                    print(f"   📊 Registros: {count}")
                    
                    if count > 0:
                        # Mostrar alguns exemplos
                        sample = supabase.table(table_name).select("name, category, requirement_type").limit(3).execute()
                        if sample.data:
                            print("   📋 Amostras:")
                            for item in sample.data:
                                print(f"      - {item['name']} ({item['category']})")
                
            else:
                print(f"❌ {table_name}: Falha ao acessar")
                tables_missing.append(table_name)
                
        except Exception as e:
            error_msg = str(e).lower()
            if "does not exist" in error_msg or "relation" in error_msg:
                print(f"❌ {table_name}: NÃO EXISTE")
                tables_missing.append(table_name)
            else:
                print(f"⚠️ {table_name}: Erro - {e}")
                tables_missing.append(table_name)
    
    print("\n" + "=" * 60)
    print("📊 RESUMO:")
    print(f"✅ Tabelas criadas: {len(tables_created)}/{len(expected_tables)}")
    print(f"❌ Tabelas faltando: {len(tables_missing)}")
    
    if tables_created:
        print(f"\n🎉 Tabelas funcionando:")
        for table in tables_created:
            print(f"   ✅ {table}")
    
    if tables_missing:
        print(f"\n⚠️ Tabelas faltando:")
        for table in tables_missing:
            print(f"   ❌ {table}")
    
    # Testar se as conquistas foram inseridas
    if 'achievements' in tables_created:
        print("\n🏆 Testando conquistas...")
        try:
            achievements = supabase.table('achievements').select("*").execute()
            if achievements.data:
                print(f"✅ {len(achievements.data)} conquistas encontradas")
                
                # Verificar categorias
                categories = set(a['category'] for a in achievements.data)
                print(f"📊 Categorias: {', '.join(categories)}")
                
                # Verificar requirement_types
                types = set(a['requirement_type'] for a in achievements.data)
                print(f"🔧 Types: {', '.join(types)}")
            else:
                print("⚠️ Nenhuma conquista encontrada")
        except Exception as e:
            print(f"❌ Erro ao testar conquistas: {e}")
    
    # Testar se as policies RLS foram criadas
    print("\n🔒 Testando RLS policies...")
    try:
        # Tentar acessar como usuário anônimo (deve falhar)
        anon_client = create_client(supabase_url, os.getenv("SUPABASE_ANON_KEY"))
        result = anon_client.table('interview_sessions').select("*").limit(1).execute()
        
        # Se funcionar, RLS pode não estar configurado corretamente
        if result.data:
            print("⚠️ RLS pode não estar restrito (acesso anônimo funcionou)")
        else:
            print("✅ RLS parece estar funcionando (acesso anônimo bloqueado)")
            
    except Exception as e:
        if "permission" in str(e).lower() or "row level security" in str(e).lower():
            print("✅ RLS está ativo e bloqueando acesso anônimo")
        else:
            print(f"⚠️ Erro ao testar RLS: {e}")
    
    # Testar se as functions foram criadas
    print("\n⚙️ Testando functions...")
    try:
        # Testar ensure_user_profile
        test_uuid = "00000000-0000-0000-0000-000000000000"
        result = supabase.rpc("ensure_user_profile", {"user_uuid": test_uuid}).execute()
        print("✅ Function ensure_user_profile disponível")
        
        # Testar calculate_level_and_rank
        result = supabase.rpc("calculate_level_and_rank", {"total_xp": 100}).execute()
        if result.data:
            print(f"✅ Function calculate_level_and_rank funcionando: Nível {result.data[0]['level']}")
        else:
            print("⚠️ Function calculate_level_and_rank não retornou dados")
            
    except Exception as e:
        if "does not exist" in str(e).lower():
            print("❌ Functions não encontradas")
        else:
            print(f"⚠️ Erro ao testar functions: {e}")
    
    # Verificar índices
    print("\n📈 Verificando índices...")
    expected_indexes = [
        'idx_interview_sessions_user_id',
        'idx_interview_sessions_status',
        'idx_interview_sessions_created_at',
        'idx_interview_answers_session_id',
        'idx_user_interview_profile_user_id',
        'idx_user_achievements_user_id'
    ]
    
    # Nota: Não é fácil verificar índices via API REST do Supabase
    # Mas podemos testar performance das queries
    try:
        # Testar query com filtro em user_id (deve ser rápido se índice existe)
        start_time = time.time()
        result = supabase.table('interview_sessions').select("*").eq("user_id", test_uuid).execute()
        elapsed = time.time() - start_time
        
        if elapsed < 0.5:  # Query rápida sugere índice funcionando
            print("✅ Queries parecem otimizadas (índices provavelmente ativos)")
        else:
            print("⚠️ Queries podem estar lentas (verifique índices)")
            
    except Exception as e:
        print(f"⚠️ Não foi possível testar performance: {e}")
    
    # Resultado final
    print("\n" + "=" * 60)
    if len(tables_created) == len(expected_tables):
        print("🎉 SUCESSO! Todas as tabelas foram criadas corretamente!")
        print("🚀 O sistema de persistência WOW está pronto para uso!")
        return True
    else:
        print("❌ FALHA! Algumas tabelas estão faltando.")
        print("📋 Verifique o SQL e execute novamente no Supabase.")
        return False

if __name__ == "__main__":
    import time
    test_supabase_tables()
