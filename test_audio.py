import wave
import numpy as np

# Criar um arquivo WAV simples para teste
sample_rate = 44100
duration = 2  # segundos
frequency = 440  # Hz (nota A)

# Gerar onda senoidal
t = np.linspace(0, duration, int(sample_rate * duration))
wave_data = np.sin(2 * np.pi * frequency * t)

# Converter para int16
wave_data = (wave_data * 32767).astype(np.int16)

# Salvar como WAV
with wave.open('test_audio.wav', 'w') as wav_file:
    wav_file.setnchannels(1)  # mono
    wav_file.setsampwidth(2)   # 16-bit
    wav_file.setframerate(sample_rate)
    wav_file.writeframes(wave_data.tobytes())

print("Arquivo test_audio.wav criado com sucesso!")
