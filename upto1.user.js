// ==UserScript==
// @name         Full System (Fixed v3.0)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Developed by Neei - Fixed & Optimized
// @match        *://*/*
// @grant        none
// ==/UserScript==

/* ================================================= */
/*  GLOBAL CONFIG + SHARED STATE                     */
/* ================================================= */

const STATUS_ICON = "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/IMG_1198.jpeg";
const DISCORD_WEBHOOK = ""; // ← dán webhook vào đây
const DISCORD_USER_ID = "";

/* ── shared flags ── */
let lastStatus       = "";
let nevScanTime      = 0;
let nevClickedContinue = false;
let nevClickedLinkGoc  = false;

/* task counter */
let successTask = parseInt(localStorage.getItem("nev_success") || "0", 10);

/* ================================================= */
/*  UTILITY — SAFE WRAPPER                           */
/* ================================================= */

/**
 * Wrap any function in try/catch so one error can't
 * crash the whole script.
 */
function safe(fn, label) {
  try { fn(); }
  catch (e) { console.warn("[Nev] " + (label || "err"), e); }
}

/* ================================================= */
/*  STATUS BAR — MOBILE-FRIENDLY UI                  */
/* ================================================= */

function createStatusBar() {
  if (window.top !== window.self) return;
  if (location.hostname.includes("hcaptcha")) return;
  if (document.getElementById("nevStatus")) return;

  const bar = document.createElement("div");
  bar.id = "nevStatus";

  /* ── layout ── */
  Object.assign(bar.style, {
    position:      "fixed",
    bottom:        "16px",
    left:          "50%",
    transform:     "translateX(-50%)",
    zIndex:        "2147483647",         // max z-index
    display:       "flex",
    flexDirection: "column",
    alignItems:    "center",
    textAlign:     "center",

    /* ── visual ── */
    background:    "rgba(15,15,15,0.93)",
    color:         "#fff",
    padding:       "10px 16px",
    borderRadius:  "16px",
    fontSize:      "12px",
    fontFamily:    "'SF Mono', 'Fira Mono', monospace",
    boxShadow:     "0 8px 24px rgba(0,0,0,0.45)",
    backdropFilter:"blur(8px)",
    border:        "1px solid rgba(255,255,255,0.08)",

    /* ── mobile safe area ── */
    maxWidth:      "calc(100vw - 32px)",
    minWidth:      "160px",
    pointerEvents: "none",              // don't block taps underneath
  });

  const img = document.createElement("img");
  img.src    = STATUS_ICON;
  img.width  = 44;
  img.height = 44;
  Object.assign(img.style, {
    borderRadius: "50%",
    objectFit:    "cover",
    marginBottom: "6px",
    boxShadow:    "0 0 8px rgba(0,0,0,0.6)",
    flexShrink:   "0",
  });

  const text = document.createElement("span");
  text.id = "nevStatusText";
  Object.assign(text.style, {
    whiteSpace:  "nowrap",
    overflow:    "hidden",
    textOverflow:"ellipsis",
    maxWidth:    "200px",
    opacity:     "0.92",
    lineHeight:  "1.4",
  });

  bar.appendChild(img);
  bar.appendChild(text);
  document.body.appendChild(bar);
}

function showStatus(text) {
  safe(() => {
    createStatusBar();
    if (text === lastStatus) return;
    lastStatus = text;
    text = String(text).replace(/\s+/g, " ").trim();
    if (text.length > 80) text = text.substring(0, 80) + "…";
    const span = document.getElementById("nevStatusText");
    if (span) span.textContent = text;
  }, "showStatus");
}

/* ================================================= */
/*  DISCORD WEBHOOKS                                 */
/* ================================================= */

function saveCounter() {
  localStorage.setItem("nev_success", String(successTask));
}

function sendWebhook() {
  if (!DISCORD_WEBHOOK) return;
  successTask++;
  saveCounter();
  fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "<@" + DISCORD_USER_ID + ">",
      username: "neeuloveu",
      avatar_url: STATUS_ICON,
      embeds: [{
        title: "neeuloveu - tool",
        description: "Đã hoàn thành 1 task",
        fields: [{ name: "📊 Thống kê", value: "✅ Task hoàn thành: **" + successTask + "**" }],
        color: 5763719,
        footer: { text: "neeuloveu System" },
        timestamp: new Date().toISOString()
      }]
    })
  }).catch(() => {});
}

