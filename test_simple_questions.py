"""
Teste simples das perguntas usando o gerador diretamente
"""

import sys
import os

# Adicionar o backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_simple_questions():
    """Testa o gerador de perguntas diretamente"""
    
    print("🎭 TESTE SIMPLES DO GERADOR DE PERGUNTAS")
    print("=" * 60)
    
    try:
        # Importar o gerador
        from question_generator_wow import generate_dynamic_questions_wow
        
        # Testar diferentes áreas
        test_cases = [
            {
                "sector": "VENDAS CS",
                "gaps_fatais": [
                    {"titulo": "Falta de experiência em vendas", "descricao": "Precisa desenvolver habilidades comerciais"},
                    {"titulo": "Comunicação limitada", "descricao": "Melhorar argumentação"}
                ],
                "job_description": "Vaga na área de Vendas/CS",
                "area_name": "Vendas/CS"
            },
            {
                "sector": "MARKETING GROWTH",
                "gaps_fatais": [
                    {"titulo": "Falta de experiência digital", "descricao": "Precisa desenvolver habilidades de marketing digital"},
                    {"titulo": "Análise de dados limitada", "descricao": "Melhorar capacidade analítica"}
                ],
                "job_description": "Vaga na área de Marketing/Growth",
                "area_name": "Marketing/Growth"
            },
            {
                "sector": "RH LIDERANCA",
                "gaps_fatais": [
                    {"titulo": "Falta de liderança", "descricao": "Precisa desenvolver habilidades de gestão"},
                    {"titulo": "Conflitos interpessoais", "descricao": "Dificuldade em lidar com conflitos"}
                ],
                "job_description": "Vaga na área de RH/Liderança",
                "area_name": "RH/Liderança"
            }
        ]
        
        for case in test_cases:
            area_name = case["area_name"]
            print(f"\n📋 Testando área: {area_name}")
            print("-" * 40)
            
            try:
                questions = generate_dynamic_questions_wow(
                    sector=case["sector"],
                    gaps_fatais=case["gaps_fatais"],
                    job_description=case["job_description"],
                    mode="mixed",
                    difficulty="médio",
                    num_questions=3
                )
                
                print(f"✅ Geradas {len(questions)} perguntas:")
                
                # Palavras-chave por área
                area_keywords = {
                    "Vendas/CS": ["venda", "cliente", "negócio", "meta", "fechar", "atendimento"],
                    "Marketing/Growth": ["marketing", "campanha", "mídia", "crescimento", "estratégia"],
                    "RH/Liderança": ["equipe", "liderar", "pessoa", "cultura", "gestão"]
                }
                
                keywords = area_keywords.get(area_name, [])
                relevant_count = 0
                
                for i, q in enumerate(questions, 1):
                    question_text = q.get("text", "").lower()
                    print(f"\n{i}. {q.get('text', '')}")
                    print(f"   Tipo: {q.get('type', '')}")
                    print(f"   Setor: {q.get('sector', '')}")
                    
                    # Verificar relevância
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
                print(f"❌ Erro ao gerar perguntas para {area_name}: {e}")
        
    except ImportError as e:
        print(f"❌ Erro ao importar gerador: {e}")
        print("   Verifique se o backend está configurado corretamente")
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("🎭 FIM DO TESTE SIMPLES")
    print("=" * 60)

if __name__ == "__main__":
    test_simple_questions()
