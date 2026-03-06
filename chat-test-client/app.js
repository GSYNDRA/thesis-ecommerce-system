const el = {
  backendUrl: document.getElementById("backendUrl"),
  accessToken: document.getElementById("accessToken"),
  sessionUuid: document.getElementById("sessionUuid"),
  messageInput: document.getElementById("messageInput"),
  reasonInput: document.getElementById("reasonInput"),
  statusBox: document.getElementById("statusBox"),
  logBox: document.getElementById("logBox"),
  connectBtn: document.getElementById("connectBtn"),
  disconnectBtn: document.getElementById("disconnectBtn"),
  heartbeatBtn: document.getElementById("heartbeatBtn"),
  clearLogsBtn: document.getElementById("clearLogsBtn"),
  wsInitBtn: document.getElementById("wsInitBtn"),
  wsSendBtn: document.getElementById("wsSendBtn"),
  wsRequestHumanBtn: document.getElementById("wsRequestHumanBtn"),
  wsCloseBtn: document.getElementById("wsCloseBtn"),
  httpActiveBtn: document.getElementById("httpActiveBtn"),
  httpHistoryBtn: document.getElementById("httpHistoryBtn"),
  httpRequestHumanBtn: document.getElementById("httpRequestHumanBtn"),
  httpCloseBtn: document.getElementById("httpCloseBtn"),
  staffAvailableBtn: document.getElementById("staffAvailableBtn"),
  staffBusyBtn: document.getElementById("staffBusyBtn"),
  staffWorkloadBtn: document.getElementById("staffWorkloadBtn"),
};

const state = {
  socket: null,
  connected: false,
};

function now() {
  return new Date().toISOString();
}

function log(title, data = null) {
  const line = [`[${now()}] ${title}`];
  if (data !== null && data !== undefined) {
    try {
      line.push(JSON.stringify(data, null, 2));
    } catch {
      line.push(String(data));
    }
  }
  el.logBox.textContent += `${line.join("\n")}\n\n`;
  el.logBox.scrollTop = el.logBox.scrollHeight;
}

function setStatus(text, isError = false) {
  el.statusBox.textContent = `Socket status: ${text}`;
  el.statusBox.style.color = isError ? "#b91c1c" : "#111827";
}

function normalizeBearer(raw) {
  const token = String(raw || "").trim();
  if (!token) return "";
  if (token.toLowerCase().startsWith("bearer ")) return token;
  return `Bearer ${token}`;
}

function getBackendUrl() {
  const raw = String(el.backendUrl.value || "").trim();
  return raw.replace(/\/+$/, "");
}

function getSessionUuid() {
  return String(el.sessionUuid.value || "").trim();
}

function setSessionUuid(sessionUuid) {
  if (!sessionUuid) return;
  el.sessionUuid.value = sessionUuid;
}

function ensureSocketClientLoaded() {
  if (typeof window.io !== "function") {
    throw new Error(
      "socket.io client not loaded. Check <backend>/socket.io/socket.io.js URL.",
    );
  }
}

