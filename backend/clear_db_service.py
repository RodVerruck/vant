#!/usr/bin/env python3
import os
import sys
import requests

# Configuração do Supabase
SUPABASE_URL = "https://fkpzupdphbwgadgdbimq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcHp1cGRwaGJ3Z2FkZ2RiaW1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY4OTU3MiwiZXhwIjoyMDUwMjY1NTcyfQ.knHkqJjx3tQHdIEaJHRPnSrPYhQHZj_6tBk1cXKmYJ4"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

print('🔮 Conectado ao Supabase (service role)')

# Limpar tabelas
tables = ['cached_analyses', 'user_analyses', 'entitlements']

for table in tables:
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        response = requests.delete(url, headers=headers)
        
        if response.status_code == 204:
            print(f'✅ {table} limpo: todos os registros removidos')
        else:
            print(f'❌ Erro ao limpar {table}: {response.status_code} - {response.text}')
    except Exception as e:
        print(f'❌ Erro ao limpar {table}: {e}')

print('🧹 Banco de dados zerado com sucesso!')