function sendErrorWebhook() {
  if (!DISCORD_WEBHOOK) return;
  const domain = location.hostname || "unknown";
  const url    = location.href    || "unknown";
  fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "<@" + DISCORD_USER_ID + ">",
      username: "neeuloveu Tool",
      avatar_url: STATUS_ICON,
      embeds: [{
        title: "❌ Link lỗi",
        fields: [
          { name: "Domain lỗi", value: "`" + domain + "`", inline: true },
          { name: "URL",        value: "`" + url    + "`" }
        ],
        color: 15158332,
        footer: { text: "neeuloveu System" },
        timestamp: new Date().toISOString()
      }]
    })
  }).catch(e => console.warn("[Nev] error webhook:", e));
}

function sendCampErrorWebhook() {
  if (!DISCORD_WEBHOOK) return;
  const domain = location.hostname || "unknown";
  const url    = location.href    || "unknown";
  fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "<@" + DISCORD_USER_ID + "> ⚠️ **Phát hiện lỗi giới hạn Camp!**",
      username: "neeuloveu Tool",
      avatar_url: STATUS_ICON,
      embeds: [{
        title: "⚠️ Lỗi Giới Hạn Camp",
        description: "Mỗi thiết bị chỉ được phép vượt 1 Camp 1 lần duy nhất trong 24h.",
        fields: [
          { name: "Domain lỗi", value: "`" + domain + "`", inline: true },
          { name: "URL",        value: "`" + url    + "`" }
        ],
        color: 16753920,
        footer: { text: "neeuloveu System" },
        timestamp: new Date().toISOString()
      }]
    })
  }).catch(e => console.warn("[Nev] camp webhook:", e));
}

/* ================================================= */
/*  SCRIPT 1 — UNLOCK / CAPTCHA BYPASS               */
/* ================================================= */

