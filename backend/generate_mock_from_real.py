"""
Script para gerar mocks realistas a partir de processamento real da IA.

USO:
1. Desative DEV_MODE temporariamente no .env (DEV_MODE=false)
2. Execute: python backend/generate_mock_from_real.py
3. O script vai processar seu CV com IA real
4. Os resultados serão salvos em mock_data.py
5. Reative DEV_MODE (DEV_MODE=true)
6. Agora todos os testes usarão dados reais sem gastar tokens!

IMPORTANTE: Só execute quando quiser atualizar os mocks com novos dados.
"""

import sys
import os
from pathlib import Path

# Adiciona o diretório raiz ao path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from logic import extrair_texto_pdf, analyze_preview_lite, analyze_cv_logic
import json

def main():
    print("\n" + "="*70)
    print("🧪 GERADOR DE MOCKS REALISTAS")
    print("="*70)
    
    # Verifica se DEV_MODE está desativado
    dev_mode = os.getenv("DEV_MODE", "false").lower()
    if dev_mode == "true":
        print("\n⚠️  ERRO: DEV_MODE está ativado!")
        print("   Para gerar mocks reais, você precisa:")
        print("   1. Editar o arquivo .env")
        print("   2. Mudar DEV_MODE=true para DEV_MODE=false")
        print("   3. Executar este script novamente")
        print("   4. Depois reativar DEV_MODE=true\n")
        return
    
    # Verifica se existe CV de teste
    cache_dir = PROJECT_ROOT / ".cache"
    cv_path = cache_dir / "last_cv.pdf"
    job_path = cache_dir / "last_job.txt"
    
    if not cv_path.exists():
        print("\n⚠️  ERRO: Arquivo de CV não encontrado!")
        print(f"   Esperado em: {cv_path}")
        print("   Faça upload de um CV pelo app primeiro.\n")
        return
    
    if not job_path.exists():
        print("\n⚠️  AVISO: Descrição de vaga não encontrada.")
        print("   Usando descrição padrão...\n")
        job_description = "Analista de Suporte Técnico Júnior"
    else:
        with open(job_path, 'r', encoding='utf-8') as f:
            job_description = f.read().strip()
    
    print(f"\n📄 CV encontrado: {cv_path.name}")
    print(f"💼 Vaga: {job_description[:60]}...")
    print("\n🤖 Processando com IA REAL (isso vai gastar tokens)...")
    print("   Aguarde, pode levar 30-60 segundos...\n")
    
    # Processa PREVIEW (análise lite)
    print("1️⃣  Gerando MOCK_PREVIEW_DATA...")
    try:
        with open(cv_path, 'rb') as f:
            cv_text = extrair_texto_pdf(f)
        
        preview_data = analyze_preview_lite(cv_text, job_description)
        print("   ✅ Preview gerado com sucesso!")
    except Exception as e:
        print(f"   ❌ Erro ao gerar preview: {e}")
        return
    
    # Processa PREMIUM (análise completa)
    print("\n2️⃣  Gerando MOCK_PREMIUM_DATA...")
    print("   (Isso é mais demorado, aguarde...)")
    try:
        with open(cv_path, 'rb') as f:
            cv_text = extrair_texto_pdf(f)
        
        premium_data = analyze_cv_logic(cv_text, job_description, competitor_files=[])
        print("   ✅ Premium gerado com sucesso!")
    except Exception as e:
        print(f"   ❌ Erro ao gerar premium: {e}")
        return
    
    # Salva no arquivo mock_data.py
    print("\n3️⃣  Salvando em mock_data.py...")
    
    mock_file = PROJECT_ROOT / "backend" / "mock_data.py"
    
    # Cria o conteúdo do arquivo usando repr() para sintaxe Python válida
    content = f'''# Mock data para modo de desenvolvimento
# Gerado automaticamente a partir de processamento real da IA
# Para atualizar: python backend/generate_mock_from_real.py

MOCK_PREVIEW_DATA = {repr(preview_data)}

MOCK_PREMIUM_DATA = {repr(premium_data)}
'''
    
    with open(mock_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ Arquivo salvo: {mock_file}")
    
    print("\n" + "="*70)
    print("✅ MOCKS ATUALIZADOS COM SUCESSO!")
    print("="*70)
    print("\n📋 Próximos passos:")
    print("   1. Edite o arquivo .env")
    print("   2. Mude DEV_MODE=false para DEV_MODE=true")
    print("   3. Reinicie o servidor backend")
    print("   4. Agora todos os testes usarão dados reais sem gastar tokens!\n")

if __name__ == "__main__":
    main()
