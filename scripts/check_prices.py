import stripe, os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env.local'))
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

ids = [
    'price_1SvoER2VONQto1dcdi5VHNpM',
    'price_1StFWM2VONQto1dcSLmwZVnp',
    'price_1StFU92VONQto1dcSToDDzAJ',
]
for pid in ids:
    p = stripe.Price.retrieve(pid)
    amt = p.unit_amount / 100
    typ = "recurring" if p.recurring else "one_time"
    nick = p.nickname or ""
    print(f"{pid}  R${amt:.2f} {p.currency} {typ} {nick}")
