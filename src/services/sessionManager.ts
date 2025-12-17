import { supabase } from './supabaseClient';

interface SessionConfig {
  maxIdleTime: number; // Tempo máximo de inatividade em ms (padrão: 3 minutos)
  maxSessionTime: number; // Tempo máximo da sessão em ms (padrão: 8 horas)
  checkInterval: number; // Intervalo de verificação em ms (padrão: 30 segundos)
}

const DEFAULT_CONFIG: SessionConfig = {
  maxIdleTime: 3 * 60 * 1000, // 3 minutos
  maxSessionTime: 8 * 60 * 60 * 1000, // 8 horas
  checkInterval: 30 * 1000 // 30 segundos
};

class SessionManager {
  private config: SessionConfig;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private onSessionExpired: (() => void) | null = null;
  private sessionStartTime: number | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Inicia o gerenciamento da sessão
   */
  start(onSessionExpired: () => void) {
    this.onSessionExpired = onSessionExpired;
    this.sessionStartTime = Date.now();
    this.startSessionCheck();
  }

  /**
   * Para o gerenciamento da sessão
   */
  stop() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    this.onSessionExpired = null;
    this.sessionStartTime = null;
  }

  /**
   * Reinicia a sessão (após reautenticação)
   */
  restart() {
    this.sessionStartTime = Date.now();
  }

  /**
   * Verifica periodicamente se a sessão está válida
   */
  private startSessionCheck() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    this.checkIntervalId = setInterval(async () => {
      await this.checkSession();
    }, this.config.checkInterval);
  }

  /**
   * Verifica se a sessão está válida
   */
  private async checkSession() {
    try {
      // Verifica se a sessão ainda existe no Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // Sessão expirada ou inválida
        this.handleSessionExpired();
        return;
      }

      // Verifica se a sessão ultrapassou o tempo máximo
      if (this.sessionStartTime) {
        const sessionDuration = Date.now() - this.sessionStartTime;
        if (sessionDuration > this.config.maxSessionTime) {
          console.log('Sessão expirada por tempo máximo');
          this.handleSessionExpired();
          return;
        }
      }

      // Verifica se o token está próximo de expirar (menos de 5 minutos)
      if (session.expires_at) {
        const expiresIn = (session.expires_at * 1000) - Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (expiresIn < fiveMinutes && expiresIn > 0) {
          // Tenta renovar o token automaticamente
          console.log('Renovando token da sessão...');
          await this.refreshSession();
        } else if (expiresIn <= 0) {
          console.log('Token expirado');
          this.handleSessionExpired();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    }
  }

  /**
   * Renova a sessão do Supabase
   */
  private async refreshSession() {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Erro ao renovar sessão:', error);
        this.handleSessionExpired();
      } else {
        console.log('Sessão renovada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao renovar sessão:', error);
    }
  }

  /**
   * Trata a expiração da sessão
   */
  private handleSessionExpired() {
    this.stop();
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  /**
   * Força a expiração da sessão
   */
  forceExpire() {
    this.handleSessionExpired();
  }

  /**
   * Verifica se a sessão está ativa
   */
  isActive(): boolean {
    return this.checkIntervalId !== null && this.sessionStartTime !== null;
  }

  /**
   * Obtém o tempo de sessão atual
   */
  getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Date.now() - this.sessionStartTime;
  }
}

// Instância singleton
export const sessionManager = new SessionManager();
