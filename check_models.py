import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ ERRO: GOOGLE_API_KEY não encontrada.")
else:
    print(f"🔍 Consultando modelos disponíveis (SDK Novo)...")
    
    try:
        client = genai.Client(api_key=api_key)
        
        # Na nova lib 'google-genai', o método é .list()
        pager = client.models.list() 
        
        print("\n✅ MODELOS DISPONÍVEIS:")
        print("="*50)
        
        count = 0
        for model in pager:
            # Filtra modelos que são 'gemini' e não são apenas 'embedding'
            if "gemini" in model.name:
                # O nome vem completo, ex: "models/gemini-2.0-flash"
                clean_name = model.name.replace("models/", "")
                print(f"• {clean_name}")
                count += 1
                
        if count == 0:
            print("⚠️ Nenhum modelo 'gemini' encontrado na listagem.")

    except Exception as e:
        print(f"❌ Erro fatal: {e}")