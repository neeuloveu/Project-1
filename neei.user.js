// ==UserScript==
// @name         Full System (Fixed v3.6 - Auto Click Random Link)
// @namespace    http://tampermonkey.net/
// @version      3.6
// @description  Developed by Neei - Fixed Countdown & Auto Click Internal Links for Traffic Tasks
// @match        *://*/*
// @grant        none
// ==/UserScript==

/* ================================================= */
/* GLOBAL CONFIG + SHARED STATE                     */
/* ================================================= */

const STATUS_ICON = "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/IMG_1198.jpeg";
const DISCORD_WEBHOOK = ""; 
const DISCORD_USER_ID = "";

/* ── shared flags ── */
let lastStatus       = "";
let nevScanTime      = 0;
let nevClickedContinue = false;
let nevClickedLinkGoc  = false;
let isUnlocking      = false; 

/* task counter */
let successTask = parseInt(localStorage.getItem("nev_success") || "0", 10);

/* ================================================= */
/* UTILITY — SAFE WRAPPER & CLICK SIMULATOR          */
/* ================================================= */

function safe(fn, label) {
  try { fn(); }
  catch (e) { console.warn("[Nev] " + (label || "err"), e); }
}

function simulateClick(el) {
  if (!el) return;
  if (el.offsetParent === null) return;
  if (el.offsetWidth < 1 || el.offsetHeight < 1) return;

  try {
    el.click();
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  } catch (e) {
    console.warn("[Nev] click fail", e);
  }
}

/* ================================================= */
/* STATUS BAR — MODERN NEON GREEN UI                 */
/* ================================================= */

