#!/usr/bin/env python3
"""
Script para testar os modelos Groq após a migração
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

from backend.llm_core import call_llm, AGENT_MODEL_REGISTRY, DEFAULT_MODEL

def test_groq_models():
    """Testa se os modelos Groq estão funcionando"""
    print("🧪 Testando modelos Groq...")
    print(f"Modelo padrão: {DEFAULT_MODEL}")
    print(f"Registry: {AGENT_MODEL_REGISTRY}")
    print()
    
    # Teste simples com o agent_diagnosis
    try:
        print("🔍 Testando agent_diagnosis com Groq...")
        
        from backend.prompts import SYSTEM_AGENT_DIAGNOSIS
        
        result = call_llm(
            SYSTEM_AGENT_DIAGNOSIS,
            "VAGA: Desenvolvedor Python Senior\nCV: João Silva, 10 anos de experiência com Python, Django, PostgreSQL.",
            "diagnosis"
        )
        
        print("✅ Sucesso! Resultado:")
        print(f"Tipo: {type(result)}")
        if isinstance(result, dict):
            print(f"Keys: {list(result.keys())}")
            if "veredito" in result:
                print(f"Veredito: {result['veredito']}")
        else:
            print(f"Conteúdo: {result}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False
    
    return True

if __name__ == "__main__":
    # Verificar se a API key do Groq está configurada
    if not os.getenv("GROQ_API_KEY"):
        print("❌ GROQ_API_KEY não configurada")
        sys.exit(1)
    
    success = test_groq_models()
    if success:
        print("\n🎉 Teste concluído com sucesso!")
    else:
        print("\n💥 Teste falhou!")
        sys.exit(1)
