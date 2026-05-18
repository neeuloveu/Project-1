// ==UserScript==
// @name         Full System (Fixed v4.0)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Developed by Neei - Fixed & New UI
// @match        *://*/*
// @grant        none
// ==/UserScript==

/* ═══════════════════════════════════════════════════════════
   GLOBAL CONFIG + SHARED STATE
   ═══════════════════════════════════════════════════════════ */

const STATUS_ICON    = "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/IMG_1198.jpeg";
const DISCORD_WEBHOOK  = "";   // ← dán webhook Discord vào đây
const DISCORD_USER_ID  = "";   // ← dán user ID vào đây

/* ── shared flags ── */
let lastStatus         = "";
let nevScanTime        = 0;
// FIX: was "true" in original → flags never triggered
let nevClickedContinue = false;
let nevClickedLinkGoc  = false;

/* ── task counter ── */
let successTask = parseInt(localStorage.getItem("nev_success") || "0", 10);

/* ── step UI state ── */
let uiStep        = 0;   // 0=idle 1/2/3=step 4=done
let countdownMax  = null;

/* ═══════════════════════════════════════════════════════════
   UTILITY — SAFE WRAPPER
   ═══════════════════════════════════════════════════════════ */

function safe(fn, label) {
  try { fn(); }
  catch (e) { console.warn("[Nev] " + (label || "?"), e); }
}

/* ═══════════════════════════════════════════════════════════
   UI PANEL — UptoTool dark-green glassmorphism style
   ═══════════════════════════════════════════════════════════ */

