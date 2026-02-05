"""
Testa as tabelas através do backend (mais fácil)
"""

import requests
import json

def test_backend_tables():
    """Testa se o backend consegue acessar as tabelas"""
    
    try:
        # Testar health check
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        
        if response.status_code == 200:
            print("✅ Backend está online")
            
            health = response.json()
            print(f"📊 Status: {health.get('status')}")
            print(f"🔗 Supabase: {health.get('checks', {}).get('supabase', 'unknown')}")
            
            if health.get('checks', {}).get('supabase') == 'ok':
                print("🎉 Backend consegue conectar ao Supabase!")
                print("🚀 Tabelas provavelmente foram criadas com sucesso!")
            else:
                print("⚠️ Backend não consegue conectar ao Supabase")
                print("❌ Verifique se as tabelas foram criadas")
                
        else:
            print(f"❌ Backend offline (status: {response.status_code})")
            print("🔧 Inicie o backend com: cd backend && python start_server.py")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend não está respondendo")
        print("🔧 Inicie o backend:")
        print("   cd backend")
        print("   python start_server.py")
    except Exception as e:
        print(f"❌ Erro ao testar backend: {e}")

if __name__ == "__main__":
    test_backend_tables()
