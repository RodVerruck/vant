"""
Teste das perguntas via API do simulador
"""

import requests
import json
import time

def test_questions_via_api():
    """Testa as perguntas do simulador via API"""
    
    base_url = "http://127.0.0.1:8000"
    
    print("🎭 TESTANDO PERGUNTAS VIA API DO SIMULADOR")
    print("=" * 60)
    
    # Testar Vendas/CS especificamente
    area_key = "vendas_cs"
    area_name = "Vendas/CS"
    
    print(f"\n📋 Testando perguntas para: {area_name}")
    print("-" * 40)
    
    try:
        # 1. Criar CV de teste
        cv_content = """
MARIA VENDEDORA
EXPERIÊNCIA PROFISSIONAL
Vendedora | Loja ABC | 2021-2023
- Atendimento ao cliente
- Vendas consultivas
- Metas mensais

EDUCAÇÃO
Bacharel em Administração
"""
        
        with open("test_cv_vendas.txt", "w", encoding="utf-8") as f:
            f.write(cv_content)
        
        # 2. Criar análise com área forçada
        print("🔍 Criando análise com área forçada...")
        with open("test_cv_vendas.txt", "rb") as f:
            files = {"file": f}
            data = {
                "job_description": "Busco oportunidades profissionais que valorizem minhas habilidades.",
                "area_of_interest": area_key
            }
            
            response = requests.post(
                f"{base_url}/api/analyze-lite",
                files=files,
                data=data,
                timeout=30
            )
        
        if response.status_code != 200:
            print(f"❌ Erro na análise: {response.status_code}")
            print(response.text)
            return
            
        analysis = response.json()
        setor_detectado = analysis.get("analise_por_pilares", {}).get("setor_detectado", "")
        print(f"✅ Setor detectado: {setor_detectado}")
        
        # 3. Criar sessão de entrevista
        print("🎭 Criando sessão de entrevista...")
        
        session_data = {
            "cv_analysis_id": "mock-id-vendas",
            "interview_mode": "mixed",
            "difficulty": "médio",
            "sector_detected": setor_detectado,
            "focus_areas": ["vendas", "cliente"],
            "questions": []  # Serão geradas depois
        }
        
        session_response = requests.post(
            f"{base_url}/api/interview/session/create",
            json=session_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if session_response.status_code != 200:
            print(f"❌ Erro ao criar sessão: {session_response.status_code}")
            print(session_response.text)
            return
            
        session = session_response.json()
        session_id = session.get("session", {}).get("id")
        print(f"✅ Sessão criada: {session_id}")
        
        # 4. Gerar perguntas para a sessão
        print("📝 Gerando perguntas...")
        
        questions_data = {
            "cv_analysis_id": "mock-id-vendas",
            "mode": "mixed",
            "difficulty": "médio",
            "focus_areas": ["vendas", "cliente"]
        }
        
        questions_response = requests.post(
            f"{base_url}/api/interview/generate-questions",
            data=questions_data,
            timeout=30
        )
        
        if questions_response.status_code != 200:
            print(f"❌ Erro ao gerar perguntas: {questions_response.status_code}")
            print(questions_response.text)
            return
            
        questions_result = questions_response.json()
        questions = questions_result.get("questions", [])
        
        print(f"✅ Geradas {len(questions)} perguntas:")
        
        # 5. Analisar relevância das perguntas
        vendas_keywords = ["venda", "cliente", "negócio", "meta", "fechar", "atendimento", "vendedor", "comercial"]
        relevant_count = 0
        
        for i, q in enumerate(questions, 1):
            question_text = q.get("text", "").lower()
            print(f"\n{i}. {q.get('text', '')}")
            print(f"   Tipo: {q.get('type', '')}")
            print(f"   Setor: {q.get('sector', '')}")
            
            # Verificar se a pergunta é relevante para vendas
            is_relevant = any(keyword in question_text for keyword in vendas_keywords)
            if is_relevant:
                relevant_count += 1
                print(f"   ✅ Relevante para Vendas/CS")
            else:
                print(f"   ⚠️ Pode não ser específico para Vendas/CS")
        
        relevance_rate = (relevant_count / len(questions)) * 100 if questions else 0
        print(f"\n📊 Taxa de relevância: {relevance_rate:.1f}% ({relevant_count}/{len(questions)})")
        
        if relevance_rate >= 66:
            print(f"✅ Boa cobertura para Vendas/CS")
        else:
            print(f"❌ Baixa cobertura para Vendas/CS")
            
        # 6. Testar uma resposta
        if questions:
            print("\n🎤 Testando resposta para primeira pergunta...")
            
            answer_data = {
                "session_id": session_id,
                "question_id": 1,
                "answer_text": "Eu sou uma vendedora experiente que gosto de superar metas e construir relacionamentos com clientes.",
                "response_time": 30
            }
            
            answer_response = requests.post(
                f"{base_url}/api/interview/session/answer",
                json=answer_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if answer_response.status_code == 200:
                print("✅ Resposta registrada com sucesso")
            else:
                print(f"❌ Erro ao registrar resposta: {answer_response.status_code}")
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        import traceback
        traceback.print_exc()
    
    # Limpar arquivo temporário
    import os
    if os.path.exists("test_cv_vendas.txt"):
        os.remove("test_cv_vendas.txt")
    
    print("\n" + "=" * 60)
    print("🎭 FIM DO TESTE VIA API")
    print("=" * 60)

if __name__ == "__main__":
    test_questions_via_api()
