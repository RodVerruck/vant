#!/usr/bin/env python3

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

# Hash problemático dos logs
problematic_hash = "6b669bbccc217726db348633682b74b2c62ff7801f376a089471b0c47c2bf457"

print(f"🗑️  Procurando entrada problemática no cache: {problematic_hash[:8]}...")

try:
    # Primeiro, vamos ver o que tem nesse cache
    response = supabase.table("cached_analyses").select("*").eq("input_hash", problematic_hash).execute()
    
    if response.data and len(response.data) > 0:
        cache_entry = response.data[0]
        result_json = cache_entry.get("result_json", {})
        
        print(f"📊 Entrada encontrada!")
        print(f"   Created: {cache_entry.get('created_at', 'N/A')}")
        print(f"   Hit count: {cache_entry.get('hit_count', 0)}")
        
        # Verificar se tem o problema
        if isinstance(result_json, dict):
            gap_1 = result_json.get("gap_1", {})
            if gap_1.get("explicacao") and "Sistemas de IA indisponíveis" in gap_1.get("explicacao", ""):
                print("🎯 CONFIRMADO: Esta entrada tem o fallback problemático!")
                print(f"   Gap 1: {gap_1.get('titulo', 'N/A')}")
                print(f"   Explicação: {gap_1.get('explicacao', 'N/A')[:50]}...")
                
                # Deletar a entrada problemática
                delete_result = supabase.table("cached_analyses").delete().eq("input_hash", problematic_hash).execute()
                print(f"✅ Entrada problemática deletada com sucesso!")
                print(f"   Linhas removidas: {len(delete_result.data)}")
                
            else:
                print("⚠️  Entrada não tem o problema esperado. Não deletando.")
        else:
            print("⚠️  result_json não é um dicionário válido")
            
    else:
        print("❌ Entrada não encontrada no cache")
        
    # Listar outras entradas suspeitas
    print("\n🔍 Procurando outras entradas com fallback problemático...")
    all_response = supabase.table("cached_analyses").select("*").execute()
    
    problematic_count = 0
    for entry in all_response.data:
        result_json = entry.get("result_json", {})
        if isinstance(result_json, dict):
            gap_1 = result_json.get("gap_1", {})
            if gap_1.get("explicacao") and "Sistemas de IA indisponíveis" in gap_1.get("explicacao", ""):
                problematic_count += 1
                print(f"   🎯 Hash {entry.get('input_hash', 'N/A')[:8]}... - {entry.get('created_at', 'N/A')}")
    
    if problematic_count > 0:
        print(f"\n⚠️  Encontradas {problematic_count} entradas adicionais com fallback problemático")
        confirm = input("🗑️  Deletar todas as entradas problemáticas? (s/N): ")
        
        if confirm.lower() == 's':
            deleted_count = 0
            for entry in all_response.data:
                result_json = entry.get("result_json", {})
                if isinstance(result_json, dict):
                    gap_1 = result_json.get("gap_1", {})
                    if gap_1.get("explicacao") and "Sistemas de IA indisponíveis" in gap_1.get("explicacao", ""):
                        entry_hash = entry.get("input_hash")
                        if entry_hash:
                            supabase.table("cached_analyses").delete().eq("input_hash", entry_hash).execute()
                            deleted_count += 1
                            print(f"   ✅ Deletado hash {entry_hash[:8]}...")
            
            print(f"\n🎉 Total deletado: {deleted_count} entradas problemáticas")
        else:
            print("❌ Operação cancelada")
    else:
        print("✅ Nenhuma entrada adicional problemática encontrada")

except Exception as e:
    print(f"❌ Erro: {e}")
