(function (root) {
  /** Accepts login results only from the opened server window and its unique request. */
  class GitHubOAuthClient {
    constructor({ serverUrl, window: browser = root, crypto = root.crypto }) {
      this.serverUrl = serverUrl;
      this.window = browser;
      this.crypto = crypto;
      this.pending = false;
    }

    login() {
      if (this.pending) return Promise.reject(new Error("GitHub giriş penceresini tamamlayınız."));
      if (!this.serverUrl) return Promise.reject(new Error("GitHub giriş hizmeti yapılandırılmadı."));
      const target = new URL("github/start", this.serverUrl);
      const local = target.hostname === "127.0.0.1" && this.window.location.hostname === "127.0.0.1";
      if (target.protocol !== "https:" && !local) return Promise.reject(new Error("Güvenli GitHub giriş adresi gerekli."));
      const requestId = Array.from(this.crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
      target.searchParams.set("request_id", requestId);
      const popup = this.window.open(target.href, "lecturenotes-github");
      if (!popup) return Promise.reject(new Error("GitHub giriş penceresi engellendi. Bu site için açılır pencereye izin veriniz."));
      this.pending = true;
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          this.pending = false;
          this.window.removeEventListener("message", receive);
          this.window.clearInterval(poll);
          this.window.clearTimeout(timeout);
          popup.close();
        };
        const receive = event => {
          if (event.origin !== target.origin || event.source !== popup || event.data?.type !== "lecturenotes-github" || event.data.requestId !== requestId) return;
          cleanup();
          if (typeof event.data.token === "string" && /^ghu_[A-Za-z0-9_]+$/.test(event.data.token)) resolve(event.data.token);
          else reject(new Error(event.data.error || "GitHub girişi tamamlanamadı."));
        };
        this.window.addEventListener("message", receive);
        const poll = this.window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error("GitHub girişi tamamlanmadı. Yeniden deneyebilirsiniz.")); } }, 300);
        const timeout = this.window.setTimeout(() => { cleanup(); reject(new Error("GitHub giriş süresi doldu. Yeniden deneyiniz.")); }, 180000);
      });
    }
  }
  root.GitHubOAuthClient = GitHubOAuthClient;
  if (typeof module !== "undefined") module.exports = { GitHubOAuthClient };
})(typeof window !== "undefined" ? window : globalThis);