function createStatusBar() {
  if (window.top !== window.self) return false;
  if (location.hostname.includes("hcaptcha")) return false;
  if (document.getElementById("nevUiCard")) return true;
  if (!document.body) return false;

  const card = document.createElement("div");
  card.id = "nevUiCard";

  Object.assign(card.style, {
    position:      "fixed",
    bottom:        "20px",
    right:         "20px",
    zIndex:        "2147483647",
    display:       "flex",
    flexDirection: "column",
    width:         "260px",
    padding:       "16px",
    background:    "linear-gradient(145deg, #09130e, #050a07)",
    color:         "#ffffff",
    borderRadius:  "20px",
    fontFamily:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxShadow:     "0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(46, 204, 113, 0.15)",
    border:        "2px solid #1e4620",
    backdropFilter:"blur(12px)",
    boxSizing:     "border-box",
    transition:    "border-color 0.3s ease, box-shadow 0.3s ease"
  });

  card.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
      <img src="${STATUS_ICON}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #2ecc71; box-shadow: 0 0 8px rgba(46,204,113,0.4);">
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 700; font-size: 15px; color: #2ecc71; letter-spacing: 0.5px;">UptoTool</span>
        <span style="font-size: 10px; color: #6a7c71; text-transform: uppercase; font-weight: 600;">System Auto v3.6</span>
      </div>
    </div>

    <div style="display: flex; gap: 8px; margin-bottom: 14px; justify-content: flex-start;">
      <span id="nevStep1" style="padding: 4px 14px; background: #142d1f; border: 1px solid #2ecc71; border-radius: 20px; font-size: 11px; font-weight: 600; color: #2ecc71; transition: all 0.3s;">Chạy Auto</span>
    </div>

    <div id="nevDisplayBox" style="background: #060d09; border: 1px solid #12241a; border-radius: 12px; padding: 14px; font-size: 16px; font-weight: 700; color: #2ecc71; text-align: center; margin-bottom: 12px; min-height: 24px; letter-spacing: 0.5px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
      Đang Khởi Động...
    </div>

    <div style="width: 100%; background: #0d1a12; height: 5px; border-radius: 10px; margin-bottom: 14px; overflow: hidden; border: 1px solid #12241a;">
      <div id="nevProgressBar" style="width: 15%; height: 100%; background: linear-gradient(90deg, #2ecc71, #27ae60); transition: width 0.4s ease, box-shadow 0.4s ease; box-shadow: 0 0 6px #2ecc71;"></div>
    </div>

    <div id="nevFooterBtn" style="background: linear-gradient(180deg, #142d1f, #0b1a12); border: 1px solid #2ecc71; border-radius: 10px; padding: 8px; font-size: 12px; font-weight: 700; color: #ffffff; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      Tiến Hành Auto
    </div>
  `;

  document.body.appendChild(card);
  return true;
}

function showStatus(text) {
  if (!document.body) {
    setTimeout(() => { showStatus(text); }, 100);
    return;
  }

  safe(() => {
    const isReady = createStatusBar();
    if (!isReady) return;

    if (text === lastStatus) return;
    lastStatus = text;

    const displayBox = document.getElementById("nevDisplayBox");
    const footerBtn  = document.getElementById("nevFooterBtn");
    const pBar       = document.getElementById("nevProgressBar");
    const card       = document.getElementById("nevUiCard");

    if (!displayBox) return;

    let cleanText = String(text).replace(/\s+/g, " ").trim();

    const secMatch = cleanText.match(/(\d+)\s*s/i);
    if (secMatch) {
      const seconds = secMatch[1];
      displayBox.innerHTML = `<span style="font-size: 22px; font-weight: 800;">${seconds} Giây</span>`;
      displayBox.style.color = "#2ecc71";
      
      let pct = Math.max(0, Math.min(100, (parseInt(seconds, 10) / 60) * 100));
      if (pBar) pBar.style.width = `${pct}%`;
      
      footerBtn.textContent = "Đang lấy mã...";
      footerBtn.style.borderColor = "#2ecc71";
      return;
    }

    if (cleanText.toUpperCase().includes("BYPASS")) {
      displayBox.textContent = "Bypass Captcha";
      if (pBar) pBar.style.width = "45%";
    }
    else {
      displayBox.textContent = cleanText.length > 40 ? cleanText.substring(0, 40) + "…" : cleanText;
      displayBox.style.color = "#ffffff";
    }

    if (cleanText.toUpperCase().includes("LỖI") || cleanText.toUpperCase().includes("ERROR")) {
      if (card) card.style.borderColor = "#e74c3c";
      displayBox.style.color = "#e74c3c";
      footerBtn.textContent = "Hệ Thống Lỗi";
      footerBtn.style.borderColor = "#e74c3c";
    } else {
      if (card) card.style.borderColor = "#1e4620";
      footerBtn.textContent = "Tiến Hành Auto";
      footerBtn.style.borderColor = "#2ecc71";
    }

  }, "showStatus");
}

if (location.hostname.includes("moneytask.top")) {
  showStatus("Hệ Thống Sẵn Sàng");
} else {
  showStatus("Neei - Tool");
}

/* ================================================= */
/* DISCORD WEBHOOKS                                 */
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
/* SCRIPT 1 — UNLOCK / CAPTCHA BYPASS               */
/* ================================================= */

(function script1() {
  "use strict";

  if (window.top !== window.self) return;
  if (location.hostname.includes("moneytask.top")) return;

  function randomDelay() {
    const times = [4000, 5000, 6000];
    return times[Math.floor(Math.random() * times.length)];
  }

  function simulateHuman() {
    window.scrollTo({ top: Math.random() * 300, behavior: "smooth" });
    window.focus();
  }

  function unlockButton() {
    if (isUnlocking) return; 
    const element = document.getElementById("invisibleCaptchaShortlink");
    if (element && element.hasAttribute("disabled")) {
      isUnlocking = true;
      const delay = randomDelay();
      showStatus("Đang bypass hcaptcha...");
      setTimeout(() => {
        element.removeAttribute("disabled");
        showStatus("Đã bypass hcaptcha");
        setTimeout(() => {
          clickContinueButton();
          isUnlocking = false;
        }, 1200);
      }, delay);
    }
  }

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
          simulateClick(btn);
        }, 1000);
      }
    });
  }

  function detectError404() {
    const body = (document.body.innerText || "").toUpperCase();
    if (
      document.title.includes("404") ||
      body.includes("NOT FOUND") ||
      body.includes("KHÔNG TÌM THẤY")
    ) {
      showStatus("Error 404 → Quay về task");
      sendErrorWebhook();
      setTimeout(() => {
        location.href = "https://moneytask.top/app/tasks/link-rut-gon";
      }, 1200);
      return true;
    }
    return false;
  }

  function detectCampError() {
    const body = (document.body.innerText || "").toUpperCase();
    if (
      body.includes("1 CAMP 1 LẦN DUY NHẤT TRONG 24H") ||
      body.includes("CHỈ ĐƯỢC PHÉP VƯỢT 1 CAMP")
    ) {
      showStatus("Lỗi Camp → Quay về task");
      sendCampErrorWebhook();
      setTimeout(() => {
        location.href = "https://moneytask.top/app/tasks/link-rut-gon";
      }, 3000);
      return true;
    }
    return false;
  }

  setTimeout(simulateHuman, 1500);

  setInterval(() => {
    safe(() => {
      detectError404();
      detectCampError();
    }, "errorPoll");
  }, 2000);

  setInterval(() => {
    safe(unlockButton, "unlockPoll");
  }, 1500);

})();

/* ================================================= */
/* SCRIPT 2 — AUTO STEP + REDIRECT SYSTEM           */
/* ================================================= */

(async function script2() {
  "use strict";

  if (location.hostname.includes("moneytask.top")) return;

  const _clickedEls = new WeakSet();

  function safeClick(el) {
    if (!el) return;
    if (_clickedEls.has(el)) return;
    if (el.offsetParent === null) return;
    if (el.offsetWidth < 1 || el.offsetHeight < 1) return;

    _clickedEls.add(el);
    setTimeout(() => { _clickedEls.delete(el); }, 3000);

    simulateClick(el);
  }

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

  const _stepClicked = {};

  function clickButtons() {
    safe(() => {
      const now = Date.now();
      const elements = document.querySelectorAll("a,button,.btn,div,span,input");

      elements.forEach(el => {
        if (el.offsetParent === null) return;
        if (el.offsetWidth < 4 || el.offsetHeight < 4) return;

        const text = (el.innerText || el.value || "").trim().toUpperCase();
        if (!text) return;

        // Quét các nút lấy mã chuẩn
        if (
          text.includes("STEP 1") ||
          text.includes("STEP 2") ||
          text.includes("STEP 3") ||
          text.includes("LẤY MÃ") ||
          text.includes("LẤY PASS") ||
          text.includes("VƯỢT MÃ") ||
          text.includes("CLICK ĐỂ TIẾP TỤC") ||
          text.includes("NHẤN ĐỂ TIẾP TỤC")
        ) {
          if (_stepClicked[text] && (now - _stepClicked[text]) < 4000) return;
          _stepClicked[text] = now;

          showStatus("Click nút tiến trình...");
          nevScanTime = 0;
          el.scrollIntoView({ block: "center" });
          safeClick(el);
        }

        // CHỨC NĂNG MỚI: Xử lý thông báo "Nhấn link bất kỳ"
        if (
          text.includes("NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC") ||
          text.includes("NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC") ||
          text.includes("CLICK 1 BÀI VIẾT BẤT KỲ")
        ) {
          const bodyText = (document.body.innerText || "").toUpperCase();
          // Chặn click/reload nếu bộ đếm giây đang chạy
          if (bodyText.includes("VUI LÒNG ĐỢI TRONG") || bodyText.includes("GIÂY")) return;

          if (!window.__nevLinkClick) {
            window.__nevLinkClick = true;
            showStatus("Đang click bài viết ngẫu nhiên...");
            nevScanTime = 0;
            
            // Tìm và click vào 1 link bài viết nội bộ ngẫu nhiên
            const internalLinks = Array.from(document.querySelectorAll("a")).filter(a => {
                return a.href && 
                       a.href.includes(location.hostname) && 
                       !a.href.includes("javascript:") && 
                       !a.href.includes("#");
            });

            if (internalLinks.length > 0) {
                const randomLink = internalLinks[Math.floor(Math.random() * internalLinks.length)];
                setTimeout(() => { safeClick(randomLink); }, 1000);
            } else {
                // Fallback nếu không có link, tiến hành reload nhẹ
                setTimeout(() => { location.href = location.href; }, 1200);
            }
          }
        }
      });
    }, "clickButtons");
  }

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
        nevScanTime = 0; // Reset failsafe timer trong lúc chờ

        const absoluteTop = rect.top + window.pageYOffset;
        window.scrollTo({ top: absoluteTop - 120, behavior: "smooth" });
        return;
      }
    }, "focusWaitingText");
  }

  function startAuto() {
    autoScrollPage();
    clickButtons();
    focusWaitingText();

    setInterval(() => {
      safe(clickButtons, "clickLoop");
    }, 1500);

    setInterval(() => {
      safe(focusWaitingText, "countdownLoop");
    }, 400);
  }

  if (location.hostname.includes("google.com") && location.pathname === "/url") {
    setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const target = params.get("q");
        if (target) location.href = target;
    }, 800);
  }

  setTimeout(() => {
    safe(startAuto, "startAuto");
  }, 3000);

})();

/* ================================================= */
/* SCRIPT 3 — MAXTASK AUTO HOLD VERIFY              */
/* ================================================= */

(function script3() {
  "use strict";

  if (!location.hostname.includes("moneytask.top")) return;
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
        showStatus("Touch không được hỗ trợ");
        verifyDone = false;
        return;
      }

      el.dispatchEvent(new TouchEvent("touchstart", {
        bubbles: true, cancelable: true,
        touches: [touch], targetTouches: [touch], changedTouches: [touch]
      }));

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

})();

/* ================================================= */
/* SCAN FAILSAFE — BACK HOME IF STUCK               */
/* ================================================= */

setInterval(() => {
  safe(() => {
    if (!nevScanTime) return;
    if (location.hostname.includes("moneytask.top")) return;

    // Tăng thời gian chờ an toàn lên 35 giây để tránh lỗi kẹt load trang web chậm
    if (Date.now() - nevScanTime > 35000) {
      showStatus("Không lấy được mã → về task");
      sendErrorWebhook();
      nevScanTime = 0;
      setTimeout(() => {
        location.href = "https://moneytask.top/app/tasks/link-rut-gon";
      }, 1200);
    }
  }, "failsafe");
}, 2000);
