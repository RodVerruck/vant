#!/usr/bin/env python3
"""
Script para testar se o backend está realmente usando Gemini
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

def test_backend_model():
    """Testa qual modelo o backend está usando"""
    try:
        from backend.llm_core import AGENT_MODEL_REGISTRY, DEFAULT_MODEL, call_llm
        from backend.prompts import SYSTEM_AGENT_DIAGNOSIS
        
        print("🔍 Verificando configuração atual do backend...")
        print(f"DEFAULT_MODEL: {DEFAULT_MODEL}")
        print(f"AGENT_MODEL_REGISTRY: {AGENT_MODEL_REGISTRY}")
        print()
        
        print("🧪 Testando agent_diagnosis...")
        result = call_llm(
            SYSTEM_AGENT_DIAGNOSIS,
            "VAGA: Desenvolvedor Python\nCV: João com 5 anos de experiência",
            "diagnosis"
        )
        
        print(f"Tipo: {type(result)}")
        if isinstance(result, dict):
            print(f"Keys: {list(result.keys())}")
            if "_vant_error" in result:
                print(f"❌ Erro: {result.get('message', '')}")
            else:
                print("✅ Sucesso! Resposta normal")
                if "veredito" in result:
                    print(f"Veredito: {result['veredito']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        return False

if __name__ == "__main__":
    test_backend_model()
