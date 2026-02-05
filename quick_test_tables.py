"""
Teste rápido das tabelas via API REST do Supabase
"""

import os
import requests
from dotenv import load_dotenv

def quick_test():
    """Teste rápido se as tabelas existem"""
    
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env")
        return
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }
    
    # Tabelas para testar
    tables = [
        "interview_sessions",
        "interview_answers", 
        "user_interview_profile",
        "achievements",
        "user_achievements"
    ]
    
    print("🔍 Testando acesso às tabelas...")
    print("=" * 50)
    
    for table in tables:
        url = f"{supabase_url}/rest/v1/{table}?limit=1"
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print(f"✅ {table}: OK")
                
                # Se for achievements, mostrar count
                if table == "achievements":
                    count_url = f"{supabase_url}/rest/v1/{table}?select=id"
                    count_response = requests.get(count_url, headers=headers)
                    if count_response.status_code == 200:
                        count = len(count_response.json())
                        print(f"   📊 {count} registros")
                        
            elif response.status_code == 406:
                print(f"⚠️ {table}: Sem permissão (RLS ativo)")
            elif response.status_code == 404:
                print(f"❌ {table}: NÃO EXISTE")
            else:
                print(f"⚠️ {table}: Erro {response.status_code}")
                
        except Exception as e:
            print(f"❌ {table}: Falha - {e}")
    
    print("=" * 50)
    print("🎯 Se todas as tabelas mostrarem OK ou ⚠️, está funcionando!")
    print("❌ Se alguma mostrar NÃO EXISTE, execute o SQL novamente.")

if __name__ == "__main__":
    quick_test()