const _CSS = `
/* ── reset / host ── */
#nevPanel *{box-sizing:border-box;margin:0;padding:0;}

/* ── panel ── */
#nevPanel{
  position:fixed;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  z-index:2147483647;
  width:292px;
  max-width:calc(100vw - 24px);
  background:linear-gradient(160deg,rgba(8,24,14,0.97) 0%,rgba(4,14,8,0.99) 100%);
  border:1px solid rgba(0,220,90,0.22);
  border-radius:20px;
  box-shadow:0 0 0 1px rgba(0,255,110,0.05),0 10px 40px rgba(0,0,0,0.75),inset 0 1px 0 rgba(0,255,100,0.07);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  font-family:-apple-system,'SF Pro Display','Segoe UI',sans-serif;
  color:#e0ffe8;
  overflow:hidden;
  -webkit-user-select:none;
  user-select:none;
  transition:opacity .25s ease,transform .25s ease;
}
#nevPanel.nev-hide{
  opacity:0;
  pointer-events:none;
  transform:translateX(-50%) translateY(12px);
}

/* top glow line */
#nevPanel::before{
  content:'';
  display:block;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(0,255,100,0.45),transparent);
}

/* ── header ── */
#nevHeader{
  display:flex;
  align-items:center;
  gap:9px;
  padding:11px 13px 9px;
  position:relative;
}
#nevAvatar{
  width:36px;height:36px;
  border-radius:50%;
  object-fit:cover;
  border:1.5px solid rgba(0,255,100,0.32);
  flex-shrink:0;
  box-shadow:0 0 12px rgba(0,220,90,0.28);
}
#nevTitle{
  flex:1;
  font-size:13.5px;
  font-weight:700;
  color:#00e676;
  letter-spacing:.3px;
  text-shadow:0 0 14px rgba(0,230,110,0.45);
}
#nevBadge{
  background:rgba(0,230,110,0.12);
  border:1px solid rgba(0,230,110,0.22);
  border-radius:99px;
  color:#00e676;
  font-size:10px;
  font-weight:700;
  padding:2px 8px;
  letter-spacing:.3px;
  flex-shrink:0;
}
#nevClose{
  width:22px;height:22px;
  border-radius:50%;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.1);
  color:rgba(255,255,255,0.4);
  font-size:11px;
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  transition:background .2s,color .2s;
}
#nevClose:active{background:rgba(255,60,60,0.2);color:#ff6b6b;}

/* ── divider ── */
.nevLine{
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(0,200,80,0.15),transparent);
  margin:0 13px;
}

/* ── steps row ── */
#nevSteps{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  padding:10px 13px 8px;
}
.nev-step{
  display:flex;
  align-items:center;
  gap:5px;
  font-size:11.5px;
  font-weight:600;
  color:rgba(255,255,255,0.28);
  transition:color .3s;
}
.nev-dot{
  width:30px;height:30px;
  border-radius:9px;
  background:rgba(255,255,255,0.05);
  border:1.5px solid rgba(255,255,255,0.1);
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;
  transition:all .3s ease;
  flex-shrink:0;
}
/* active */
.nev-step.nev-active{color:#00e676;}
.nev-step.nev-active .nev-dot{
  background:rgba(0,230,110,0.16);
  border-color:rgba(0,230,110,0.55);
  color:#00e676;
  box-shadow:0 0 0 0 rgba(0,230,110,0.5);
  animation:nevPulse 1.6s infinite;
}
/* done */
.nev-step.nev-done{color:rgba(0,230,110,0.5);}
.nev-step.nev-done .nev-dot{
  background:rgba(0,180,70,0.1);
  border-color:rgba(0,180,70,0.28);
  color:rgba(0,230,110,0.55);
}
/* arrow */
.nev-arrow{
  color:rgba(255,255,255,0.14);
  font-size:11px;
  flex-shrink:0;
  transition:color .3s;
}
.nev-arrow.nev-lit{color:rgba(0,230,110,0.38);}

/* pulse */
@keyframes nevPulse{
  0%  {box-shadow:0 0 0 0   rgba(0,230,110,.5);}
  70% {box-shadow:0 0 0 7px rgba(0,230,110,0);}
  100%{box-shadow:0 0 0 0   rgba(0,230,110,0);}
}

/* ── countdown ── */
#nevCdArea{padding:8px 13px 4px;text-align:center;}
#nevCdLabel{
  font-size:10.5px;
  color:rgba(255,255,255,0.32);
  text-transform:uppercase;
  letter-spacing:.6px;
  margin-bottom:3px;
}
#nevCdNum{
  font-size:28px;
  font-weight:800;
  color:#00e676;
  line-height:1;
  text-shadow:0 0 22px rgba(0,230,110,0.55);
  letter-spacing:-1px;
  min-height:32px;
  transition:color .3s;
}
#nevCdNum.nev-urgent{color:#ff6b35;text-shadow:0 0 18px rgba(255,107,53,0.55);}
#nevBar{
  height:4px;
  background:rgba(255,255,255,0.07);
  border-radius:99px;
  margin:8px 0 6px;
  overflow:hidden;
}
#nevFill{
  height:100%;
  width:0%;
  border-radius:99px;
  background:linear-gradient(90deg,#009944 0%,#00e676 50%,#009944 100%);
  background-size:200% auto;
  transition:width .9s linear;
  box-shadow:0 0 8px rgba(0,230,110,0.4);
  animation:nevShimmer 2s linear infinite;
}
@keyframes nevShimmer{
  0%  {background-position:-200% center;}
  100%{background-position: 200% center;}
}

/* ── status ── */
#nevStatusArea{padding:8px 13px 12px;}
#nevStatusText{
  display:block;
  width:100%;
  background:rgba(0,230,110,0.07);
  border:1px solid rgba(0,230,110,0.18);
  border-radius:10px;
  color:#b0ffc8;
  font-size:11.5px;
  font-family:'SF Mono','Fira Mono',monospace;
  padding:8px 10px;
  text-align:center;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  line-height:1.35;
  letter-spacing:.15px;
  transition:background .3s,color .3s,border-color .3s;
}
#nevStatusText.nev-err{
  background:rgba(255,50,50,0.09);
  border-color:rgba(255,80,80,0.28);
  color:#ff9090;
}
#nevStatusText.nev-ok{
  background:rgba(0,230,110,0.14);
  border-color:rgba(0,230,110,0.38);
  color:#00e676;
}
`;

/* ── inject once ── */
function injectCSS() {
  if (document.getElementById("nevCSS")) return;
  const s = document.createElement("style");
  s.id = "nevCSS";
  s.textContent = _CSS;
  (document.head || document.documentElement).appendChild(s);
}

