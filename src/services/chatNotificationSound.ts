/**
 * Chat Notification Sound Service
 *
 * Gerencia reprodução de sons de notificação para mensagens de chat em tempo real.
 *
 * Características:
 * - Lightweight: Usa Web Audio API para performance otimizada
 * - Non-blocking: Carregamento assíncrono sem travamentos
 * - Smart: Não toca para mensagens próprias, apenas recebidas
 * - Configurable: Suporta volume e ativação/desativação
 * - Cross-tab: Funciona mesmo com app em background
 */

class ChatNotificationSoundService {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private enabled: boolean = true;
  private loading: boolean = false;
  private loadError: Error | null = null;
  private volume: number = 0.5; // Volume padrão: 50%
  private lastPlayTime: number = 0;
  private MIN_INTERVAL_MS = 300; // Mínimo 300ms entre sons (anti-spam)

  constructor() {
    // Lazy initialization - only creates AudioContext when first needed
    this.initializeAudioContext();
  }

  /**
   * Inicializa o AudioContext
   * Usa lazy loading para evitar warnings de autoplay
   */
  private initializeAudioContext(): void {
    if (typeof window === 'undefined') return;

    try {
      // Cria AudioContext apenas quando necessário
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('[ChatNotificationSound] Web Audio API not supported');
        return;
      }

      // Não cria ainda - será criado no primeiro play() via user interaction
      // Isso evita warnings de autoplay policy
    } catch (error) {
      console.error('[ChatNotificationSound] Failed to check AudioContext support:', error);
    }
  }

  /**
   * Garante que o AudioContext está criado e ativo
   */
  private async ensureAudioContext(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }

      // Resume context se estiver suspended (autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      return this.audioContext.state === 'running';
    } catch (error) {
      console.error('[ChatNotificationSound] Failed to ensure AudioContext:', error);
      return false;
    }
  }

  /**
   * Carrega o arquivo de áudio
   * Usa um tom sintético gerado via Web Audio API para não depender de arquivo externo
   */
  private async loadAudioBuffer(): Promise<void> {
    if (this.audioBuffer || this.loading) return;
    if (this.loadError) throw this.loadError;

    this.loading = true;

    try {
      const contextReady = await this.ensureAudioContext();
      if (!contextReady || !this.audioContext) {
        throw new Error('AudioContext not available');
      }

      // Gera um tom de notificação sintético
      // Vantagens: Sem dependência de arquivo, leve, instantâneo
      const sampleRate = this.audioContext.sampleRate;
      const duration = 0.15; // 150ms - curto e discreto
      const bufferSize = sampleRate * duration;

      this.audioBuffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
      const channelData = this.audioBuffer.getChannelData(0);

      // Gera um tom duplo suave (frequências 800Hz e 1000Hz)
      // Som agradável e não estridente
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-5 * t); // Decay exponencial
        const tone1 = Math.sin(2 * Math.PI * 800 * t); // 800Hz
        const tone2 = Math.sin(2 * Math.PI * 1000 * t); // 1000Hz
        channelData[i] = (tone1 * 0.3 + tone2 * 0.2) * envelope;
      }

      this.loading = false;
      console.log('[ChatNotificationSound] Audio buffer generated successfully');
    } catch (error) {
      this.loading = false;
      this.loadError = error as Error;
      console.error('[ChatNotificationSound] Failed to generate audio buffer:', error);
      throw error;
    }
  }

  /**
   * Reproduz o som de notificação
   *
   * @param force - Se true, ignora throttling (para testes)
   * @returns Promise que resolve quando o som termina de tocar
   */
  async play(force: boolean = false): Promise<void> {
    // Verificações de pré-condição
    if (!this.enabled && !force) {
      console.log('[ChatNotificationSound] Sound disabled, skipping');
      return;
    }

    // Anti-spam: Evita múltiplos sons em sequência rápida
    const now = Date.now();
    if (!force && now - this.lastPlayTime < this.MIN_INTERVAL_MS) {
      console.log('[ChatNotificationSound] Throttled - too soon after last play');
      return;
    }

    try {
      // Garante que o áudio está carregado
      if (!this.audioBuffer) {
        await this.loadAudioBuffer();
      }

      const contextReady = await this.ensureAudioContext();
      if (!contextReady || !this.audioContext || !this.audioBuffer) {
        console.warn('[ChatNotificationSound] Cannot play - AudioContext or buffer not ready');
        return;
      }

      // Cria source e gain nodes
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.audioBuffer;
      gainNode.gain.value = this.volume;

      // Conecta: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Reproduz
      source.start(0);
      this.lastPlayTime = now;

      console.log('[ChatNotificationSound] Notification sound played');
    } catch (error) {
      console.error('[ChatNotificationSound] Failed to play notification sound:', error);
      // Não propaga erro - falha silenciosa
    }
  }

  /**
   * Ativa/desativa notificações sonoras
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[ChatNotificationSound] Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Verifica se o som está ativado
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Define o volume (0.0 a 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`[ChatNotificationSound] Volume set to ${(this.volume * 100).toFixed(0)}%`);
  }

  /**
   * Obtém o volume atual
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Pré-carrega o áudio (opcional, para primeira mensagem)
   */
  async preload(): Promise<void> {
    try {
      await this.loadAudioBuffer();
    } catch (error) {
      // Falha silenciosa - não é crítico
      console.warn('[ChatNotificationSound] Preload failed:', error);
    }
  }

  /**
   * Limpa recursos (cleanup)
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch((error) => {
        console.error('[ChatNotificationSound] Failed to close AudioContext:', error);
      });
    }
    this.audioContext = null;
    this.audioBuffer = null;
    this.loadError = null;
    console.log('[ChatNotificationSound] Disposed');
  }
}

// Singleton instance
export const chatNotificationSound = new ChatNotificationSoundService();

// Export class para testes
export default ChatNotificationSoundService;
