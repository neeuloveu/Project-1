// ==UserScript==
// @name         Full System (Fixed & Optimized)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Developed by neeuloveu - Fixed Target Clicks & Precise Countdown Sync
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  /* ── guard: skip iframes ── */
  if (window.top !== window.self) return;
  if (location.hostname.includes("hcaptcha")) return;

  /* ================================================================
     SHARED CONFIG
     ================================================================ */

  const STATUS_ICON =
    "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/IMG_1198.jpeg";

  const DISCORD_WEBHOOK = "webhook"; // ← paste your webhook URL here
  const DISCORD_USER_ID = "";       // ← paste your Discord user ID here

  const HOME_URL = "https://moneytask.top/app/tasks/link-rut-gon";

  /* ================================================================
     SHARED STATE
     ================================================================ */

  let lastStatus       = "";
  let nevScanTime      = 0;

  // Cooldown flags for global page states
  let nevClickedContinue  = false;
  let nevClickedLinkGoc   = false;

  // Task counter (persisted)
  let successTask = parseInt(localStorage.getItem("nev_success") || "0");

  /* ================================================================
     UTILITY: visibility check
     ================================================================ */

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    if (el.offsetWidth < 1 || el.offsetHeight < 1) return false;
    return true;
  }

  /* ================================================================
     UTILITY: safe click with event cascade & clickable element routing
     ================================================================ */

  function safeClick(el) {
    if (!el) return;
    if (!isVisible(el)) return;
    
    // Route target to closest clickable wrapper to bypass mobile navigation blocks
    const target = el.closest("a") || el.closest("button") || el;
    
    try {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      target.dispatchEvent(new PointerEvent("pointerup",   { bubbles: true, cancelable: true }));
      target.click();
      target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    } catch (e) {
      console.warn("[NEV] safeClick error:", e);
    }
  }

  /* ================================================================
     UTILITY: random human-like delay (ms)
     ================================================================ */

  function randomDelay() {
    const pool = [4800, 5200, 5700, 6100, 6800];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ================================================================
     STATUS BAR  (mobile-responsive, no overlap)
     ================================================================ */

  function createStatusBar() {
    if (document.getElementById("nevStatus")) return;

    const bar = document.createElement("div");
    bar.id = "nevStatus";

    Object.assign(bar.style, {
      position:        "fixed",
      bottom:          "env(safe-area-inset-bottom, 12px)",
      left:            "50%",
      transform:       "translateX(-50%)",
      zIndex:          "2147483647",
      background:      "rgba(14,14,18,0.94)",
      color:           "#e8e8f0",
      padding:         "8px 16px 10px",
      borderRadius:    "18px",
      fontSize:        "clamp(11px, 3vw, 13px)",
      fontFamily:      "'Courier New', Courier, monospace",
      boxShadow:       "0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      textAlign:       "center",
      gap:             "6px",
      maxWidth:        "min(340px, 90vw)",
      width:           "max-content",
      pointerEvents:   "none",
      transition:      "opacity 0.25s ease",
      backdropFilter:  "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      border:          "1px solid rgba(255,255,255,0.08)",
    });

    const img = document.createElement("img");
    img.src = STATUS_ICON;
    Object.assign(img.style, {
      width:        "44px",
      height:       "44px",
      borderRadius: "50%",
      objectFit:    "cover",
      boxShadow:    "0 0 8px rgba(100,180,255,0.4)",
      flexShrink:   "0",
    });

    const text = document.createElement("span");
    text.id = "nevStatusText";
    Object.assign(text.style, {
      whiteSpace:   "nowrap",
      overflow:     "hidden",
      textOverflow: "ellipsis",
      maxWidth:     "100%",
      opacity:      "0.92",
      letterSpacing:"0.3px",
    });

    bar.appendChild(img);
    bar.appendChild(text);

    const tryInsert = () => {
      if (document.body) {
        document.body.appendChild(bar);
      } else {
        document.addEventListener("DOMContentLoaded", () => document.body.appendChild(bar));
      }
    };
    tryInsert();
  }

  function showStatus(msg) {
    try {
      createStatusBar();
      msg = String(msg).replace(/\s+/g, " ").trim();
      if (msg.length > 80) msg = msg.slice(0, 80) + "…";
      if (msg === lastStatus) return;
      lastStatus = msg;
      const span = document.getElementById("nevStatusText");
      if (span) span.textContent = msg;
    } catch (e) { /* silent */ }
  }

  /* ================================================================
     DISCORD WEBHOOKS
     ================================================================ */

  function saveCounter() {
    try { localStorage.setItem("nev_success", String(successTask)); } catch (_) {}
  }

  function _postWebhook(payload) {
    if (!DISCORD_WEBHOOK || DISCORD_WEBHOOK === "webhook") return;
    fetch(DISCORD_WEBHOOK, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    }).catch(err => console.warn("[NEV] Webhook error:", err));
  }

  function sendWebhook() {
    successTask++;
    saveCounter();
    _postWebhook({
      content:    "<@" + DISCORD_USER_ID + ">",
      username:   "neeuloveu",
      avatar_url: STATUS_ICON,
      embeds: [{
        title:       "neeuloveu - tool",
        description: "Đã hoàn thành 1 task",
        fields: [{
          name:  "📊 Thống kê",
          value: "✅ Task hoàn thành: **" + successTask + "**",
        }],
        color:     5763719,
        footer:    { text: "neeuloveu System" },
        timestamp: new Date().toISOString(),
      }],
    });
  }

  function sendErrorWebhook() {
    _postWebhook({
      content:    "<@" + DISCORD_USER_ID + ">",
      username:   "neeuloveu Tool",
      avatar_url: STATUS_ICON,
      embeds: [{
        title:  "❌ Link lỗi",
        fields: [
          { name: "Domain lỗi", value: "`" + (location.hostname || "unknown") + "`", inline: true },
          { name: "URL",        value: "`" + (location.href     || "unknown") + "`" },
        ],
        color:     15158332,
        footer:    { text: "neeuloveu System" },
        timestamp: new Date().toISOString(),
      }],
    });
  }

  function sendCampErrorWebhook() {
    _postWebhook({
      content:    "<@" + DISCORD_USER_ID + "> ⚠️ **Phát hiện lỗi giới hạn Camp!**",
      username:   "neeuloveu Tool",
      avatar_url: STATUS_ICON,
      embeds: [{
        title:       "⚠️ Lỗi Giới Hạn Camp",
        description: "Mỗi thiết bị chỉ được phép vượt 1 Camp 1 lần duy nhất trong 24h. Hệ thống đang tự động quay về Home.",
        fields: [
          { name: "Domain lỗi", value: "`" + (location.hostname || "unknown") + "`", inline: true },
          { name: "URL",        value: "`" + (location.href     || "unknown") + "`" },
        ],
        color:     16753920,
        footer:    { text: "neeuloveu System" },
        timestamp: new Date().toISOString(),
      }],
    });
  }

  /* ================================================================
     SCRIPT 1 : UNLOCK CAPTCHA SYSTEM
     ================================================================ */

  (function script1() {

    function simulateHuman() {
      try {
        window.scrollTo({ top: Math.random() * 300, behavior: "smooth" });
        window.focus();
      } catch (_) {}
    }

    function detectError404() {
      try {
        const body = (document.body?.innerText || "").toUpperCase();
        if (document.title.includes("404") || body.includes("NOT FOUND") || body.includes("KHÔNG TÌM THẤY")) {
          showStatus("Error 404 → Quay về task");
          sendErrorWebhook();
          setTimeout(() => { location.href = HOME_URL; }, 1200);
          return true;
        }
      } catch (_) {}
      return false;
    }

    function detectCampError() {
      try {
        const body = (document.body?.innerText || "").toUpperCase();
        if (body.includes("1 CAMP 1 LẦN DUY NHẤT TRONG 24H") || body.includes("CHỈ ĐƯỢC PHÉP VƯỢT 1 CAMP")) {
          showStatus("Lỗi Camp → Quay về task");
          sendCampErrorWebhook();
          setTimeout(() => { location.href = HOME_URL; }, 3000);
          return true;
        }
      } catch (_) {}
      return false;
    }

    function unlockButton() {
      try {
        const el = document.getElementById("invisibleCaptchaShortlink");
        if (el && el.hasAttribute("disabled")) {
          const delay = randomDelay();
          showStatus("Đang bypass hcaptcha...");
          setTimeout(() => {
            el.removeAttribute("disabled");
            showStatus("Đã bypass hcaptcha");
            setTimeout(() => { clickContinueButton(); }, 1200);
          }, delay);
        }
      } catch (e) {
        console.warn("[NEV] unlockButton error:", e);
      }
    }

    function clickContinueButton() {
      if (nevClickedContinue) return;
      try {
        document.querySelectorAll("a,button").forEach(btn => {
          if (nevClickedContinue) return;
          const text = (btn.innerText || "").trim().toUpperCase();
          if (!text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")) return;
          if (!isVisible(btn)) return;
          nevClickedContinue = true;
          showStatus("Đã mở captcha → chuẩn bị tiếp tục");
          setTimeout(() => {
            showStatus("Đang sang bước tiếp");
            safeClick(btn);
          }, 1000);
        });
      } catch (e) {
        console.warn("[NEV] clickContinueButton error:", e);
      }
    }

    function detectLinkGoc() {
      try {
        document.querySelectorAll("a,button").forEach(btn => {
          const text = (btn.innerText || "").trim().toUpperCase();

          if (text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC") && !nevClickedContinue) {
            const href = btn.getAttribute("href");
            if (!href || href === "#" || href.includes("javascript")) return;
            if (!isVisible(btn)) return;
            nevClickedContinue = true;
            showStatus("Continue step");
            setTimeout(() => { safeClick(btn); }, 1800);
          }

          if (text.includes("LINK GỐC") && !nevClickedLinkGoc) {
            const href = btn.getAttribute ? btn.getAttribute("href") : btn.href;
            if (!href || href === "#") return;
            if (!isVisible(btn)) return;
            nevClickedLinkGoc = true;
            showStatus("Đã tìm thấy Link Gốc");
            setTimeout(() => { safeClick(btn); }, 1500);
          }
        });
      } catch (e) {
        console.warn("[NEV] detectLinkGoc error:", e);
      }
    }

    function checkLinkGocOrReturn() {
      setTimeout(() => {
        try {
          let foundLinkGoc  = false;
          let foundContinue = false;
          document.querySelectorAll("a,button").forEach(el => {
            const text = (el.innerText || "").toUpperCase();
            if (text.includes("LINK GỐC"))                 foundLinkGoc  = true;
            if (text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")) foundContinue = true;
          });
          if (foundContinue) return;
          if (!foundLinkGoc) {
            showStatus("Không có Link Gốc → về task");
            setTimeout(() => { location.href = HOME_URL; }, 1200);
          }
        } catch (e) {
          console.warn("[NEV] checkLinkGocOrReturn error:", e);
        }
      }, 5000);
    }

    setTimeout(simulateHuman, 1500);

    setInterval(() => {
      try {
        detectError404();
        detectCampError();
      } catch (_) {}
    }, 2000);

    setInterval(() => {
      try { unlockButton(); } catch (_) {}
    }, 1500);

    if (location.hostname === "uptolink.one" && location.pathname.startsWith("/finish")) {
      setInterval(() => {
        try { detectLinkGoc(); } catch (_) {}
      }, 1200);
      checkLinkGocOrReturn();
    }

  })();

  /* ================================================================
     SCRIPT 2 : AUTO STEP + REDIRECT SYSTEM
     ================================================================ */

  (async function script2() {

    const MAP_URL =
      "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/redirectMap.json?" +
      Date.now();

    function handleGoogleRedirect() {
      try {
        const params = new URLSearchParams(window.location.search);
        const target = params.get("q");
        if (!target) return;
        try {
          showStatus("Đã tìm thấy trang: " + new URL(target).hostname);
        } catch (_) {
          showStatus("Redirect…");
        }
        setTimeout(() => { location.href = target; }, 400);
      } catch (e) {
        console.warn("[NEV] handleGoogleRedirect error:", e);
      }
    }

    async function loadMap() {
      try {
        const res = await fetch(MAP_URL, { cache: "no-store" });
        return await res.json();
      } catch (e) {
        console.warn("[NEV] map load error:", e);
        return null;
      }
    }

    function autoScrollPage() {
      if (location.hostname.includes("maxtask.net") || location.hostname.includes("uptolink.one")) return;
      if (window.__nevScrolled) return;
      window.__nevScrolled = true;

      try {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
        showStatus("Đã quét trang");
        nevScanTime = Date.now();
      } catch (_) {}
    }

    function clickButtons() {
      try {
        document.querySelectorAll("a,button,.btn,div,span").forEach(el => {
          if (!isVisible(el)) return;
          if (el.dataset.nevClicked === "true") return;

          const text = (el.innerText || "").trim().toUpperCase();

          /* ── Step 1 / 2 / 3 ── */
          if (text === "STEP 1" || text === "STEP 2" || text === "STEP 3" ||
              text.includes("STEP 1") || text.includes("STEP 2") || text.includes("STEP 3")) {
            
            el.dataset.nevClicked = "true";
            showStatus(text.slice(0, 40));
            nevScanTime = 0;
            safeClick(el);
            setTimeout(() => { el.dataset.nevClicked = "false"; }, 4000);
          }

          /* ── "Nhấn để tiếp tục" (Continue) ── */
          if (text.includes("NHẤN ĐỂ TIẾP TỤC")) {
            el.dataset.nevClicked = "true";
            showStatus("Continue step");
            nevScanTime = 0;
            setTimeout(() => {
              safeClick(el);
              setTimeout(() => { el.dataset.nevClicked = "false"; }, 5000);
            }, 1000);
          }

          /* ── "Nhấn link bất kỳ để tiếp tục" → reload ── */
          if ((text.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") ||
               text.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")) && !window.__nevReload) {
            window.__nevReload = true;
            showStatus("Reload page để sang step kế");
            nevScanTime = 0;
            setTimeout(() => { location.href = location.href; }, 800);
          }
        });
      } catch (e) {
        console.warn("[NEV] clickButtons error:", e);
      }
    }

    function focusWaitingText() {
      try {
        const elements = document.querySelectorAll("div,span,p,b,strong,font");
        for (const el of elements) {
          // Skip massive text containers to avoid false-matching static ad promotion text numbers
          if (el.innerText.length > 150) continue;

          const raw  = (el.innerText || "").trim();
          const text = raw.toUpperCase();
          
          if (!text.includes("VUI LÒNG ĐỢI") && !text.includes("CHỜ TRONG") && !text.includes("WAIT") && !text.includes("GIÂY")) continue;
          if (!isVisible(el)) continue;

          // Target digits explicitly attached to a time format or keyword sequence
          let sec = null;
          const timeUnitMatch = raw.match(/(\d+)\s*(?:giây|s|sec|second)/i);
          if (timeUnitMatch) {
            sec = parseInt(timeUnitMatch[1]);
          } else {
            const keywordMatch = raw.match(/(?:đợi|chờ|wait|trong|còn)\s*(\d+)/i);
            if (keywordMatch) {
              sec = parseInt(keywordMatch[1]);
            }
          }

          if (sec === null || isNaN(sec) || sec < 1 || sec > 90) continue;

          showStatus("Đợi lấy mã: " + sec + "s");
          nevScanTime = 0;

          const rect = el.getBoundingClientRect();
          window.scrollTo({
            top: rect.top + window.pageYOffset - 120,
            behavior: "smooth",
          });
          return;
        }
      } catch (_) {}
    }

    function handleReloadGuard() {
      try {
        const body = (document.body?.innerText || "").toUpperCase();
        if (body.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") || body.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")) {
          const KEY = "reloadCount";
          const c   = parseInt(sessionStorage.getItem(KEY) || "0");
          if (c < 2) {
            sessionStorage.setItem(KEY, String(c + 1));
            showStatus("Reloading page");
            nevScanTime = 0;
            location.href = location.href;
          }
        }
      } catch (_) {}
    }

    function startAuto() {
      autoScrollPage();
      clickButtons();
      focusWaitingText();

      setInterval(() => {
        try { clickButtons(); } catch (_) {}
      }, 1500);

      setInterval(() => {
        try { handleReloadGuard(); } catch (_) {}
      }, 1500);

      setInterval(() => {
        try { focusWaitingText(); } catch (_) {}
      }, 400);
    }

    if (location.hostname.includes("google.com") && location.pathname === "/url") {
      setTimeout(handleGoogleRedirect, 800);
    }

    const config = await loadMap();
    if (config && config.enabled) {
      const map  = config.redirects || {};
      const path = location.pathname.split("/").filter(Boolean)[0];
      if (path && map[path]) {
        console.log("[NEV] Redirect →", map[path]);
        setTimeout(() => {
          location.href = "https://www.google.com/url?q=" + encodeURIComponent("https://" + map[path]);
        }, 1200);
        return;
      }
    }

    setTimeout(startAuto, 3000);

  })();

  /* ================================================================
     SCRIPT 3 : MAXTASK HOLD-VERIFY
     ================================================================ */

  (function script3() {

    if (!location.hostname.includes("moneytask.top")) return;
    if (!location.pathname.startsWith("/app/tasks/link-rut-gon")) return;

    let verifyDone    = false;
    let pageEnterTime = Date.now();
    let stableCount   = 0;

    function holdVerify(el) {
      if (verifyDone) return;
      verifyDone = true;

      showStatus("Chuẩn bị xác minh...");

      setTimeout(() => {
        try {
          showStatus("Đang giữ xác minh...");

          const rect = el.getBoundingClientRect();
          const x    = rect.left + rect.width  / 2;
          const y    = rect.top  + rect.height / 2;

          const touch = new Touch({
            identifier: Date.now(),
            target:     el,
            clientX:    x, clientY: y,
            radiusX: 2, radiusY: 2,
          });

          el.dispatchEvent(new TouchEvent("touchstart", {
            bubbles: true, cancelable: true,
            touches: [touch], targetTouches: [touch], changedTouches: [touch],
          }));

          setTimeout(() => {
            try {
              el.dispatchEvent(new TouchEvent("touchend", {
                bubbles: true, cancelable: true,
                touches: [], changedTouches: [touch],
              }));
              showStatus("Verify hoàn tất");
              sendWebhook();
              setTimeout(() => {
                showStatus("Quay về danh sách task");
                location.href = HOME_URL;
              }, 4000);
            } catch (e) {
              console.warn("[NEV] touchend error:", e);
            }
          }, 6000);

        } catch (e) {
          console.warn("[NEV] holdVerify error:", e);
          verifyDone = false;
        }
      }, 1000);
    }

    function detectVerify() {
      if (verifyDone) return;
      if (Date.now() - pageEnterTime < 2000) return;

      try {
        const body = (document.body?.innerText || "").toLowerCase();
        if (!body.includes("giữ vào biểu tượng") && !body.includes("xác thực")) return;

        const el = document.querySelector("canvas, svg");
        if (!el) return;
        if (el.offsetWidth < 80 || el.offsetHeight < 80) return;

        el.scrollIntoView({ block: "center", behavior: "smooth" });

        stableCount++;
        if (stableCount < 3) return;

        holdVerify(el);
      } catch (e) {
        console.warn("[NEV] detectVerify error:", e);
      }
    }

    setInterval(() => {
      try { detectVerify(); } catch (_) {}
    }, 1200);

  })();

  /* ================================================================
     SCAN FAILSAFE
     ================================================================ */

  setInterval(() => {
    try {
      if (!nevScanTime) return;
      if (Date.now() - nevScanTime > 7000) {
        showStatus("Không mã → quay về task");
        sendErrorWebhook();
        nevScanTime = 0;
        setTimeout(() => { location.href = HOME_URL; }, 1200);
      }
    } catch (_) {}
  }, 2000);

  /* ================================================================
     INIT
     ================================================================ */

  showStatus("Neei - Tool v3.2");

})();
