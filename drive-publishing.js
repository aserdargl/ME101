(function (root) {
  let client, connecting;
  function storage() {
    client ||= new root.GoogleDriveStorage({ baseUrl: root.MEE101_APPROVAL_URL, getIdToken: () => root.FirebaseStudents.getIdToken() });
    return client;
  }

  /** Links only the already authenticated instructor to the configured Drive app. */
  async function connect() {
    if (connecting) return connecting;
    const popup = root.open("about:blank", "mee101-drive-link");
    if (!popup) throw new Error("Google bağlantısı için bu sitede açılır pencerelere izin verin.");
    const service = storage();
    const origin = new URL(service.baseUrl).origin;
    const requestId = Array.from(root.crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
    connecting = new Promise((resolve, reject) => {
      const clean = () => { root.clearInterval(timer); root.removeEventListener("message", receive); connecting = null; };
      const receive = async event => {
        if (event.source !== popup || event.origin !== origin || event.data?.type !== "mee101-drive" || event.data.requestId !== requestId) return;
        clean();
        if (!event.data.ok) return reject(new Error(event.data.error || "Drive bağlantısı tamamlanamadı."));
        try { await service.session(); resolve({ ok: true }); }
        catch (error) { reject(error); }
      };
      const deadline = Date.now() + 600000;
      const timer = root.setInterval(() => {
        if (popup.closed || Date.now() > deadline) { clean(); reject(new Error("Drive bağlantısı iptal edildi veya süresi doldu.")); }
      }, 1000);
      root.addEventListener("message", receive);
      service.service("connect", { requestId }).then(result => { popup.location.href = result.url; }).catch(error => { clean(); popup.close(); reject(error); });
    });
    return connecting;
  }

  root.DrivePublishing = {
    enabled: () => root.MEE101_DRIVE_ENABLED === true,
    connect,
    prepare: async (lectures, onProgress) => {
      const service = storage();
      await service.session();
      const backup = await service.backup(lectures, onProgress);
      const document = await service.externalize(lectures, onProgress);
      return { lectures: document, backup };
    },
    logout: () => { if (client) client.access = null; }
  };
})(window);