(function script1() {
  "use strict";

  if (window.top !== window.self) return;

  showStatus("Neei - Tool");

  /* ── helpers ── */

  function randomDelay() {
    const times = [5000, 6000, 7000];
    return times[Math.floor(Math.random() * times.length)];
  }

  function simulateHuman() {
    window.scrollTo({ top: Math.random() * 300, behavior: "smooth" });
    window.focus();
  }

  /* ── unlock disabled captcha button ──
     FIX: was accidentally commented out with broken nested comment.
     Now properly restored as a real function.
  */
  function unlockButton() {
    const element = document.getElementById("invisibleCaptchaShortlink");
    if (element && element.hasAttribute("disabled")) {
      const delay = randomDelay();
      showStatus("Đang bypass hcaptcha...");
      setTimeout(() => {
        element.removeAttribute("disabled");
        showStatus("Đã bypass hcaptcha");
        setTimeout(() => {
          clickContinueButton();
        }, 1200);
      }, delay);
    }
  }

  /* ── click "BẤM VÀO ĐÂY ĐỂ TIẾP TỤC" button ── */
  function clickContinueButton() {
    if (nevClickedContinue) return;
    const buttons = document.querySelectorAll("a, button");
    buttons.forEach(btn => {
      const text = (btn.innerText || "").trim().toUpperCase();
      if (text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")) {
        nevClickedContinue = true;
        showStatus("Đã mở captcha → chuẩn bị tiếp tục");
        setTimeout(() => {
          showStatus("Đang sang bước tiếp");
          btn.click();
        }, 1000);
      }
    });
  }

  /* ── detect "LINK GỐC" or "BẤM VÀO ĐÂY ĐỂ TIẾP TỤC" ──
     FIX: was defined inside IIFE but called outside → ReferenceError.
     Now defined inside IIFE and used only here.
  */
  function detectLinkGoc() {
    safe(() => {
      const buttons = document.querySelectorAll("a, button");
      buttons.forEach(btn => {
        /* visibility guard — don't click hidden elements */
        if (btn.offsetParent === null) return;
        if (btn.offsetWidth < 1 || btn.offsetHeight < 1) return;

        const text = (btn.innerText || "").trim().toUpperCase();

        /* CONTINUE */
        if (text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC") && !nevClickedContinue) {
          const href = btn.getAttribute("href");
          if (!href || href === "#" || href.includes("javascript")) return;
          nevClickedContinue = true;
          showStatus("Continue step");
          setTimeout(() => { btn.click(); }, 1800);
        }

        /* LINK GỐC */
        if (text.includes("LINK GỐC") && !nevClickedLinkGoc) {
          if (!btn.href || btn.href === "#") return;
          nevClickedLinkGoc = true;
          showStatus("Đã tìm thấy Link Gốc");
          setTimeout(() => { btn.click(); }, 1500);
        }
      });
    }, "detectLinkGoc");
  }

  /* ── check link gốc or return to task ── */
  function checkLinkGocOrReturn() {
    safe(() => {
      setTimeout(() => {
        let foundLinkGoc  = false;
        let foundContinue = false;

        document.querySelectorAll("a, button").forEach(el => {
          const text = (el.innerText || "").toUpperCase();
          if (text.includes("LINK GỐC")) foundLinkGoc = true;
          if (text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")) foundContinue = true;
        });

        if (foundContinue) return;   // still processing, don't bail

        if (!foundLinkGoc) {
          showStatus("Không có Link Gốc → về task");
          setTimeout(() => {
            location.href = "https://moneytask.top/app/tasks/link-rut-gon";
          }, 1200);
        }
      }, 5000);
    }, "checkLinkGocOrReturn");
  }

  /* ── 404 error detect ── */
  function detectError404() {
    const body = (document.body.innerText || "").toUpperCase();
    if (
      document.title.includes("404") ||
      body.includes("NOT FOUND") ||
      body.includes("KHÔNG TÌM THẤY")
    ) {
      showStatus("Error 404 → Quay về task");
      sendErrorWebhook();   // FIX: sendErrorWebhook now in global scope, accessible here
      setTimeout(() => {
        location.href = "https://moneytask.top/app/tasks/link-rut-gon";
      }, 1200);
      return true;
    }
    return false;
  }

  /* ── camp error detect ── */
  function detectCampError() {
    const body = (document.body.innerText || "").toUpperCase();
    if (
      body.includes("1 CAMP 1 LẦN DUY NHẤT TRONG 24H") ||
      body.includes("CHỈ ĐƯỢC PHÉP VƯỢT 1 CAMP")
    ) {
      showStatus("Lỗi Camp → Quay về task");
      sendCampErrorWebhook();  // FIX: now in global scope
      setTimeout(() => {
        location.href = "https://moneytask.top/app/tasks/link-rut-gon";
      }, 3000);
      return true;
    }
    return false;
  }

  /* ── start ── */

  setTimeout(simulateHuman, 1500);

  /* error polling */
  setInterval(() => {
    safe(() => {
      detectError404();
      detectCampError();
    }, "errorPoll");
  }, 2000);

  /* unlock captcha button polling */
  setInterval(() => {
    safe(unlockButton, "unlockPoll");
  }, 1500);

  /* ── uptolink finish page ──
     FIX: detectLinkGoc / checkLinkGocOrReturn are now in THIS IIFE scope.
     They run ONCE here (conditionally) — removed the duplicate global calls below.
  */
  if (
    location.hostname === "uptolink.one" &&
    location.pathname.startsWith("/finish")
  ) {
    setInterval(() => {
      safe(detectLinkGoc, "linkGocPoll");
    }, 1200);

    checkLinkGocOrReturn();
  }

  /* ── general link-goc detect for other pages ──
     Runs on every page (not just uptolink) but is separate from the
     uptolink-specific interval above so there's no duplication.
  */
  if (!(location.hostname === "uptolink.one" && location.pathname.startsWith("/finish"))) {
    setInterval(() => {
      safe(detectLinkGoc, "linkGocGeneral");
    }, 1200);

    checkLinkGocOrReturn();
  }

})(); // end Script 1

/* ================================================= */
/*  SCRIPT 2 — AUTO STEP + REDIRECT SYSTEM           */
/* ================================================= */

(async function script2() {
  "use strict";

  /* ── config ── */
  const MAP_URL =
    "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/redirectMap.json?" +
    Date.now();

  /* ── google redirect handler ── */
  function handleGoogleRedirect() {
    safe(() => {
      const params = new URLSearchParams(window.location.search);
      const target = params.get("q");
      if (target) {
        try {
          const domain = new URL(target).hostname;
          showStatus("Đã tìm thấy trang: " + domain);
        } catch {
          showStatus("Redirect…");
        }
        setTimeout(() => { location.href = target; }, 400);
      }
    }, "googleRedirect");
  }

  /* ── load redirect map ── */
  async function loadMap() {
    try {
      const res = await fetch(MAP_URL, { cache: "no-store" });
      return await res.json();
    } catch (e) {
      console.warn("[Nev] map load error", e);
      return null;
    }
  }

  /* ── safe click with visibility guard ──
     FIX: added visibility + cooldown guard to prevent double/spam clicks.
  */
  const _clickedEls = new WeakSet();

  function safeClick(el) {
    if (!el) return;
    if (_clickedEls.has(el)) return;          // cooldown: already clicked
    if (el.offsetParent === null) return;     // hidden element guard
    if (el.offsetWidth < 1 || el.offsetHeight < 1) return;

    _clickedEls.add(el);
    setTimeout(() => { _clickedEls.delete(el); }, 3000); // 3s cooldown

    try {
      el.click();
      el.dispatchEvent(new MouseEvent("click",       { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerdown",{ bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerup",  { bubbles: true }));
    } catch (e) {
      console.warn("[Nev] click fail", e);
    }
  }

  /* ── scroll page once ── */
  function autoScrollPage() {
    if (
      location.hostname.includes("maxtask.net") ||
      location.hostname.includes("uptolink.one")
    ) return;

    if (window.__nevScrolled) return;
    window.__nevScrolled = true;

    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
    showStatus("Đã quét trang");
    nevScanTime = Date.now();
  }

  /* ── step / continue buttons ──
     FIX: added per-text cooldown flags to prevent spam clicks.
  */
  const _stepClicked = {};   // key: button text → timestamp

  function clickButtons() {
    safe(() => {
      const now = Date.now();
      const elements = document.querySelectorAll("a,button,.btn,div,span");

      elements.forEach(el => {
        /* visibility guards */
        if (el.offsetParent === null) return;
        if (el.offsetWidth < 4 || el.offsetHeight < 4) return;

        const text = (el.innerText || "").trim().toUpperCase();
        if (!text) return;

        /* ── STEP 1 / 2 / 3 ── */
        if (
          text.includes("STEP 1") ||
          text.includes("STEP 2") ||
          text.includes("STEP 3")
        ) {
          /* cooldown: don't re-click same step text within 4s */
          if (_stepClicked[text] && (now - _stepClicked[text]) < 4000) return;
          _stepClicked[text] = now;

          showStatus(text);
          nevScanTime = 0;
          el.scrollIntoView({ block: "center" });
          safeClick(el);
        }

        /* ── NHẤN ĐỂ TIẾP TỤC (continue) ── */
        if (text.includes("NHẤN ĐỂ TIẾP TỤC")) {
          if (_stepClicked["CONTINUE"] && (now - _stepClicked["CONTINUE"]) < 5000) return;
          _stepClicked["CONTINUE"] = now;

          showStatus("Continue step");
          nevScanTime = 0;
          el.scrollIntoView({ block: "center" });
          setTimeout(() => { safeClick(el); }, 2000);
        }

        /* ── NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC (reload) ── */
        if (
          text.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") ||
          text.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")
        ) {
          if (!window.__nevReload) {
            window.__nevReload = true;
            showStatus("Reload page để sang step kế");
            nevScanTime = 0;
            setTimeout(() => { location.href = location.href; }, 800);
          }
        }
      });
    }, "clickButtons");
  }

  /* ── countdown text tracker ── */
  let lastCountdown = null;

  function focusWaitingText() {
    safe(() => {
      const elements = document.querySelectorAll("div, span, p");
      for (const el of elements) {
        const raw  = (el.innerText || "").trim();
        const text = raw.toUpperCase();

        if (!text.includes("VUI LÒNG ĐỢI TRONG")) continue;
        if (el.offsetHeight < 10 || el.offsetWidth < 10) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top < 50 || rect.top > window.innerHeight - 50) continue;

        const secMatch = raw.match(/\d+/);
        if (!secMatch) continue;
        const sec = parseInt(secMatch[0], 10);
        if (sec < 1 || sec > 80) continue;
        if (lastCountdown !== null && sec >= lastCountdown) continue;

        lastCountdown = sec;
        showStatus("Đợi lấy mã: " + sec + "s");
        nevScanTime = 0;

        const absoluteTop = rect.top + window.pageYOffset;
        window.scrollTo({ top: absoluteTop - 120, behavior: "smooth" });
        return;
      }
    }, "focusWaitingText");
  }

  /* ── reload loop for stuck "NHẤN LINK BẤT KỲ" pages ── */
  function startAuto() {
    const reloadKey = "reloadCount";

    autoScrollPage();
    clickButtons();
    focusWaitingText();

    /* STEP / CLICK LOOP */
    setInterval(() => {
      safe(clickButtons, "clickLoop");
    }, 1500);

    /* reload detect */
    setInterval(() => {
      safe(() => {
        const body = (document.body.innerText || "").toUpperCase();
        if (
          body.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") ||
          body.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")
        ) {
          let c = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
          if (c < 2) {
            sessionStorage.setItem(reloadKey, String(c + 1));
            showStatus("Reloading page");
            nevScanTime = 0;
            location.href = location.href;
          }
        }
      }, "reloadDetect");
    }, 1500);

    /* countdown display */
    setInterval(() => {
      safe(focusWaitingText, "countdownLoop");
    }, 400);
  }

  /* ── google check ── */
  if (location.hostname.includes("google.com") && location.pathname === "/url") {
    setTimeout(handleGoogleRedirect, 800);
  }

  /* ── redirect map ── */
  const config = await loadMap();

  if (config && config.enabled) {
    const map  = config.redirects;
    const path = location.pathname.split("/").filter(Boolean)[0];
    console.log("[Nev] Detected key:", path);

    if (path && map[path]) {
      const target = map[path];
      console.log("[Nev] Redirect target:", target);
      setTimeout(() => {
        location.href =
          "https://www.google.com/url?q=" + encodeURIComponent("https://" + target);
      }, 1200);
      return;  // stop Script 2 here — redirect will handle the rest
    }
  }

  /* ── start automation after 3s ── */
  setTimeout(() => {
    safe(startAuto, "startAuto");
  }, 3000);

})(); // end Script 2

/* ================================================= */
/*  SCRIPT 3 — MAXTASK AUTO HOLD VERIFY              */
/* ================================================= */

(function script3() {
  "use strict";

  if (!location.hostname.includes("moneytask.top")) return;
  /* FIX: original code was missing leading slash → pathname never matched */
  if (!location.pathname.startsWith("/app/tasks/link-rut-gon")) return;

  let verifyDone   = false;
  let pageEnterTime = Date.now();
  let stableCount  = 0;

  function holdVerify(el) {
    if (verifyDone) return;
    verifyDone = true;

    showStatus("Chuẩn bị xác minh...");

    setTimeout(() => {
      showStatus("Đang giữ xác minh...");

      const rect = el.getBoundingClientRect();
      const x    = rect.left + rect.width  / 2;
      const y    = rect.top  + rect.height / 2;

      let touch;
      try {
        touch = new Touch({
          identifier: Date.now(),
          target: el,
          clientX: x, clientY: y,
          radiusX: 2, radiusY: 2
        });
      } catch (e) {
        /* Touch constructor not supported on this browser (desktop) */
        console.warn("[Nev] Touch not supported:", e);
        showStatus("Touch không được hỗ trợ");
        verifyDone = false;
        return;
      }

      el.dispatchEvent(new TouchEvent("touchstart", {
        bubbles: true, cancelable: true,
        touches: [touch], targetTouches: [touch], changedTouches: [touch]
      }));

      /* hold 6s then release */
      setTimeout(() => {
        el.dispatchEvent(new TouchEvent("touchend", {
          bubbles: true, cancelable: true,
          touches: [], changedTouches: [touch]
        }));

        showStatus("Verify hoàn tất");
        sendWebhook();

        setTimeout(() => {
          showStatus("Quay về danh sách task");
          location.href = "https://moneytask.top/app/tasks/link-rut-gon";
        }, 4000);

      }, 6000);

    }, 1000);
  }

  function detectVerify() {
    if (verifyDone) return;
    if (Date.now() - pageEnterTime < 2000) return;

    const body = (document.body.innerText || "").toLowerCase();
    if (!body.includes("giữ vào biểu tượng") && !body.includes("xác thực")) return;

    const el = document.querySelector("canvas, svg");
    if (!el) return;
    if (el.offsetWidth < 80 || el.offsetHeight < 80) return;

    el.scrollIntoView({ block: "center", behavior: "smooth" });

    stableCount++;
    if (stableCount < 3) return;

    holdVerify(el);
  }

  setInterval(() => {
    safe(detectVerify, "verifyLoop");
  }, 1200);

})(); // end Script 3

/* ================================================= */
/*  SCAN FAILSAFE — BACK HOME IF STUCK               */
/* ================================================= */

setInterval(() => {
  safe(() => {
    if (!nevScanTime) return;
    if (Date.now() - nevScanTime > 7000) {
      showStatus("Không mã → quay về task");
      sendErrorWebhook();
      nevScanTime = 0;  // reset before redirect to avoid loop
      setTimeout(() => {
        location.href = "https://moneytask.top/app/tasks/link-rut-gon";
      }, 1200);
    }
  }, "failsafe");
}, 2000);
