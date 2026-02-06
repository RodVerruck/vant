#!/usr/bin/env python3
"""
Ativa assinatura para usuário existente pelo email
"""
import requests
import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurar Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def activate_by_email():
    """Ativa assinatura para usuário existente"""
    
    print("🔧 Ativando usuário teste@sememail.com")
    print("=" * 50)
    
    email = "teste@sememail.com"
    plan_id = "pro_monthly"
    
    try:
        # 1. Buscar usuário no Supabase Auth
        print(f"\n1. Buscando usuário {email} no Supabase Auth...")
        
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Listar usuários
        users = supabase.auth.admin.list_users()
        
        print(f"📋 Total de usuários: {len(users)}")
        
        target_user = None
        for user in users:
            print(f"   - {user.email} (ID: {user.id})")
            if user.email == email:
                target_user = user
                break
        
        if target_user:
            print(f"✅ Usuário encontrado: {target_user.id}")
            
            # 2. Verificar se já tem assinatura
            print(f"\n2. Verificando assinatura existente...")
            
            subs = supabase.table("subscriptions").select("*").eq("user_id", target_user.id).execute()
            
            if subs.data:
                print(f"📋 Assinatura existente: {subs.data[0]}")
            else:
                print(f"⚠️ Sem assinatura no banco")
                
                # 3. Criar assinatura manual
                print(f"\n3. Criando assinatura manual...")
                
                from datetime import datetime, timedelta
                now = datetime.now()
                
                subscription_data = {
                    "user_id": target_user.id,
                    "subscription_plan": plan_id,
                    "stripe_subscription_id": f"manual_{target_user.id[:8]}",
                    "stripe_customer_id": f"cus_manual_{target_user.id[:8]}",
                    "subscription_status": "active",
                    "current_period_start": now.isoformat(),
                    "current_period_end": (now + timedelta(days=30)).isoformat(),
                }
                
                try:
                    supabase.table("subscriptions").insert(subscription_data).execute()
                    print(f"✅ Assinatura criada!")
                    
                    # 4. Criar usage
                    print(f"\n4. Criando registro de usage...")
                    
                    supabase.table("usage").upsert({
                        "user_id": target_user.id,
                        "period_start": now.isoformat(),
                        "used": 0,
                        "usage_limit": 30
                    }).execute()
                    
                    print(f"✅ Usage criado com 30 créditos!")
                    
                    # 5. Verificar status
                    print(f"\n5. Verificando status final...")
                    
                    response = requests.get(f"http://127.0.0.1:8000/api/user/status/{target_user.id}")
                    if response.status_code == 200:
                        status = response.json()
                        print(f"📊 Status: {status}")
                        
                        if status.get("has_active_plan") and status.get("credits_remaining", 0) > 0:
                            print(f"\n🎉 SUCESSO! Usuário {email} agora tem {status['credits_remaining']} créditos!")
                        else:
                            print(f"\n❌ Ainda sem créditos")
                    else:
                        print(f"❌ Erro ao verificar status: {response.status_code}")
                        
                except Exception as e:
                    print(f"❌ Erro ao criar assinatura: {e}")
        else:
            print(f"❌ Usuário {email} não encontrado no Supabase Auth")
            print(f"📝 Usuários disponíveis:")
            for user in users:
                print(f"   - {user.email}")
                
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    activate_by_email()
