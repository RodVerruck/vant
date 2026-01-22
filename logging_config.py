"""
Configuração centralizada de logging para o projeto Vant.
Fornece loggers consistentes para todos os módulos.
"""

import logging
import sys
from datetime import datetime
import os

# Configuração de logging
LOG_LEVEL = logging.INFO
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# Cria diretório de logs se não existir
LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Nome do arquivo de log baseado na data
LOG_FILENAME = f"{LOG_DIR}/vant_{datetime.now().strftime('%Y%m%d')}.log"

def setup_logger(name: str, level: int = LOG_LEVEL) -> logging.Logger:
    """
    Configura e retorna um logger com o nome especificado.
    
    Args:
        name: Nome do logger (geralmente __name__)
        level: Nível de logging (default: LOG_LEVEL)
    
    Returns:
        logging.Logger configurado
    """
    logger = logging.getLogger(name)
    
    # Evitar configuração duplicada
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # Formatter
    formatter = logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT)
    
    # Handler para console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    
    # Handler para arquivo
    file_handler = logging.FileHandler(LOG_FILENAME, encoding='utf-8')
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    
    # Adiciona handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

def silence_external_loggers():
    """
    Silencia loggers de bibliotecas externas para reduzir ruído.
    """
    # Bibliotecas que devem logar apenas em nível ERROR ou superior
    external_loggers = [
        "fontTools",
        "weasyprint",
        "pypdf",
        "urllib3",
        "requests",
        "httpx",
        "openai",
        "anthropic",
        "google",
        "docx",
        "PIL",
    ]
    
    for logger_name in external_loggers:
        logging.getLogger(logger_name).setLevel(logging.ERROR)

# Configuração inicial
silence_external_loggers()

# Logger principal do sistema
main_logger = setup_logger("VANT")

if __name__ == "__main__":
    # Teste básico
    main_logger.info("Configuração de logging inicializada com sucesso!")
    main_logger.debug("Mensagem de debug")
    main_logger.warning("Mensagem de warning")
    main_logger.error("Mensagem de erro")