/* ── build panel DOM ── */
function createPanel() {
  if (window.top !== window.self) return;
  if (location.hostname.includes("hcaptcha")) return;
  if (document.getElementById("nevPanel")) return;

  injectCSS();

  const p = document.createElement("div");
  p.id = "nevPanel";
  p.innerHTML = `
    <div id="nevHeader">
      <img id="nevAvatar" src="${STATUS_ICON}" alt="">
      <span id="nevTitle">Neei - Tool</span>
      <span id="nevBadge">✅ ${successTask}</span>
      <div id="nevClose">✕</div>
    </div>
    <div class="nevLine"></div>
    <div id="nevSteps">
      <div class="nev-step" id="nevS1"><div class="nev-dot">1</div><span>Step 1</span></div>
      <div class="nev-arrow" id="nevA1">›</div>
      <div class="nev-step" id="nevS2"><div class="nev-dot">2</div><span>Step 2</span></div>
      <div class="nev-arrow" id="nevA2">›</div>
      <div class="nev-step" id="nevS3"><div class="nev-dot">3</div><span>Step 3</span></div>
    </div>
    <div class="nevLine"></div>
    <div id="nevCdArea">
      <div id="nevCdLabel">Vui lòng đợi</div>
      <div id="nevCdNum">—</div>
      <div id="nevBar"><div id="nevFill"></div></div>
    </div>
    <div class="nevLine"></div>
    <div id="nevStatusArea"><span id="nevStatusText">Đang khởi động...</span></div>
  `;
  document.body.appendChild(p);

  document.getElementById("nevClose").addEventListener("click", () => {
    p.classList.add("nev-hide");
  });
}

/* ── public: update status text ── */
function showStatus(text) {
  safe(() => {
    createPanel();
    if (text === lastStatus) return;
    lastStatus = text;
    text = String(text).replace(/\s+/g, " ").trim();
    if (text.length > 60) text = text.substring(0, 60) + "…";
    const el = document.getElementById("nevStatusText");
    if (!el) return;
    const u = text.toUpperCase();
    el.className = "";
    if (u.includes("LỖI") || u.includes("ERROR") || u.includes("KHÔNG") || u.includes("VỀ TASK")) {
      el.classList.add("nev-err");
    } else if (u.includes("HOÀN TẤT") || u.includes("XONG") || u.includes("✓") || u.includes("✅")) {
      el.classList.add("nev-ok");
    }
    el.textContent = text;
  }, "showStatus");
}

/* ── public: highlight step dot ── */
function setUIStep(n) {
  safe(() => {
    uiStep = n;
    createPanel();
    for (let i = 1; i <= 3; i++) {
      const dot = document.getElementById("nevS" + i);
      const arr = document.getElementById("nevA" + i);
      if (!dot) continue;
      dot.className = "nev-step";
      if (n === i)    dot.classList.add("nev-active");
      else if (n > i) dot.classList.add("nev-done");
      if (arr) arr.className = "nev-arrow" + (n > i ? " nev-lit" : "");
    }
  }, "setUIStep");
}

/* ── public: update countdown ── */
function setUICountdown(sec, max) {
  safe(() => {
    createPanel();
    const num  = document.getElementById("nevCdNum");
    const fill = document.getElementById("nevFill");
    if (!num || !fill) return;
    if (sec <= 0) {
      num.textContent = "—";
      num.className   = "";
      fill.style.width = "100%";
      return;
    }
    num.textContent = sec + " Giây";
    num.className   = sec <= 5 ? "nev-urgent" : "";
    if (max > 0) fill.style.width = Math.round(((max - sec) / max) * 100) + "%";
  }, "setUICountdown");
}

/* ── public: update badge counter ── */
function updateBadge() {
  safe(() => {
    const el = document.getElementById("nevBadge");
    if (el) el.textContent = "✅ " + successTask;
  }, "updateBadge");
}

/* ═══════════════════════════════════════════════════════════
   DISCORD WEBHOOKS
   (FIX: moved to global scope — both Script 1 and Script 3
    need these; they were trapped inside Script 2's IIFE before)
   ═══════════════════════════════════════════════════════════ */

function saveCounter() { localStorage.setItem("nev_success", String(successTask)); }

