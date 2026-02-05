class SpeechService {
  private static instance: SpeechService;
  private isInitialized = false;
  
  static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }
  
  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }
      
      // Cancelar qualquer fala anterior
      this.stop();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;  // Um pouco mais lento para clareza
      utterance.pitch = 1;   // Tom normal
      utterance.volume = 0.8; // Volume moderado
      
      utterance.onend = () => {
        console.log('[SpeechService] Fala concluída');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('[SpeechService] Erro na fala:', event.error);
        reject(event.error);
      };
      
      utterance.onstart = () => {
        console.log('[SpeechService] Iniciando fala');
      };
      
      speechSynthesis.speak(utterance);
    });
  }
  
  stop(): void {
    if (this.isSupported()) {
      speechSynthesis.cancel();
      console.log('[SpeechService] Fala cancelada');
    }
  }
  
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
  
  // Método para obter vozes disponíveis (útil para debugging)
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return speechSynthesis.getVoices();
  }
  
  // Verificar se há voz em português
  hasPortugueseVoice(): boolean {
    const voices = this.getVoices();
    return voices.some(voice => voice.lang.startsWith('pt'));
  }
}

export default SpeechService;
