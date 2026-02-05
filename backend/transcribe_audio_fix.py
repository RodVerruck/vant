def transcribe_audio_gemini_fixed(audio_bytes):
    """
    Transcreve áudio usando Gemini 2.5-flash-lite.
    Versão corrigida usando types.Part.from_bytes.
    """
    import sys
    sys.path.append('.')
    
    from llm_core import genai_client, logger
    import time
    
    if not genai_client:
        logger.error("❌ Gemini Client não configurado.")
        return "Erro: API Gemini indisponível."

    try:
        # Transcrição usando Gemini com bytes diretamente
        from google import genai as genai_lib
        from google.genai import types
        
        response = genai_client.models.generate_content(
            model="models/gemini-2.5-flash-lite",
            contents=[
                types.Part(text="Transcreva exatamente o que está sendo dito neste áudio. Retorne apenas a transcrição, sem formatação adicional."),
                types.Part(
                    inline_data=types.Blob(
                        mime_type="audio/webm",
                        data=audio_bytes
                    )
                )
            ]
        )
        
        transcription = response.text.strip()
        return transcription

    except Exception as e:
        logger.error(f"❌ Erro na transcrição Gemini: {e}")
        return f"Erro ao transcrever áudio: {str(e)}"


# Teste rápido
if __name__ == "__main__":
    print("Testando função corrigida com from_bytes...")
    result = transcribe_audio_gemini_fixed(b"fake audio data")
    print("Resultado:", result)
