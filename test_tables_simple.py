"""
Teste simples para verificar se as tabelas foram criadas
"""

import os
from dotenv import load_dotenv

def check_env_vars():
    """Verifica se as variáveis do Supabase estão configuradas"""
    
    load_dotenv('backend/.env')
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    print("🔍 Verificando configuração do Supabase...")
    print("=" * 50)
    
    if supabase_url and "your-project" not in supabase_url:
        print(f"✅ SUPABASE_URL: {supabase_url[:30]}...")
    else:
        print("❌ SUPABASE_URL não configurado ou é placeholder")
        print("   Configure com: https://seu-projeto.supabase.co")
    
    if service_key and "your-supabase" not in service_key:
        print(f"✅ SUPABASE_SERVICE_ROLE_KEY: {service_key[:20]}...")
    else:
        print("❌ SUPABASE_SERVICE_ROLE_KEY não configurado")
        print("   Configure com sua service role key do Supabase")
    
    if anon_key and "your-supabase" not in anon_key:
        print(f"✅ SUPABASE_ANON_KEY: {anon_key[:20]}...")
    else:
        print("❌ SUPABASE_ANON_KEY não configurado")
        print("   Configure com sua anon key do Supabase")
    
    print("=" * 50)
    
    # Verificar se todas estão configuradas
    all_configured = (
        supabase_url and 
        "your-project" not in supabase_url and
        service_key and 
        "your-supabase" not in service_key and
        anon_key and 
        "your-supabase" not in anon_key
    )
    
    if all_configured:
        print("🎉 Variáveis do Supabase estão configuradas!")
        print("🚀 Execute o teste completo: python test_supabase_tables.py")
    else:
        print("⚠️ Configure as variáveis do Supabase no backend/.env")
        print("\n📋 Passos para configurar:")
        print("1. Abra seu projeto no Supabase Dashboard")
        print("2. Vá para Settings > API")
        print("3. Copie a URL e as keys")
        print("4. Atualize o backend/.env")
    
    return all_configured

def test_sql_execution():
    """Testa se o SQL foi executado verificando o arquivo"""
    
    print("\n🔍 Verificando se o SQL foi executado...")
    print("=" * 50)
    
    try:
        with open("backend/setup_interview_persistence.sql", "r", encoding="utf-8") as f:
            sql_content = f.read()
        
        # Verificar se as CREATE TABLE existem
        expected_creates = [
            "CREATE TABLE IF NOT EXISTS interview_sessions",
            "CREATE TABLE IF NOT EXISTS interview_answers",
            "CREATE TABLE IF NOT EXISTS user_interview_profile",
            "CREATE TABLE IF NOT EXISTS achievements",
            "CREATE TABLE IF NOT EXISTS user_achievements"
        ]
        
        creates_found = []
        for create in expected_creates:
            if create in sql_content:
                creates_found.append(create)
                print(f"✅ {create.split('(')[0].strip()}")
            else:
                print(f"❌ {create.split('(')[0].strip()}")
        
        # Verificar se o INSERT achievements existe
        if "INSERT INTO achievements" in sql_content:
            print("✅ INSERT achievements encontrado")
        else:
            print("❌ INSERT achievements não encontrado")
        
        print("=" * 50)
        
        if len(creates_found) == len(expected_creates):
            print("🎉 SQL está completo e pronto para executar!")
            print("\n📋 Para executar:")
            print("1. Abra o SQL Editor no Supabase Dashboard")
            print("2. Copie todo o conteúdo do arquivo")
            print("3. Cole e execute")
            print("4. Aguarde a conclusão")
            return True
        else:
            print("❌ SQL está incompleto")
            return False
            
    except FileNotFoundError:
        print("❌ Arquivo setup_interview_persistence.sql não encontrado")
        return False

if __name__ == "__main__":
    print("🧪 TESTE DE CONFIGURAÇÃO DAS TABELAS")
    print("=" * 50)
    
    # Testar variáveis de ambiente
    env_ok = check_env_vars()
    
    # Testar SQL
    sql_ok = test_sql_execution()
    
    print("\n" + "=" * 50)
    print("📊 RESUMO:")
    print(f"🔧 Variáveis: {'✅ OK' if env_ok else '❌ Configurar'}")
    print(f"📄 SQL: {'✅ OK' if sql_ok else '❌ Verificar'}")
    
    if env_ok and sql_ok:
        print("\n🚀 Tudo pronto! Execute o SQL no Supabase e depois teste:")
        print("   python test_supabase_tables.py")
    else:
        print("\n⚠️ Configure o que está faltando antes de prosseguir")
