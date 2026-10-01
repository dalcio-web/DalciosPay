
export const keepAliveService = {
  async ping() {
    try {
      const lastPing = localStorage.getItem('supabase_last_ping');
      const now = new Date().getTime();
      
      // Ping only once every 12 hours from the client side to avoid spamming
      if (lastPing && (now - parseInt(lastPing)) < 12 * 60 * 60 * 1000) {
        return;
      }

      console.log("[Keep-alive] Verificando atividade do banco de dados...");
      const response = await fetch('/api/keep-alive');
      if (response.ok) {
        localStorage.setItem('supabase_last_ping', now.toString());
        console.log("[Keep-alive] Banco de dados ativo.");
      }
    } catch (error) {
      console.error("[Keep-alive] Erro ao enviar ping de atividade:", error);
    }
  }
};
