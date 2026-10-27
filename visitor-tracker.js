(() => {
  "use strict";

  // Replace this with the URL printed by `npx wrangler deploy`.
  const WORKER_URL = "https://portfolio-crm-api.khawajasaim0.workers.dev";
  const CONSENT_KEY = "portfolio_crm_analytics_consent_v1";
  const VISITOR_KEY = "portfolio_crm_visitor_id_v1";
  const allowedEvents = new Set([
    "page_view", "scroll_50", "scroll_90", "active_120s", "outbound_click"
  ]);

  if (WORKER_URL.includes("REPLACE-WITH-YOUR-WORKER")) {
    console.warn("[Portfolio CRM] Set WORKER_URL in visitor-tracker.js before enabling.");
    return;
  }

  const safeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };

  function newId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }

  function getVisitorId() {
    let id = safeStorage.get(VISITOR_KEY);
    if (!id || !/^[a-f0-9-]{20,64}$/i.test(id)) {
      id = newId();
      safeStorage.set(VISITOR_KEY, id);
    }
    return id;
  }

  function addConsentBanner() {
    if (document.getElementById("portfolio-crm-consent")) return;
    const box = document.createElement("aside");
    box.id = "portfolio-crm-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Analytics preference");
    box.style.cssText = [
      "position:fixed","z-index:2147483647","left:16px","right:16px","bottom:16px",
      "max-width:680px","margin:0 auto","padding:16px","border-radius:14px",
      "background:#111827","color:#fff","font:14px/1.45 system-ui,sans-serif",
      "box-shadow:0 8px 30px #0005"
    ].join(";");
    const text = document.createElement("p");
    text.textContent = "Allow privacy-conscious analytics on this portfolio? We record page views, scroll depth and engagement time. No Gmail or LinkedIn identity is collected by this tracker.";
    text.style.margin = "0 0 12px";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
    const makeButton = (label, value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.cssText = "border:1px solid #9ca3af;border-radius:8px;padding:9px 13px;cursor:pointer;background:" + (value === "granted" ? "#fff;color:#111827" : "transparent;color:#fff");
      button.addEventListener("click", () => {
        safeStorage.set(CONSENT_KEY, value);
        box.remove();
        if (value === "granted") startTracking();
      });
      return button;
    };
    actions.append(makeButton("Accept analytics", "granted"));
    actions.append(makeButton("Decline", "denied"));
    box.append(text, actions);
    document.body.appendChild(box);
  }

  let started = false;
  function startTracking() {
    if (started) return;
    started = true;
    const visitorId = getVisitorId();
    const params = new URLSearchParams(location.search);
    const seen = new Set();
    const send = (eventName, eventData = {}) => {
      if (!allowedEvents.has(eventName)) return;
      const payload = {
        visitor_id: visitorId,
        event_name: eventName,
        page_path: location.pathname,
        referrer: document.referrer || null,
        event_data: eventData
      };
      fetch(`${WORKER_URL.replace(/\/$/, "")}/event`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    };

    send("page_view");

    let scrollTick = false;
    function checkScroll() {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        scrollTick = false;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) return;
        const depth = (window.scrollY / maxScroll) * 100;
        if (depth >= 50 && !seen.has("scroll_50")) {
          seen.add("scroll_50"); send("scroll_50");
        }
        if (depth >= 90 && !seen.has("scroll_90")) {
          seen.add("scroll_90"); send("scroll_90");
        }
      });
    }
    window.addEventListener("scroll", checkScroll, { passive: true });

    let visibleMs = 0;
    let lastTick = Date.now();
    let activeSent = false;
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (!document.hidden) visibleMs += Math.min(now - lastTick, 2000);
      lastTick = now;
      if (!activeSent && visibleMs >= 120000) {
        activeSent = true;
        send("active_120s");
        window.clearInterval(timer);
      }
    }, 1000);
    document.addEventListener("visibilitychange", () => { lastTick = Date.now(); });

    document.addEventListener("click", event => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      try {
        const target = new URL(anchor.href, location.href);
        if (target.origin !== location.origin) {
          send("outbound_click", { host: target.host });
        }
      } catch {}
    }, true);
  }

  const consent = safeStorage.get(CONSENT_KEY);
  if (consent === "granted") startTracking();
  else if (consent !== "denied") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", addConsentBanner, { once: true });
    } else addConsentBanner();
  }
})();