function sendWebhook() {
  if (!DISCORD_WEBHOOK) return;
  successTask++;
  saveCounter();
  updateBadge();
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
          { name: "Domain", value: "`" + (location.hostname || "?") + "`", inline: true },
          { name: "URL",    value: "`" + (location.href    || "?") + "`" }
        ],
        color: 15158332,
        footer: { text: "neeuloveu System" },
        timestamp: new Date().toISOString()
      }]
    })
  }).catch(e => console.warn("[Nev] errWebhook", e));
}

function sendCampErrorWebhook() {
  if (!DISCORD_WEBHOOK) return;
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
          { name: "Domain", value: "`" + (location.hostname || "?") + "`", inline: true },
          { name: "URL",    value: "`" + (location.href    || "?") + "`" }
        ],
        color: 16753920,
        footer: { text: "neeuloveu System" },
        timestamp: new Date().toISOString()
      }]
    })
  }).catch(e => console.warn("[Nev] campWebhook", e));
}

/* ═══════════════════════════════════════════════════════════
   SCRIPT 1 — UNLOCK / CAPTCHA BYPASS
   ═══════════════════════════════════════════════════════════ */

(function script1() {
  "use strict";

  if (window.top !== window.self) return;

  showStatus("Neei - Tool");

  /* ── helpers ── */
  function randomDelay() {
    return [5000, 6000, 7000][Math.floor(Math.random() * 3)];
  }

  function simulateHuman() {
    window.scrollTo({ top: Math.random() * 300, behavior: "smooth" });
    window.focus();
  }

  /* ── unlock captcha button ──
     FIX: original had broken nested comment /*function ... /* → entire
     function was dead code. Now restored as a normal function.          */
  function unlockButton() {
    const el = document.getElementById("invisibleCaptchaShortlink");
    if (el && el.hasAttribute("disabled")) {
      showStatus("Đang bypass hcaptcha...");
      setTimeout(() => {
        el.removeAttribute("disabled");
        showStatus("Đã bypass hcaptcha ✓");
        setTimeout(clickContinueButton, 1200);
      }, randomDelay());
    }
  }

  function clickContinueButton() {
    if (nevClickedContinue) return;
    document.querySelectorAll("a,button").forEach(btn => {
      if ((btn.innerText || "").trim().toUpperCase().includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")) {
        nevClickedContinue = true;
        showStatus("Đã mở captcha → tiếp tục");
        setTimeout(() => { showStatus("Đang sang bước tiếp..."); btn.click(); }, 1000);
      }
    });
  }

  /* ── detect link gốc ──
     FIX: was defined INSIDE this IIFE but also called from global scope
     (lines 411-417 in original) → ReferenceError. Duplicate global calls
     removed. These functions now live and run only inside Script 1.      */
  function detectLinkGoc() {
    safe(() => {
      document.querySelectorAll("a,button").forEach(btn => {
        /* visibility guard */
        if (btn.offsetParent === null) return;
        if (btn.offsetWidth < 1 || btn.offsetHeight < 1) return;
        const text = (btn.innerText || "").trim().toUpperCase();

        if (text.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC") && !nevClickedContinue) {
          const href = btn.getAttribute("href");
          if (!href || href === "#" || href.includes("javascript")) return;
          nevClickedContinue = true;
          showStatus("Continue step");
          setTimeout(() => btn.click(), 1800);
        }

        if (text.includes("LINK GỐC") && !nevClickedLinkGoc) {
          if (!btn.href || btn.href === "#") return;
          nevClickedLinkGoc = true;
          showStatus("Đã tìm thấy Link Gốc ✓");
          setTimeout(() => btn.click(), 1500);
        }
      });
    }, "detectLinkGoc");
  }

  function checkLinkGocOrReturn() {
    safe(() => {
      setTimeout(() => {
        let hasLinkGoc = false, hasContinue = false;
        document.querySelectorAll("a,button").forEach(el => {
          const t = (el.innerText || "").toUpperCase();
          if (t.includes("LINK GỐC"))                  hasLinkGoc  = true;
          if (t.includes("BẤM VÀO ĐÂY ĐỂ TIẾP TỤC")) hasContinue = true;
        });
        if (hasContinue) return;
        if (!hasLinkGoc) {
          showStatus("Không có Link Gốc → về task");
          setTimeout(() => { location.href = "https://moneytask.top/app/tasks/link-rut-gon"; }, 1200);
        }
      }, 5000);
    }, "checkLinkGocOrReturn");
  }

  /* ── error detectors ──
     FIX: sendErrorWebhook / sendCampErrorWebhook were inside Script 2's
     IIFE in the original → ReferenceError when called here.
     Now both are in global scope above.                                   */
  function detectError404() {
    const body = (document.body.innerText || "").toUpperCase();
    if (document.title.includes("404") || body.includes("NOT FOUND") || body.includes("KHÔNG TÌM THẤY")) {
      showStatus("Error 404 → Quay về task");
      sendErrorWebhook();
      setTimeout(() => { location.href = "https://moneytask.top/app/tasks/link-rut-gon"; }, 1200);
      return true;
    }
    return false;
  }

  function detectCampError() {
    const body = (document.body.innerText || "").toUpperCase();
    if (body.includes("1 CAMP 1 LẦN DUY NHẤT TRONG 24H") || body.includes("CHỈ ĐƯỢC PHÉP VƯỢT 1 CAMP")) {
      showStatus("Lỗi Camp → Quay về task");
      sendCampErrorWebhook();
      setTimeout(() => { location.href = "https://moneytask.top/app/tasks/link-rut-gon"; }, 3000);
      return true;
    }
    return false;
  }

  /* ── start ── */
  setTimeout(simulateHuman, 1500);

  setInterval(() => { safe(() => { detectError404(); detectCampError(); }, "errPoll"); }, 2000);
  setInterval(() => { safe(unlockButton, "unlockPoll"); }, 1500);

  /* uptolink finish page */
  const isUptoFinish = location.hostname === "uptolink.one" && location.pathname.startsWith("/finish");

  /* FIX: original ran BOTH the uptolink block AND the global detectLinkGoc
     below it (lines 411-417) → duplicate intervals on every page.
     Now: only ONE branch runs, never both.                                 */
  if (isUptoFinish) {
    setInterval(() => { safe(detectLinkGoc, "linkGocUptoLink"); }, 1200);
    checkLinkGocOrReturn();
  } else {
    setInterval(() => { safe(detectLinkGoc, "linkGocGeneral"); }, 1200);
    checkLinkGocOrReturn();
  }

})(); // end Script 1

