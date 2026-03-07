#!/usr/bin/env python3
"""
Script para substituir o HTML inline antigo do preview pelo componente FreeAnalysisStage
"""

# Ler o arquivo
with open(r'c:\Vant\frontend\src\app\app\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar o início do bloco antigo
start_marker = '{stage === "preview" && ('
end_marker = '            )\n            }\n\n            {\n                stage === "activating_payment"'

# Novo código para substituir
new_code = '''{stage === "preview" && previewData && (
                <FreeAnalysisStage
                    previewData={previewData}
                    onUpgrade={() => {
                        setSelectedPlan("trial");
                        setStage("checkout");
                    }}
                    onTryAnother={() => setStage("hero")}
                />
            )}

            {
                stage === "activating_payment"'''

# Encontrar posições
start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos == -1 or end_pos == -1:
    print(f"ERRO: Não encontrou os marcadores!")
    print(f"start_pos: {start_pos}, end_pos: {end_pos}")
    exit(1)

# Fazer a substituição
new_content = content[:start_pos] + new_code + content[end_pos + len(end_marker) - len('            {\n                stage === "activating_payment"'):]

# Salvar o arquivo
with open(r'c:\Vant\frontend\src\app\app\page.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Substituição concluída com sucesso!")
print(f"Removidas {end_pos - start_pos} caracteres de HTML inline antigo")
