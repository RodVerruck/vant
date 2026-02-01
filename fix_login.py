#!/usr/bin/env python3
import re

# Ler o arquivo
with open('frontend/src/app/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Padrão a ser substituído
old_pattern = r'''                        // Restaurar o stage e plano após login com Google
                        const returnStage = localStorage\.getItem\("vant_auth_return_stage"\);
                        const returnPlan = localStorage\.getItem\("vant_auth_return_plan"\);

                        if \(returnStage\) \{
                            setStage\(returnStage as AppStage\);
                            localStorage\.removeItem\("vant_auth_return_stage"\);
                        \}

                        if \(returnPlan\) \{
                            setSelectedPlan\(returnPlan as PlanType\);
                            localStorage\.removeItem\("vant_auth_return_plan"\);
                        \}'''

# Novo código
new_code = '''                        // Restaurar o stage e plano após login com Google
                        const returnStage = localStorage.getItem("vant_auth_return_stage");
                        const returnPlan = localStorage.getItem("vant_auth_return_plan");

                        if (returnPlan) {
                            setSelectedPlan(returnPlan as PlanType);
                            localStorage.removeItem("vant_auth_return_plan");
                            // Se tinha plano selecionado, vai direto para checkout
                            setStage("checkout");
                            localStorage.removeItem("vant_auth_return_stage");
                        } else if (returnStage) {
                            setStage(returnStage as AppStage);
                            localStorage.removeItem("vant_auth_return_stage");
                        }'''

# Substituir
content = re.sub(old_pattern, new_code, content, flags=re.MULTILINE)

# Salvar
with open('frontend/src/app/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Arquivo corrigido com sucesso!")
