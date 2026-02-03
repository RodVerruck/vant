"""
Script para deletar entrada corrompida do cache
"""
import os
from supabase import create_client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Hash da entrada corrompida (CV marketing truncado)
corrupted_hash = "6f77fdd195cc3d9eb0608ae316b1e05b311e1a4d40e4db21f2f6ad71e0e5d0cb"

print(f"🗑️  Deletando entrada corrompida do cache: {corrupted_hash[:8]}...")

try:
    result = supabase.table("cached_analyses").delete().eq("input_hash", corrupted_hash).execute()
    print(f"✅ Cache corrompido deletado com sucesso!")
    print(f"   Linhas afetadas: {len(result.data)}")
except Exception as e:
    print(f"❌ Erro ao deletar cache: {e}")
