#!/usr/bin/env python3
"""
Script para limpar sessões antigas do Supabase que ainda usam Groq
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Adicionar o projeto ao path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

def clean_old_sessions():
    """Limpa sessões antigas que podem conter erros do Groq"""
    try:
        from supabase import create_client
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Supabase não configurado")
            return
        
        supabase = create_client(supabase_url, supabase_key)
        
        print("🔍 Verificando sessões antigas...")
        
        # Buscar sessões com erro ou status antigo
        response = supabase.table("analysis_sessions").select("*").execute()
        
        old_sessions = []
        for session in response.data:
            # Verificar se há erros de Groq nos dados
            result_data = session.get("result_data", {})
            if isinstance(result_data, str):
                try:
                    result_data = eval(result_data)  # Cuidado, mas para debug está ok
                except:
                    continue
            
            # Verificar se há erro de Groq
            if isinstance(result_data, dict):
                if "_vant_error" in result_data:
                    error_msg = result_data.get("message", "")
                    if "Groq" in error_msg or "rate limit" in error_msg.lower():
                        old_sessions.append(session)
        
        print(f"📊 Encontradas {len(old_sessions)} sessões com erro do Groq")
        
        if old_sessions:
            # Deletar sessões antigas
            for session in old_sessions:
                supabase.table("analysis_sessions").delete().eq("id", session["id"]).execute()
                print(f"🗑️ Removida sessão: {session['id']}")
            
            print(f"✅ {len(old_sessions)} sessões limpas!")
        else:
            print("✅ Nenhuma sessão com erro encontrada")
        
    except Exception as e:
        print(f"❌ Erro ao limpar sessões: {e}")

if __name__ == "__main__":
    clean_old_sessions()
