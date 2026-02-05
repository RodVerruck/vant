"""
Teste das perguntas do simulador para diferentes áreas
"""

import requests
import json

def test_interview_questions():
    """Testa se as perguntas do simulador respeitam a área selecionada"""
    
    base_url = "http://127.0.0.1:8000"
    
    print("🎭 TESTANDO PERGUNTAS DO SIMULADOR POR ÁREA")
    print("=" * 60)
    
    # Testar diferentes áreas
    test_areas = [
        ("vendas_cs", "Vendas/CS"),
        ("marketing_growth", "Marketing/Growth"),
        ("rh_lideranca", "RH/Liderança"),
        ("financeiro_corp", "Financeiro/Corporativo")
    ]
    
    for area_key, area_name in test_areas:
        print(f"\n📋 Testando perguntas para: {area_name}")
        print("-" * 40)
        
        try:
            # 1. Primeiro, criar uma análise com a área forçada
            cv_content = f"""
CANDIDATO TESTE
EXPERIÊNCIA
Analista Júnior | Empresa ABC | 2021-2023
- Atendimento ao cliente
- Metas de vendas
EDUCAÇÃO
Bacharel em Administração
"""
            
            with open("test_cv_temp.txt", "w", encoding="utf-8") as f:
                f.write(cv_content)
            
            # Criar análise
            with open("test_cv_temp.txt", "rb") as f:
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
                continue
                
            analysis = response.json()
            setor_detectado = analysis.get("analise_por_pilares", {}).get("setor_detectado", "")
            print(f"🎯 Setor detectado: {setor_detectado}")
            
            # 2. Agora gerar perguntas para essa análise
            # Simular que temos um cv_analysis_id (usando mock)
            mock_analysis_data = {
                "setor_detectado": setor_detectado,
                "gaps_fatais": [
                    {"titulo": "Falta de experiência em vendas", "descricao": "Precisa desenvolver habilidades comerciais"},
                    {"titulo": "Comunicação limitada", "descricao": "Melhorar argumentação"}
                ],
                "job_description": "Vaga na área de " + area_name,
                "cv_otimizado_completo": cv_content
            }
            
            # Salvar análise mock no Supabase (se necessário)
            # Por ora, vamos testar diretamente o gerador
            
            # 3. Testar o gerador de perguntas diretamente
            from backend.question_generator_wow import generate_dynamic_questions_wow
            
            questions = generate_dynamic_questions_wow(
                sector=setor_detectado,
                gaps_fatais=mock_analysis_data["gaps_fatais"],
                job_description=mock_analysis_data["job_description"],
                mode="mixed",
                difficulty="médio",
                num_questions=3
            )
            
            print(f"📝 Geradas {len(questions)} perguntas:")
            
            # Analisar se as perguntas são relevantes para a área
            area_keywords = {
                "vendas_cs": ["venda", "cliente", "negócio", "meta", "fechar"],
                "marketing_growth": ["marketing", "campanha", "mídia", "crescimento", "estratégia"],
                "rh_lideranca": ["equipe", "liderar", "pessoa", "cultura", "gestão"],
                "financeiro_corp": ["financeiro", "orçamento", "custo", "investimento", "análise"]
            }
            
            keywords = area_keywords.get(area_key, [])
            relevant_count = 0
            
            for i, q in enumerate(questions, 1):
                question_text = q.get("text", "").lower()
                print(f"\n{i}. {q.get('text', '')}")
                print(f"   Tipo: {q.get('type', '')}")
                
                # Verificar se a pergunta é relevante para a área
                is_relevant = any(keyword in question_text for keyword in keywords)
                if is_relevant:
                    relevant_count += 1
                    print(f"   ✅ Relevante para {area_name}")
                else:
                    print(f"   ⚠️ Pode não ser específico para {area_name}")
            
            relevance_rate = (relevant_count / len(questions)) * 100 if questions else 0
            print(f"\n📊 Taxa de relevância: {relevance_rate:.1f}% ({relevant_count}/{len(questions)})")
            
            if relevance_rate >= 66:
                print(f"✅ Boa cobertura para {area_name}")
            else:
                print(f"❌ Baixa cobertura para {area_name}")
                
        except Exception as e:
            print(f"❌ Erro ao testar {area_name}: {e}")
            import traceback
            traceback.print_exc()
    
    # Limpar arquivo temporário
    import os
    if os.path.exists("test_cv_temp.txt"):
        os.remove("test_cv_temp.txt")
    
    print("\n" + "=" * 60)
    print("🎭 FIM DOS TESTES DE PERGUNTAS")
    print("=" * 60)

if __name__ == "__main__":
    test_interview_questions()
