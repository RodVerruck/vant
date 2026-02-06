#!/usr/bin/env python3
"""
Script para testar o frontend automaticamente
"""
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def test_frontend_credits():
    """Testa o frontend automaticamente"""
    
    print("🧪 Teste Automatizado do Frontend - Créditos")
    print("=" * 50)
    
    # Configurar Chrome
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Executar sem abrir janela
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        print("✅ Chrome iniciado")
        
        # 1. Acessar aplicação
        print("\n1. Acessando aplicação...")
        driver.get("http://localhost:3000")
        time.sleep(3)
        
        # 2. Verificar se está na página inicial
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "h1"))
            )
            print("✅ Página carregada")
        except:
            print("❌ Falha ao carregar página")
            return
        
        # 3. Verificar indicador de créditos
        print("\n2. Verificando indicador de créditos...")
        try:
            credits_element = driver.find_element(By.XPATH, "//div[contains(text(), 'Créditos')]")
            credits_text = credits_element.text
            print(f"✅ Indicador encontrado: {credits_text}")
            
            if "29" in credits_text:
                print("✅ Créditos corretos (29)")
            else:
                print(f"⚠️ Créditos inesperados: {credits_text}")
        except:
            print("❌ Indicador de créditos não encontrado")
        
        # 4. Verificar botão de gerenciamento
        print("\n3. Verificando botão de gerenciamento...")
        try:
            manage_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Gerenciar')]")
            print("✅ Botão 'Gerenciar' encontrado")
            
            if manage_button.is_displayed():
                print("✅ Botão visível")
            else:
                print("❌ Botão não visível")
        except:
            print("❌ Botão 'Gerenciar' não encontrado")
        
        # 5. Tirar screenshot
        print("\n4. Tirando screenshot...")
        driver.save_screenshot("c:\\Vant\\frontend_credits_test.png")
        print("✅ Salvo: frontend_credits_test.png")
        
        print("\n" + "=" * 50)
        print("🎯 Teste Frontend Concluído!")
        print("   Verifique o screenshot para validação visual")
        
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
    finally:
        if 'driver' in locals():
            driver.quit()
            print("🔚 Chrome fechado")

if __name__ == "__main__":
    test_frontend_credits()
