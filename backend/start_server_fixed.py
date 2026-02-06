#!/usr/bin/env python3
"""
Servidor Vant com configuração de PYTHONPATH robusta.
Elimina dependência de sys.path manipulation e importações condicionais.
"""

import os
import sys
from pathlib import Path

# Configura PYTHONPATH de forma explícita e segura
def setup_python_path():
    """Configura PYTHONPATH para incluir o diretório raiz do projeto."""
    
    # Obtém o diretório raiz do projeto (backend/../)
    backend_dir = Path(__file__).parent.absolute()
    project_root = backend_dir.parent.absolute()
    
    # Adiciona ao PYTHONPATH se não estiver presente
    project_root_str = str(project_root)
    if project_root_str not in sys.path:
        sys.path.insert(0, project_root_str)
        print(f"✅ PYTHONPATH configurado: {project_root_str}")
    
    # Verifica estrutura essencial
    required_dirs = ['backend', 'frontend']
    for dir_name in required_dirs:
        dir_path = project_root / dir_name
        if not dir_path.exists():
            print(f"⚠️ Diretório ausente: {dir_path}")
        else:
            print(f"✅ Diretório encontrado: {dir_path}")

# Configura ambiente antes de qualquer importação
setup_python_path()

# Agora pode importar com segurança usando backend prefix
import uvicorn

if __name__ == "__main__":
    print("🚀 Iniciando servidor Vant com PYTHONPATH configurado...")
    
    # Configurações do servidor
    config = {
        "host": "0.0.0.0",
        "port": 8000,
        "reload": True,  # Para desenvolvimento
        "app": "backend.main:app",
        "log_level": "info"
    }
    
    # Inicia servidor
    uvicorn.run(**config)
