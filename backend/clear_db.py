#!/usr/bin/env python3
import os
import sys
from supabase import create_client

# Configurar variáveis de ambiente
os.environ['NEXT_PUBLIC_SUPABASE_URL'] = 'https://fkpzupdphbwgadgdbimq.supabase.co'
os.environ['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcHp1cGRwaGJ3Z2FkZ2RiaW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODk1NzIsImV4cCI6MjA1MDI2NTU3Mn0.3TJK7mHwEJ_6jyXQhL5I5q3jY8nF4aG7dP8qX2rYs6k'

# Conectar ao Supabase
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    print('❌ Variáveis de ambiente não encontradas')
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

print('🔮 Conectado ao Supabase')

# Limpar tabelas
tables = ['cached_analyses', 'user_analyses', 'entitlements']

for table in tables:
    try:
        response = supabase.table(table).delete().execute()
        count = len(response.data) if response.data else 0
        print(f'✅ {table} limpo: {count} registros removidos')
    except Exception as e:
        print(f'❌ Erro ao limpar {table}: {e}')

print('🧹 Banco de dados zerado com sucesso!')