/* ═══════════════════════════════════════════════════════════
   SCRIPT 2 — AUTO STEP + REDIRECT SYSTEM
   ═══════════════════════════════════════════════════════════ */

(async function script2() {
  "use strict";

  /* FIX: original was missing "?" separator before Date.now() →
     URL became "…redirectMap.json1234567890" → fetch 404           */
  const MAP_URL =
    "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/redirectMap.json?" +
    Date.now();

  /* google redirect */
  function handleGoogleRedirect() {
    safe(() => {
      const target = new URLSearchParams(window.location.search).get("q");
      if (!target) return;
      try { showStatus("Redirect → " + new URL(target).hostname); }
      catch { showStatus("Redirect..."); }
      setTimeout(() => { location.href = target; }, 400);
    }, "googleRedirect");
  }

  /* load json map */
  async function loadMap() {
    try {
      const r = await fetch(MAP_URL, { cache: "no-store" });
      return await r.json();
    } catch (e) {
      console.warn("[Nev] map load error", e);
      return null;
    }
  }

  /* ── safe click: visibility + WeakSet cooldown ──
     FIX: original safeClick had no duplicate-click guard → spam clicks   */
  const _clicked = new WeakSet();
  function safeClick(el) {
    if (!el) return;
    if (_clicked.has(el)) return;
    if (el.offsetParent === null) return;
    if (el.offsetWidth < 1 || el.offsetHeight < 1) return;
    _clicked.add(el);
    setTimeout(() => _clicked.delete(el), 3000);   // 3s cooldown
    try {
      el.click();
      el.dispatchEvent(new MouseEvent("click",        { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el.dispatchEvent(new PointerEvent("pointerup",   { bubbles: true }));
    } catch (e) { console.warn("[Nev] click fail", e); }
  }

  /* fast scroll */
  function autoScrollPage() {
    if (location.hostname.includes("maxtask.net") || location.hostname.includes("uptolink.one")) return;
    if (window.__nevScrolled) return;
    window.__nevScrolled = true;
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
    showStatus("Đã quét trang");
    nevScanTime = Date.now();
  }

  /* ── click steps / continue ──
     FIX: original had no per-button cooldown → same button clicked every
     1.5s. Added _stepTs map with 4s cooldown per button text.             */
  const _stepTs = {};
  function clickButtons() {
    safe(() => {
      const now = Date.now();
      document.querySelectorAll("a,button,.btn,div,span").forEach(el => {
        if (el.offsetParent === null) return;
        if (el.offsetWidth < 4 || el.offsetHeight < 4) return;
        const text = (el.innerText || "").trim().toUpperCase();
        if (!text) return;

        /* STEP 1 / 2 / 3 */
        if (text.includes("STEP 1") || text.includes("STEP 2") || text.includes("STEP 3")) {
          if (_stepTs[text] && now - _stepTs[text] < 4000) return;
          _stepTs[text] = now;
          const n = text.includes("STEP 1") ? 1 : text.includes("STEP 2") ? 2 : 3;
          setUIStep(n);
          showStatus("Đang click: " + text.substring(0, 20));
          nevScanTime = 0;
          el.scrollIntoView({ block: "center" });
          safeClick(el);
        }

        /* NHẤN ĐỂ TIẾP TỤC */
        if (text.includes("NHẤN ĐỂ TIẾP TỤC")) {
          if (_stepTs["CTN"] && now - _stepTs["CTN"] < 5000) return;
          _stepTs["CTN"] = now;
          showStatus("Continue ›");
          nevScanTime = 0;
          el.scrollIntoView({ block: "center" });
          setTimeout(() => safeClick(el), 2000);
        }

        /* NHẤN LINK BẤT KỲ → reload */
        if (text.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") || text.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")) {
          if (!window.__nevReload) {
            window.__nevReload = true;
            showStatus("Reload → sang step kế");
            nevScanTime = 0;
            setTimeout(() => { location.href = location.href; }, 800);
          }
        }
      });
    }, "clickButtons");
  }

  /* ── countdown tracker + drives UI progress bar ── */
  let lastCountdown = null;

  function focusWaitingText() {
    safe(() => {
      for (const el of document.querySelectorAll("div,span,p")) {
        const raw  = (el.innerText || "").trim();
        const text = raw.toUpperCase();
        if (!text.includes("VUI LÒNG ĐỢI TRONG")) continue;
        if (el.offsetHeight < 10 || el.offsetWidth < 10) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top < 50 || rect.top > window.innerHeight - 50) continue;
        const m = raw.match(/\d+/);
        if (!m) continue;
        const sec = parseInt(m[0], 10);
        if (sec < 1 || sec > 80) continue;
        if (lastCountdown !== null && sec >= lastCountdown) continue;
        /* record max for progress bar */
        if (countdownMax === null || sec > countdownMax) countdownMax = sec;
        lastCountdown = sec;
        nevScanTime   = 0;
        setUICountdown(sec, countdownMax);
        showStatus("Đợi lấy mã: " + sec + "s");
        window.scrollTo({ top: rect.top + window.pageYOffset - 120, behavior: "smooth" });
        return;
      }
    }, "focusWaitingText");
  }

  /* ── start auto ── */
  function startAuto() {
    const reloadKey = "reloadCount";
    autoScrollPage();
    clickButtons();
    focusWaitingText();

    setInterval(() => { safe(clickButtons,     "clickLoop");     }, 1500);
    setInterval(() => { safe(focusWaitingText, "countdownLoop"); }, 400);

    setInterval(() => {
      safe(() => {
        const body = (document.body.innerText || "").toUpperCase();
        if (body.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") || body.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC")) {
          let c = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);
          if (c < 2) {
            sessionStorage.setItem(reloadKey, String(c + 1));
            showStatus("Reloading...");
            nevScanTime = 0;
            location.href = location.href;
          }
        }
      }, "reloadDetect");
    }, 1500);
  }

  /* ── google check ── */
  if (location.hostname.includes("google.com") && location.pathname === "/url") {
    setTimeout(handleGoogleRedirect, 800);
  }

  /* ── redirect map ── */
  const config = await loadMap();

  /* FIX: original "return" here when !config.enabled caused Script 3 and
     the SCAN FAILSAFE to never run (they were nested inside this async IIFE
     in the original). Now Script 3 is its own top-level IIFE below.        */
  if (config && config.enabled) {
    const path = location.pathname.split("/").filter(Boolean)[0];
    console.log("[Nev] key:", path);
    if (path && config.redirects[path]) {
      setTimeout(() => {
        location.href = "https://www.google.com/url?q=" + encodeURIComponent("https://" + config.redirects[path]);
      }, 1200);
      return;
    }
  }

  setTimeout(() => { safe(startAuto, "startAuto"); }, 3000);

})(); // end Script 2