function connectSocket() {
  try {
    ensureSocketClientLoaded();

    if (state.socket) {
      state.socket.disconnect();
      state.socket = null;
      state.connected = false;
    }

    const backendUrl = getBackendUrl();
    const token = normalizeBearer(el.accessToken.value);
    if (!token) {
      throw new Error("Access token is required");
    }

    const socket = window.io(backendUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    state.socket = socket;

    socket.on("connect", () => {
      state.connected = true;
      setStatus(`connected (${socket.id})`);
      log("WS connect", { socketId: socket.id });
    });

    socket.on("disconnect", (reason) => {
      state.connected = false;
      setStatus(`disconnected (${reason})`, true);
      log("WS disconnect", { reason });
    });

    socket.on("connect_error", (error) => {
      state.connected = false;
      setStatus(`connect_error (${error.message})`, true);
      log("WS connect_error", { message: error.message, data: error.data });
    });

    [
      "ws:connected",
      "chat:initialized",
      "chat:new_message",
      "chat:ai_token",
      "chat:ai_message_complete",
      "chat:assigned",
      "chat:reassigning",
      "chat:closed",
      "staff:availability_updated",
    ].forEach((eventName) => {
      socket.on(eventName, (payload) => {
        log(`EVENT ${eventName}`, payload);
        if (eventName === "chat:initialized" && payload?.sessionUuid) {
          setSessionUuid(payload.sessionUuid);
        }
      });
    });
  } catch (error) {
    setStatus(error.message, true);
    log("connectSocket error", { message: error.message });
  }
}

function disconnectSocket() {
  if (!state.socket) return;
  state.socket.disconnect();
  state.socket = null;
  state.connected = false;
  setStatus("disconnected");
}

function emitWithAck(eventName, payload) {
  return new Promise((resolve) => {
    if (!state.socket || !state.connected) {
      log(`Cannot emit ${eventName}`, { reason: "socket is not connected" });
      resolve(null);
      return;
    }

    state.socket.emit(eventName, payload, (ack) => {
      log(`ACK ${eventName}`, ack);
      resolve(ack);
    });
  });
}

async function chatApi(path, method = "GET", body = null) {
  const backendUrl = getBackendUrl();
  const token = normalizeBearer(el.accessToken.value);

  if (!token) {
    throw new Error("Access token is required for HTTP call");
  }

  const requestOptions = {
    method,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  };

  if (body !== null && body !== undefined) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${backendUrl}/api/v1/chat${path}`, requestOptions);
  const raw = await response.text();
  let payload = raw;

  try {
    payload = JSON.parse(raw);
  } catch {
    // Keep raw string payload
  }

  log(`HTTP ${method} ${path} [${response.status}]`, payload);

  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }

  return payload;
}

el.connectBtn.addEventListener("click", connectSocket);
el.disconnectBtn.addEventListener("click", disconnectSocket);
el.clearLogsBtn.addEventListener("click", () => {
  el.logBox.textContent = "";
});
el.heartbeatBtn.addEventListener("click", async () => {
  await emitWithAck("ws:heartbeat", {});
});

el.wsInitBtn.addEventListener("click", async () => {
  const payload = {};
  const sessionUuid = getSessionUuid();
  if (sessionUuid) payload.sessionUuid = sessionUuid;
  await emitWithAck("chat:init", payload);
});

el.wsSendBtn.addEventListener("click", async () => {
  const sessionUuid = getSessionUuid();
  const content = String(el.messageInput.value || "").trim();
  if (!sessionUuid || !content) {
    log("chat:send blocked", { reason: "sessionUuid and content are required" });
    return;
  }

  await emitWithAck("chat:send", { sessionUuid, content });
});

el.wsRequestHumanBtn.addEventListener("click", async () => {
  const sessionUuid = getSessionUuid();
  if (!sessionUuid) {
    log("chat:request_human blocked", { reason: "sessionUuid is required" });
    return;
  }

  const reason = String(el.reasonInput.value || "").trim();
  await emitWithAck("chat:request_human", {
    sessionUuid,
    reason: reason || "Need human support",
  });
});

el.wsCloseBtn.addEventListener("click", async () => {
  const sessionUuid = getSessionUuid();
  if (!sessionUuid) {
    log("chat:close blocked", { reason: "sessionUuid is required" });
    return;
  }
  await emitWithAck("chat:close", { sessionUuid });
});

el.httpActiveBtn.addEventListener("click", async () => {
  try {
    const response = await chatApi("/session/active");
    const sessionUuid = response?.data?.session?.sessionUuid;
    setSessionUuid(sessionUuid);
  } catch (error) {
    log("HTTP session/active error", { message: error.message });
  }
});

el.httpHistoryBtn.addEventListener("click", async () => {
  try {
    const sessionUuid = getSessionUuid();
    if (!sessionUuid) {
      throw new Error("sessionUuid is required");
    }
    await chatApi(`/session/${sessionUuid}/history?limit=50&offset=0`);
  } catch (error) {
    log("HTTP history error", { message: error.message });
  }
});

el.httpRequestHumanBtn.addEventListener("click", async () => {
  try {
    const sessionUuid = getSessionUuid();
    if (!sessionUuid) {
      throw new Error("sessionUuid is required");
    }
    const reason = String(el.reasonInput.value || "").trim();
    await chatApi(`/session/${sessionUuid}/request-human`, "POST", {
      reason: reason || "Need human support",
    });
  } catch (error) {
    log("HTTP request-human error", { message: error.message });
  }
});

el.httpCloseBtn.addEventListener("click", async () => {
  try {
    const sessionUuid = getSessionUuid();
    if (!sessionUuid) {
      throw new Error("sessionUuid is required");
    }
    await chatApi(`/session/${sessionUuid}/close`, "POST");
  } catch (error) {
    log("HTTP close error", { message: error.message });
  }
});

el.staffAvailableBtn.addEventListener("click", async () => {
  try {
    await chatApi("/staff/availability", "POST", { isAvailable: true });
  } catch (error) {
    log("HTTP staff availability(true) error", { message: error.message });
  }
});

el.staffBusyBtn.addEventListener("click", async () => {
  try {
    await chatApi("/staff/availability", "POST", { isAvailable: false });
  } catch (error) {
    log("HTTP staff availability(false) error", { message: error.message });
  }
});

el.staffWorkloadBtn.addEventListener("click", async () => {
  try {
    await chatApi("/staff/workload?limit=20", "GET");
  } catch (error) {
    log("HTTP staff workload error", { message: error.message });
  }
});

log("Client loaded", {
  message: "Paste token, connect socket, then test events/endpoints.",
});

