#!/usr/bin/env python3
"""
Script para listar todos os modelos Gemini disponíveis
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

def list_gemini_models():
    """Lista todos os modelos Gemini disponíveis"""
    try:
        from google import genai
        
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("❌ GOOGLE_API_KEY não configurada")
            return
        
        client = genai.Client(api_key=api_key)
        
        print("🔍 Listando modelos Gemini disponíveis...")
        print("=" * 60)
        
        # Tentar listar modelos através de uma chamada simples
        # Vamos testar os modelos conhecidos
        known_models = [
            # Modelos principais que já testamos
            "models/gemini-2.5-flash",
            "models/gemini-2.5-pro",
            
            # Modelos Flash-Lite (mais baratos)
            "models/gemini-2.5-flash-lite",
            "models/gemini-2.5-flash-lite-001",
            "models/gemini-2.5-flash-lite-002",
            "models/gemini-2.5-flash-lite-preview",
            "models/gemini-2.5-flash-lite-exp",
            
            # Modelos 1.5 Flash (baratos)
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-001",
            "models/gemini-1.5-flash-002",
            "models/gemini-1.5-flash-8b",
            "models/gemini-1.5-flash-lite",
            "models/gemini-1.5-flash-lite-001",
            
            # Modelos experimentais recentes
            "models/gemini-2.0-flash-exp",
            "models/gemini-2.0-flash-lite",
            "models/gemini-2.0-flash-lite-exp",
            "models/gemini-2.5-flash-exp",
            "models/gemini-2.5-flash-lite-exp",
            "models/gemini-2.5-flash-thinking-exp",
            
            # Outros modelos
            "models/gemini-1.5-pro",
            "models/gemini-exp-1206",
            "models/gemini-flash-lite",
            "models/gemini-flash-lite-001",
            "models/gemini-flash-lite-preview"
        ]
        
        print(f"📊 Testando modelos Gemini conhecidos:")
        print()
        
        working_models = []
        
        for model in known_models:
            try:
                # Teste simples para verificar se o modelo existe
                response = client.models.generate_content(
                    model=model,
                    contents="Test",
                    config=genai.types.GenerateContentConfig(
                        max_output_tokens=1
                    )
                )
                working_models.append(model)
                print(f"✅ {model}")
            except Exception as e:
                if "404" in str(e) or "not found" in str(e).lower():
                    print(f"❌ {model} (não encontrado)")
                else:
                    print(f"⚠️ {model} (erro: {type(e).__name__})")
        
        print("=" * 60)
        print(f"✅ Modelos funcionando: {len(working_models)}")
        print()
        
        # Ordenar por custo (do mais barato para o mais caro)
        # Baseado em conhecimento geral dos modelos Gemini
        cost_order = [
            # Modelos Lite (mais baratos)
            "models/gemini-1.5-flash-lite",
            "models/gemini-1.5-flash-lite-001",
            "models/gemini-2.5-flash-lite",
            "models/gemini-2.5-flash-lite-001",
            "models/gemini-2.5-flash-lite-002",
            "models/gemini-2.0-flash-lite",
            "models/gemini-2.0-flash-lite-exp",
            "models/gemini-flash-lite",
            "models/gemini-flash-lite-001",
            
            # Modelos Flash padrão (baratos)
            "models/gemini-1.5-flash",
            "models/gemini-1.5-flash-001",
            "models/gemini-1.5-flash-002",
            "models/gemini-1.5-flash-8b",
            "models/gemini-2.0-flash-exp",
            "models/gemini-2.5-flash",
            
            # Modelos Pro (caros)
            "models/gemini-1.5-pro",
            "models/gemini-2.5-pro"
        ]
        
        print("💰 Modelos ordenados por custo (do mais barato para o mais caro):")
        print()
        
        for model in cost_order:
            if model in working_models:
                print(f"💎 {model} - ✅ DISPONÍVEL")
            else:
                # Verificar se há versão experimental similar
                for working in working_models:
                    if model.replace("models/", "").split("-")[0] in working:
                        print(f"💎 {model} - ⚠️ Similar: {working}")
                        break
        
        return working_models
        
    except Exception as e:
        print(f"❌ Erro ao listar modelos: {e}")
        return []

if __name__ == "__main__":
    list_gemini_models()
