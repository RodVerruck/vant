"""
Script para configurar persistência no Supabase
Execute este script para criar as tabelas necessárias
"""

import os
from supabase import create_client
from dotenv import load_dotenv

def setup_interview_persistence():
    """Configura todas as tabelas de persistência"""
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role para admin
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials não encontradas")
        return False
    
    # Criar cliente admin
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        # Ler e executar o SQL
        with open("backend/setup_interview_persistence.sql", "r", encoding="utf-8") as f:
            sql_content = f.read()
        
        # Dividir o SQL em comandos individuais
        sql_commands = [cmd.strip() for cmd in sql_content.split(";") if cmd.strip()]
        
        print("🚀 Configurando persistência do simulador WOW...")
        print()
        
        for i, command in enumerate(sql_commands, 1):
            if not command or command.startswith("--"):
                continue
            
            try:
                # Executar comando SQL
                result = supabase.rpc("execute_sql", {"sql": command}).execute()
                print(f"✅ Comando {i}/{len(sql_commands)} executado com sucesso")
                
            except Exception as e:
                # Tentar executar como query direta
                try:
                    # Para comandos CREATE, INSERT, etc.
                    if any(keyword in command.upper() for keyword in ["CREATE", "INSERT", "ALTER"]):
                        # Alguns comandos precisam ser executados via SQL editor do Supabase
                        print(f"⚠️ Comando {i}/{len(sql_commands)} precisa ser executado manualmente no SQL Editor:")
                        print(f"   {command[:100]}...")
                        print()
                    else:
                        print(f"⚠️ Comando {i}/{len(sql_commands)} pulado: {str(e)}")
                        
                except Exception as e2:
                    print(f"❌ Erro no comando {i}: {str(e2)}")
        
        print()
        print("🎉 Configuração concluída!")
        print()
        print("📋 Próximos passos:")
        print("1. Abra o SQL Editor no seu Supabase")
        print("2. Copie e cole o conteúdo do arquivo setup_interview_persistence.sql")
        print("3. Execute o SQL completo")
        print("4. Verifique se todas as tabelas foram criadas")
        print()
        print("🚀 Após executar o SQL, o sistema estará pronto para persistência completa!")
        
        return True
        
    except FileNotFoundError:
        print("❌ Arquivo setup_interview_persistence.sql não encontrado")
        return False
    except Exception as e:
        print(f"❌ Erro durante setup: {e}")
        return False

if __name__ == "__main__":
    setup_interview_persistence()
