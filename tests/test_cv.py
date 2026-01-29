from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

# Criar um PDF de teste em memória
buffer = io.BytesIO()
p = canvas.Canvas(buffer, pagesize=letter)

# Conteúdo do CV de teste
p.setFont("Helvetica-Bold", 16)
p.drawString(100, 750, "JOÃO SILVA")
p.setFont("Helvetica", 12)
p.drawString(100, 730, "Desenvolvedor Senior")

p.drawString(100, 700, "RESUMO")
p.setFont("Helvetica", 10)
p.drawString(100, 680, "Desenvolvedor com 5 anos de experiência em Python e JavaScript.")

p.drawString(100, 650, "EXPERIÊNCIA")
p.drawString(100, 630, "Tech Company - Desenvolvedor Senior (2020-2024)")
p.drawString(100, 610, "- Desenvolvimento de APIs REST")
p.drawString(100, 590, "- Integração com bancos de dados")
p.drawString(100, 570, "- Code review e mentoring")

p.drawString(100, 540, "SKILLS")
p.drawString(100, 520, "Python, JavaScript, React, Node.js, PostgreSQL, MongoDB")

p.drawString(100, 490, "EDUCAÇÃO")
p.drawString(100, 470, "Universidade Federal - Ciência da Computação (2015-2020)")

p.save()

# Salvar o PDF
buffer.seek(0)
with open("c:/Users/RodrigoVerruck/OneDrive - AdviceHealth/Documentos/Vant/test_cv.pdf", "wb") as f:
    f.write(buffer.read())

print("PDF de teste criado com sucesso!")