/* ═══════════════════════════════════════════════════════════
   SCRIPT 3 — MAXTASK AUTO HOLD VERIFY
   FIX: was nested inside Script 2's async IIFE in the original →
   any early "return" in Script 2 (e.g. redirect map hit) silently
   killed Script 3. Now it's a proper top-level IIFE.
   ═══════════════════════════════════════════════════════════ */

(function script3() {
  "use strict";

  if (!location.hostname.includes("moneytask.top")) return;
  /* FIX: original was "app/tasks/…" (no leading slash) → never matched */
  if (!location.pathname.startsWith("/app/tasks/link-rut-gon")) return;

  let verifyDone    = false;
  let pageEnterTime = Date.now();
  let stableCount   = 0;

  function holdVerify(el) {
    if (verifyDone) return;
    verifyDone = true;

    setUIStep(3);
    showStatus("Chuẩn bị xác minh...");

    setTimeout(() => {
      showStatus("Đang giữ xác minh... 6s");

      /* drive countdown UI while holding */
      let holdSec = 6;
      setUICountdown(holdSec, 6);
      const tick = setInterval(() => {
        holdSec--;
        setUICountdown(holdSec, 6);
        if (holdSec <= 0) clearInterval(tick);
      }, 1000);

      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width  / 2;
      const y = rect.top  + rect.height / 2;

      let touch;
      try {
        touch = new Touch({ identifier: Date.now(), target: el, clientX: x, clientY: y, radiusX: 2, radiusY: 2 });
      } catch (e) {
        clearInterval(tick);
        console.warn("[Nev] Touch not supported:", e);
        showStatus("Touch không hỗ trợ trên thiết bị này");
        verifyDone = false;
        return;
      }

      el.dispatchEvent(new TouchEvent("touchstart", {
        bubbles: true, cancelable: true,
        touches: [touch], targetTouches: [touch], changedTouches: [touch]
      }));

      setTimeout(() => {
        clearInterval(tick);
        el.dispatchEvent(new TouchEvent("touchend", {
          bubbles: true, cancelable: true, touches: [], changedTouches: [touch]
        }));
        setUIStep(4);
        setUICountdown(0, 6);
        showStatus("Verify hoàn tất ✓");
        sendWebhook();
        setTimeout(() => {
          showStatus("Quay về danh sách task...");
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
    const el = document.querySelector("canvas,svg");
    if (!el || el.offsetWidth < 80 || el.offsetHeight < 80) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    stableCount++;
    if (stableCount < 3) return;
    holdVerify(el);
  }

  setInterval(() => { safe(detectVerify, "verifyLoop"); }, 1200);

})(); // end Script 3

/* ═══════════════════════════════════════════════════════════
   SCAN FAILSAFE — BACK HOME IF STUCK
   FIX: nevScanTime reset BEFORE setTimeout to prevent double-redirect
   ═══════════════════════════════════════════════════════════ */

setInterval(() => {
  safe(() => {
    if (!nevScanTime) return;
    if (Date.now() - nevScanTime > 7000) {
      showStatus("Không mã → quay về task");
      sendErrorWebhook();
      nevScanTime = 0;   // reset FIRST to avoid loop
      setTimeout(() => { location.href = "https://moneytask.top/app/tasks/link-rut-gon"; }, 1200);
    }
  }, "failsafe");
}, 2000);

/* ── init panel as soon as DOM is ready ── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createPanel);
} else {
  createPanel();
}
