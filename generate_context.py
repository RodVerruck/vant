import os

# Nome do arquivo de saída
OUTPUT_FILE = "contexto_vant.txt"

# Pastas e arquivos para IGNORAR (Segurança e Limpeza)
IGNORE_DIRS = {'.git', '__pycache__', 'venv', '.venv', '.streamlit', 'data'}
IGNORE_FILES = {'.env', 'poetry.lock', 'package-lock.json', '.DS_Store', 'generate_context.py', 'app - Copia.py', 'llm_core - Copia.py', 'logic - Copia.py', 'prompts - Copia.py', 'ui_components - Copia.py', 'style - Copia.css', OUTPUT_FILE}
IGNORE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pyc'}

def is_ignored(path):
    # Verifica se o caminho contém alguma pasta ignorada
    parts = path.split(os.sep)
    for part in parts:
        if part in IGNORE_DIRS:
            return True
    return False

def main():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
        outfile.write(f"=== CONTEXTO DO PROJETO VANT ===\n\n")
        
        # Percorre todos os arquivos da pasta atual
        for root, dirs, files in os.walk("."):
            # Modifica a lista 'dirs' in-place para pular pastas ignoradas
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                file_path = os.path.join(root, file)
                
                # Verificações de ignorados
                if file in IGNORE_FILES:
                    continue
                if any(file.endswith(ext) for ext in IGNORE_EXTENSIONS):
                    continue
                if is_ignored(root):
                    continue
                
                # Escreve o arquivo no output
                try:
                    with open(file_path, "r", encoding="utf-8") as infile:
                        content = infile.read()
                        outfile.write(f"==================================================\n")
                        outfile.write(f"FILE: {file_path}\n")
                        outfile.write(f"==================================================\n")
                        outfile.write(content + "\n\n")
                        print(f"Adicionado: {file_path}")
                except Exception as e:
                    print(f"Erro ao ler {file_path}: {e}")

    print(f"\n✅ Sucesso! Arquivo '{OUTPUT_FILE}' gerado.")

if __name__ == "__main__":
    main()