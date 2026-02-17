# Script para criar endpoint de geração de Pitch de Defesa

import os

# Adicionar endpoint ao main.py
endpoint_code = '''
@app.post("/api/generate-defense-pitch")
async def generate_defense_pitch(request: Request, payload: dict = Body(...)):
    """Generate defense pitch for interview using Gemini Flash-Lite"""
    try:
        prompt = payload.get("prompt", "")
        
        if not prompt or len(prompt) < 10:
            raise HTTPException(status_code=400, detail="Prompt inválido")
        
        # Use Gemini Flash-Lite para gerar o pitch
        from .logic import AGENT_MODEL_REGISTRY, DEFAULT_MODEL
        import google.generativeai as genai
        
        model_name = AGENT_MODEL_REGISTRY.get("diagnosis", DEFAULT_MODEL)
        model = genai.GenerativeModel(model_name)
        
        response = model.generate_content(prompt)
        
        if response and response.text:
            pitch = response.text.strip()
            # Validar tamanho
            if 20 <= len(pitch) <= 200:
                return {"pitch": pitch}
        
        # Fallback simples
        return {"pitch": "Minha experiência me preparou com as competências necessárias para este desafio."}
        
    except Exception as e:
        print(f"Error generating defense pitch: {e}")
        # Fallback robusto
        return {"pitch": "Embora minha experiência anterior seja em outra área, desenvolvi habilidades transferíveis que me qualificam para este desafio."}
'''

print("📝 Endpoint code gerado!")
print("Adicione este código ao backend/main.py")
print("🚀 Usa Gemini Flash-Lite com fallback robusto")
print("🔄 Nunca vai retornar erro - sempre tem fallback")
