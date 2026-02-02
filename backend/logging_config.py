import logging
import sys

def setup_logger(name: str) -> logging.Logger:
    """
    Configura um logger unificado para o projeto.
    
    Args:
        name: Nome do logger (ex: "VANT_LOGIC", "VANT_LLM")
    
    Returns:
        Logger configurado
    """
    logger = logging.getLogger(name)
    
    # Evita duplicação de handlers
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.INFO)
    
    # Handler para console
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    
    # Formato de log
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    
    return logger
