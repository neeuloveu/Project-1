// ==UserScript==
// @name         Neei Tool (Neon Green UI Edition) - v1.4
// @version      1.4
// @description  Auto Link cho moneytask.top — Giao diện Neon Green cố định tinh gọn, Thu gọn UI, Auto Redirect JSON
// @author       @neeiloveu
// @match        https://linkhuongdan.net/*
// @match        https://uptolink.one/*
// @match        https://*.uptolink.*/*
// @match        https://moneytask.top/*
// @match        https://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    if (window._neeitoolLoaded) return;
    window._neeitoolLoaded = true;

    // ─── Global Config ────────────────────────────────────────────────────────
    const STATUS_ICON = "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/IMG_1198.jpeg";
    const REDIRECT_MAP_URL = "https://raw.githubusercontent.com/neeuloveu/Project-1/refs/heads/main/redirectMap.json";
    
    let redirectMapData = null;

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function el(id) { return document.getElementById(id); }

    // ─── Storage helpers ──────────────────────────────────────────────────────
    var storage = {
        get: function (key, cb) {
            var val = GM_getValue(key, undefined);
            var obj = {}; obj[key] = val; cb(obj);
        },
        set: function (obj) { for (var k in obj) GM_setValue(k, obj[k]); },
        remove: function (key) { GM_setValue(key, undefined); }
    };

    // ─── CSS — GIAO DIỆN NEEITOOL NEON TINH GỌN CHUYÊN NGHIỆP ──────────────────
    GM_addStyle(`
        #cb-widget {
            position: fixed; bottom: 20px; right: 20px;
            z-index: 2147483647;
            display: flex; flex-direction: column;
            width: 245px; padding: 14px;
            background: linear-gradient(145deg, #070f0b, #030705);
            color: #ffffff; borderRadius: 16px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255,255,255,0.05);
            border: 1px solid #1c3d1e;
            backdrop-filter: blur(16px);
            box-sizing: border-box;
            user-select: none;
            transition: all 0.3s ease;
        }
        #cb-widget.minimized {
            width: 180px !important;
            padding: 8px 14px !important;
        }
        #cb-widget.minimized .cb-body { display: none !important; }
        
        #cb-drag { 
            cursor: grab; margin-bottom: 10px; 
            display: flex; align-items: center; justify-content: space-between;
        }
        #cb-widget.minimized #cb-drag { margin-bottom: 0; }
        #cb-drag:active { cursor: grabbing; }

        .cb-minimize-btn {
            background: #0f2418; border: 1px solid #2ecc71; color: #2ecc71;
            width: 22px; height: 22px; border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; cursor: pointer; font-size: 14px;
            transition: all 0.2s;
        }
        .cb-minimize-btn:hover { background: #2ecc71; color: #040906; }

        .cb-body { display: flex; flex-direction: column; width: 100%; transition: all 0.3s ease; }
        
        .cb-toggleRow {
            display: flex; align-items: center; justify-content: space-between;
            background: #040906; border: 1px solid #0f1f15;
            border-radius: 10px; padding: 8px 10px; margin-bottom: 10px;
            transition: border-color .3s, background .3s;
        }
        .cb-toggleRow.on { border-color: #2ecc71; background: #08120b; }
        .cb-tleft { display: flex; align-items: center; gap: 8px; }
        .cb-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: #3d5245; flex-shrink: 0; transition: all .3s;
        }
        .cb-dot.on { background: #2ecc71; box-shadow: 0 0 8px #2ecc71; }
        .cb-rlbl { font-size: 12px; font-weight: 700; color: #ffffff; line-height: 1; }
        .cb-statusSub { font-size: 10px; color: #5c6e62; margin-top: 3px; transition: color .3s; line-height: 1; }
        .cb-statusSub.on { color: #2ecc71; font-weight: 600; }
        
        .cb-switch { position: relative; width: 34px; height: 18px; flex-shrink: 0; }
        .cb-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
        .cb-slider {
            position: absolute; inset: 0; background: #0a140e;
            border-radius: 50px; cursor: pointer; border: 1px solid #0f1f15;
            transition: all .3s ease;
        }
        .cb-slider::before {
            content: ''; position: absolute;
            width: 12px; height: 12px; left: 2px; top: 2px;
            background: #3d5245; border-radius: 50%;
            transition: all .3s ease;
        }
        .cb-switch input:checked + .cb-slider { background: #0f2418; border-color: #2ecc71; }
        .cb-switch input:checked + .cb-slider::before {
            transform: translateX(16px); background: #2ecc71; box-shadow: 0 0 6px #2ecc71;
        }
        
        .cb-task-box {
            background: #040906; border: 1px solid #0f1f15;
            border-radius: 10px; padding: 8px 10px; margin-bottom: 10px;
        }
        .cb-task-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .cb-task-lbl { font-size: 9px; color: #5c6e62; text-transform: uppercase; font-weight: 600; }
        .cb-task-name {
            font-size: 11px; font-weight: 700; color: #2ecc71;
            max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .cb-task-name.idle { color: #3d5245; font-weight: 400; font-style: italic; }
        .cb-step-list { display: flex; gap: 5px; }
        .cb-step {
            font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 20px;
            background: #08120b; border: 1px solid #16291e; color: #3d5245; transition: all .3s;
        }
        .cb-step.active { background: #0f2418; border-color: #2ecc71; color: #2ecc71; box-shadow: 0 0 6px rgba(46,204,113,0.15); }
        .cb-step.done { background: #08120b; color: #27ae60; border-color: #27ae60; text-decoration: line-through; opacity: 0.5; }
        
        #cb-countdown-box {
            display: none; opacity: 0; flex-direction: column;
            background: #040906; border: 1px solid #0f1f15;
            border-radius: 10px; padding: 10px; margin-bottom: 10px; transition: opacity .3s;
        }
        #cb-countdown-box.show { display: flex; opacity: 1; }
        .cb-cd-right { width: 100%; }
        .cb-cd-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
        .cb-cd-label { font-size: 9px; color: #5c6e62; font-weight: 600; letter-spacing: 0.5px; }
        .cb-cd-text { font-size: 16px; font-weight: 800; color: #2ecc71; }
        .cb-cd-bar-wrap { height: 4px; background: #0a140e; border-radius: 10px; overflow: hidden; width: 100%; border: 1px solid #0f1f15; }
        .cb-cd-bar { height: 100%; background: linear-gradient(90deg, #2ecc71, #27ae60); border-radius: 10px; transition: width 1s linear; width: 100%; box-shadow: 0 0 5px #2ecc71; }
        
        #cb-redirect-box { display: none; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        #cb-redirect-box.show { display: flex; }
        .cb-redirect-label {
            font-size: 10px; color: #ffffffb3; background: #040906; border: 1px solid #c0392b;
            border-radius: 10px; padding: 8px; line-height: 1.3;
        }
        .cb-redirect-label .cb-rd-title { font-size: 11px; font-weight: 800; color: #e74c3c; margin-bottom: 3px; display: block; }
        .cb-redirect-label .cb-rd-sub { font-size: 9px; color: #5c6e62; display: block; }
        .cb-redirect-btns { display: flex; gap: 6px; }
        .cb-redir-btn {
            flex: 1; padding: 8px 4px; border-radius: 8px; cursor: pointer;
            font-size: 10px; font-weight: 700; transition: all .2s;
            text-align: center; border: 1px solid #143016; line-height: 1.2;
        }
        .cb-redir-btn .cb-btn-label { font-size: 8px; font-weight: 500; opacity: 0.4; display: block; margin-top: 1px; }
        .cb-redir-btn.moneytask { background: linear-gradient(180deg, #0f2418, #08120b); color: #2ecc71; border-color: #2ecc71; }
        .cb-redir-btn.kiemoney { background: linear-gradient(180deg, #16240f, #0b1208); color: #a2ec71; border-color: #a2ec71; }
        .cb-redir-btn:active { transform: scale(0.96); }
        
        .cb-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #0f1f15; }
        .cb-author { font-size: 10px; color: #5c6e62; font-weight: 600; text-transform: uppercase; }
        .cb-phase {
            font-size: 10px; font-weight: 700; color: #ffffff; background: linear-gradient(180deg, #0f2418, #08120b);
            border: 1px solid #2ecc71; padding: 3px 8px; border-radius: 8px; transition: all .3s;
        }
        .cb-phase.running { color: #2ecc71; box-shadow: 0 0 6px rgba(46,204,113,0.25); }
    `);

    // ─── Fetch Redirect Map (Đã sửa đổi để bypass bảo mật trình duyệt) ─────────
    function loadRedirectMap() {
        GM_xmlhttpRequest({
            method: "GET",
            url: REDIRECT_MAP_URL,
            responseType: "json",
            onload: function(response) {
                if (response.status === 200) {
                    redirectMapData = response.response || JSON.parse(response.responseText);
                    console.log('NeeiTool: Loaded redirectMap.json successfully.');
                    // Thực hiện kiểm tra redirect ngay lập tức khi map tải xong thành công
                    if (isOn()) checkMapRedirect();
                } else {
                    console.log('NeeiTool Error: Load redirect map failed with status ' + response.status);
                }
            },
            onerror: function(err) {
                console.log('NeeiTool Error: GM_xmlhttpRequest request failed', err);
            }
        });
    }

    function checkMapRedirect() {
        if (!redirectMapData || !isOn()) return false;
        let url = window.location.href;
        for (let key in redirectMapData) {
            if (url.includes(key)) {
                let target = redirectMapData[key];
                if (target && target !== url) {
                    setPhase('Redirect JSON...', true);
                    window.location.href = target;
                    return true;
                }
            }
        }
        return false;
    }

    // ─── Inject Widget HTML ───────────────────────────────────────────────────
    function injectWidget() {
        if (el('cb-widget')) return;
        var widget = document.createElement('div');
        widget.id = 'cb-widget';
        widget.innerHTML = `
            <div id="cb-drag">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <img src="${STATUS_ICON}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #2ecc71; box-shadow: 0 0 6px rgba(46,204,113,0.3);">
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 800; font-size: 14px; color: #2ecc71; letter-spacing: 0.5px;">Neei Tool</span>
                    <span style="font-size: 9px; color: #5c6e62; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px;">Premium Auto v1.4</span>
                  </div>
                </div>
                <div class="cb-minimize-btn" id="cb-min-btn">_</div>
            </div>
            <div class="cb-body">
                <div class="cb-toggleRow" id="cb-toggleRow">
                    <div class="cb-tleft">
                        <div class="cb-dot" id="cb-dot"></div>
                        <div>
                            <div class="cb-rlbl">Auto Link</div>
                            <div class="cb-statusSub" id="cb-statusSub">Dừng</div>
                        </div>
                    </div>
                    <label class="cb-switch">
                        <input type="checkbox" id="cb-tog">
                        <span class="cb-slider"></span>
                    </label>
                </div>
                <div class="cb-task-box">
                    <div class="cb-task-top">
                        <div class="cb-task-lbl">Nhiệm vụ</div>
                        <div class="cb-task-name idle" id="cb-taskname">Chưa chạy</div>
                    </div>
                    <div class="cb-step-list">
                        <div class="cb-step" id="cb-s1">Step 1</div>
                        <div class="cb-step" id="cb-s2">Step 2</div>
                        <div class="cb-step" id="cb-s3">Step 3</div>
                    </div>
                </div>
                <div id="cb-countdown-box">
                    <div class="cb-cd-right">
                        <div class="cb-cd-top">
                            <div class="cb-cd-label">VUI LÒNG ĐỢI TRONG</div>
                            <div class="cb-cd-text" id="cb-cd-text">--</div>
                        </div>
                        <div class="cb-cd-bar-wrap"><div class="cb-cd-bar" id="cb-cd-bar"></div></div>
                    </div>
                </div>
                <div id="cb-redirect-box">
                    <div class="cb-redirect-label">
                        <span class="cb-rd-title" id="cb-rd-title">⚠️ Không thể tiếp tục</span>
                        <span class="cb-rd-sub" id="cb-rd-sub">Chọn trang để tiếp tục làm nhiệm vụ</span>
                    </div>
                    <div class="cb-redirect-btns">
                        <div class="cb-redir-btn moneytask" id="cb-goto-moneytask">
                            MoneyTask<span class="cb-btn-label">moneytask.top</span>
                        </div>
                        <div class="cb-redir-btn kiemoney" id="cb-goto-kiemoney">
                            KiemMoney<span class="cb-btn-label">kiemmoney.com</span>
                        </div>
                    </div>
                </div>
                <div class="cb-footer">
                    <div class="cb-author">Neei Engine</div>
                    <div class="cb-phase" id="cb-phase">Idle</div>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        setupDrag(widget);

        // Logic Minimize / Maximize
        el('cb-min-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            var w = el('cb-widget');
            w.classList.toggle('minimized');
            this.innerText = w.classList.contains('minimized') ? '+' : '_';
        });

        // Bắt sự kiện change trực tiếp cho Toggle Switch
        var togInput = el('cb-tog');
        if (togInput) {
            togInput.addEventListener('change', function() {
                var on = this.checked;
                storage.set({ catbell_active: on });
                catbell19(on);
                if (on) catbell32();
            });
        }

        storage.get('catbell_active', function (d) {
            catbell19(!!d.catbell_active);
            if (!!d.catbell_active) catbell32();
        });
    }

    // ─── Event Delegation trên Document ───────────────────────────────────────
    document.addEventListener('click', function (e) {
        var t = e.target;
        if (t.closest && t.closest('#cb-goto-moneytask')) { window.location.href = 'https://moneytask.top/home/tasks'; return; }
        if (t.closest && t.closest('#cb-goto-kiemoney')) { window.location.href = 'https://kiemmoney.com'; return; }
    });

    // ─── Drag (Kéo thả Widget mượt mà) ────────────────────────────────────────
    function setupDrag(widget) {
        var drag = el('cb-drag');
        if (!drag) return;
        var dragging = false, ox = 0, oy = 0;

        drag.addEventListener('mousedown', function (e) {
            if (e.target.id === 'cb-min-btn') return;
            dragging = true;
            var r = widget.getBoundingClientRect();
            ox = e.clientX - r.left; oy = e.clientY - r.top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            widget.style.left   = Math.max(0, Math.min(window.innerWidth  - widget.offsetWidth,  e.clientX - ox)) + 'px';
            widget.style.top    = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, e.clientY - oy)) + 'px';
            widget.style.right  = 'auto'; widget.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', function () { dragging = false; });

        drag.addEventListener('touchstart', function (e) {
            if (e.target.id === 'cb-min-btn') return;
            dragging = true;
            var t = e.touches[0], r = widget.getBoundingClientRect();
            ox = t.clientX - r.left; oy = t.clientY - r.top;
        }, { passive: true });
        document.addEventListener('touchmove', function (e) {
            if (!dragging) return;
            var t = e.touches[0];
            widget.style.left   = Math.max(0, Math.min(window.innerWidth  - widget.offsetWidth,  t.clientX - ox)) + 'px';
            widget.style.top    = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, t.clientY - oy)) + 'px';
            widget.style.right  = 'auto'; widget.style.bottom = 'auto';
        }, { passive: true });
        document.addEventListener('touchend', function () { dragging = false; });
    }

    // ─── Countdown Watcher ────────────────────────────────────────────────────
    var _cd_max = 0, _cd_cur = 0, _cd_timer = null;

    function detectCountdown() {
        var secs = null, allEls = document.querySelectorAll('*');
        for (var i = 0; i < allEls.length; i++) {
            var e2 = allEls[i], txt = e2.textContent.trim();
            var m1 = txt.match(/vui lòng đợi(?: trong)?\s+(\d{1,3})\s*$/i);
            if (m1) { secs = parseInt(m1[1]); break; }
            var m2 = txt.match(/^đợi\s+(\d{1,3})\s*(?:giây)?$/i);
            if (m2) { secs = parseInt(m2[1]); break; }
        }
        if (!secs) {
            for (var i = 0; i < allEls.length; i++) {
                var e2 = allEls[i], txt = e2.textContent.trim();
                if (e2.childElementCount === 0 && /^\d{1,2}$/.test(txt)) {
                    var n = parseInt(txt);
                    if (n >= 1 && n <= 99) {
                        var p = e2.parentElement;
                        var pTxt = p ? p.textContent.toLowerCase() : '';
                        var pCls = p ? ((p.className || '') + (p.id || '')).toLowerCase() : '';
                        if (pTxt.includes('đợi') || pTxt.includes('wait') || pTxt.includes('timer') ||
                            pCls.includes('timer') || pCls.includes('count') || pCls.includes('wait')) {
                            secs = n; break;
                        }
                    }
                }
                var m3 = txt.match(/^(\d{1,2})\s*giây$/i);
                if (m3) { secs = parseInt(m3[1]); break; }
            }
        }
        if (secs && secs > 0) {
            if (_cd_max === 0 || secs > _cd_cur) _cd_max = secs;
            if (secs !== _cd_cur) { _cd_cur = secs; showCountdown(secs); }
        } else { hideCountdown(); }
    }

    function showCountdown(sec) {
        var box = el('cb-countdown-box'), txt = el('cb-cd-text'), bar = el('cb-cd-bar');
        if (!box) return;
        box.classList.add('show');
        if (txt) txt.textContent = sec + 's';
        if (bar) bar.style.width = Math.max(2, _cd_max > 0 ? (sec / _cd_max) * 100 : 100) + '%';
    }

    function hideCountdown() {
        var wasShowing = _cd_cur !== 0;
        _cd_cur = 0; _cd_max = 0;
        var box = el('cb-countdown-box');
        if (wasShowing && box) {
            box.style.opacity = '0';
            setTimeout(function () { box.classList.remove('show'); box.style.opacity = ''; }, 300);
            if (isOn()) setTimeout(function () { clickContinue(); }, 350);
        } else if (box) { box.classList.remove('show'); }
    }

    // Thiết lập thời gian quét đếm ngược nhanh hơn để tối ưu
    function startCountdownWatcher() { if (!_cd_timer) _cd_timer = setInterval(detectCountdown, 600); }
    function stopCountdownWatcher()  { if (_cd_timer) { clearInterval(_cd_timer); _cd_timer = null; } hideCountdown(); }

    // ─── UI State Helpers ─────────────────────────────────────────────────────
    function isOn() { var t = el('cb-tog'); return t ? t.checked : false; }

    // Đặt trạng thái Step
    function setStep(n, state) {
        for (var k = 1; k <= 3; k++) { var s = el('cb-s' + k); if (s) s.className = 'cb-step'; }
        if (n && state) { var s = el('cb-s' + n); if (s) s.className = 'cb-step ' + state; }
    }
    function setTask(name) {
        var t = el('cb-taskname'); if (!t) return;
        if (name) { t.textContent = name; t.className = 'cb-task-name'; }
        else { t.textContent = 'Chưa chạy'; t.className = 'cb-task-name idle'; }
    }
    function setPhase(txt, running) {
        var p = el('cb-phase'); if (!p) return;
        p.textContent = txt; p.className = 'cb-phase' + (running ? ' running' : '');
    }

    function catbell19(on) {
        var tog = el('cb-tog'), dot = el('cb-dot'), sub = el('cb-statusSub'), row = el('cb-toggleRow');
        if (!tog) return;
        tog.checked = on;
        if (on) {
            if (dot) dot.className = 'cb-dot on';
            if (sub) { sub.textContent = 'Chạy'; sub.className = 'cb-statusSub on'; }
            if (row) row.classList.add('on');
            startCountdownWatcher();
        } else {
            if (dot) dot.className = 'cb-dot';
            if (sub) { sub.textContent = 'Dừng'; sub.className = 'cb-statusSub'; }
            if (row) row.classList.remove('on');
            setTask(null); setStep(null); setPhase('Idle', false);
            stopCountdownWatcher();
        }
    }

    function showRedirect(title, sub) {
        var box = el('cb-redirect-box'), t = el('cb-rd-title'), s = el('cb-rd-sub');
        if (t) t.textContent = title || '⚠️ Không thể tiếp tục';
        if (s) s.textContent = sub   || 'Chọn trang để tiếp tục làm nhiệm vụ';
        if (box) box.classList.add('show');
    }

    // ─── Core Logic Task ──────────────────────────────────────────────────────
    function handleCanvas() {
        var canvas = document.querySelector('canvas'); if (!canvas) return false;
        setPhase('Xác thực...', true);
        var r = canvas.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
        canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX:cx, clientY:cy, bubbles:true, isPrimary:true }));
        canvas.dispatchEvent(new MouseEvent('mousedown', { clientX:cx, clientY:cy, bubbles:true }));
        try { canvas.dispatchEvent(new TouchEvent('touchstart', { touches:[new Touch({identifier:1,target:canvas,clientX:cx,clientY:cy})], bubbles:true })); } catch(e) {}
        var h = setInterval(function () {
            if (!isOn()) { clearInterval(h); return; }
            var c2 = document.querySelector('canvas');
            if (!c2) { clearInterval(h); waitApproval(); }
            else { c2.dispatchEvent(new PointerEvent('pointermove', { clientX:cx, clientY:cy, bubbles:true, isPrimary:true })); }
        }, 300);
        return true;
    }

    function waitApproval() {
        setPhase('Chờ duyệt...', true);
        var t = setInterval(function () {
            if (!isOn()) { clearInterval(t); return; }
            if (document.body.innerText.includes('Quay về Nhiệm vụ')) {
                clearInterval(t); setStep(null); setTask(null); setPhase('Xong ✓', false);
                setTimeout(function () { window.location.href = 'https://moneytask.top/home/tasks'; }, 1200);
            }
        }, 500);
    }

    function clickContinue() {
        var body = document.body.innerText;
        if (body.includes('NHẤN LINK BẤT KỲ')) { setPhase('Reload...', true); window.location.reload(); return true; }
        var els = document.querySelectorAll('*');
        for (var i = 0; i < els.length; i++) {
            var e2 = els[i];
            if (e2.childElementCount === 0 && e2.textContent.includes('NHẤN ĐỂ TIẾP TỤC')) {
                e2.scrollIntoView(); e2.click();
                try { if (e2.parentElement) e2.parentElement.click(); } catch(ex) {}
                try { var cl = e2.closest('button,a,[role=button],[onclick]'); if (cl) cl.click(); } catch(ex) {}
                setPhase('Đã click...', true); return true;
            }
        }
        return false;
    }

    function hasContinueBtn(txt) {
        return txt.includes('NHẤN LINK BẤT KỲ') || txt.includes('NHẤN ĐỂ TIẾP TỤC') || txt.includes('NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC');
    }

    // Sửa lỗi chờ click nút tiếp tục lặp lại
    function waitContinue(n, cb) {
        setPhase('Chờ nút tiếp tục...', true);
        var firstSeen = false, lastClick = 0;
        var t = setInterval(function () {
            if (!isOn()) { clearInterval(t); return; }
            var body = document.body.innerText;
            if (hasContinueBtn(body)) {
                var now = Date.now();
                if (!firstSeen || now - lastClick > 10000) { firstSeen = true; lastClick = now; clickContinue(); }
            } else if (body.includes('ĐANG XỬ LÝ') || body.includes('đang xử lý')) {
                setPhase('Đang xử lý...', true);
            } else if (firstSeen) { clearInterval(t); if (n) setStep(n, 'done'); cb(); }
        }, 600);
    }

    function clickStep(n) {
        var els = document.querySelectorAll('*');
        for (var i = 0; i < els.length; i++) {
            var e2 = els[i], txt = e2.textContent;
            if (e2.childElementCount === 0 && (txt.includes('LẤY MÃ STEP ' + n) || (n === 1 && txt.includes('LẤY MÃ')))) {
                var target = e2.closest('[id]') || e2.parentElement;
                target.scrollIntoView(); target.click(); return true;
            }
        }
        return false;
    }

    function waitStep(n, cb) {
        setStep(n, 'active'); setTask('Neei — Step ' + n); setPhase('Step ' + n, true);
        var t = setInterval(function () {
            if (!isOn()) { clearInterval(t); return; }
            if (clickStep(n)) { clearInterval(t); cb(); }
        }, 1000);
    }

    function captchaReady() {
        var e2 = document.querySelector('[name="wasHidden-captcha-response"]');
        if (e2 && e2.value && e2.value.length > 0) return true;
        return !document.querySelector('iframe[src*="hcaptcha"]');
    }
    function clickCaptcha() {
        if (!captchaReady()) return false;
        var btn = el('invisibleCaptchaShortlink');
        if (btn) { btn.scrollIntoView(); btn.click(); return true; }
        return false;
    }
    function waitCaptcha() {
        var t = setInterval(function () {
            if (!isOn()) { clearInterval(t); return; }
            if (captchaReady()) { if (clickCaptcha()) clearInterval(t); }
        }, 1000);
    }

    function findTaskLink() {
        var links = document.querySelectorAll('a[href]');
        for (var i = 0; i < links.length; i++) {
            var h = links[i].href;
            if (h.includes('moneytask.top/task/') || h.includes('kiemmoney.com/rewards/')) {
                window.location.href = h; return true;
            }
        }
        return false;
    }

    function startUptolink() {
        var divs = document.querySelectorAll('div, section');
        for (var i = 0; i < divs.length; i++) {
            var d = divs[i];
            if (!d.innerText || !d.innerText.includes('Uptolink 3step')) continue;
            var btn = Array.from(d.querySelectorAll('button,a,span')).find(function(e2){ return e2.innerText && e2.innerText.includes('Làm nhiệm vụ'); });
            if (btn) { btn.scrollIntoView(); btn.click(); setTask('Uptolink 3step'); setPhase('Bắt đầu...', true); return true; }
        }
        return false;
    }

    function check404() {
        var body = document.body.innerText, u = window.location.href;
        if (!u.includes('uptolink')) return false;
        if (body.includes('Not Found') || body.includes('was not found on this (server') || body.includes('404') || body.includes('không tìm thấy')) {
            setPhase('Lỗi 404 - Back to Task', true);
            setTimeout(() => { window.location.href = 'https://moneytask.top/home/tasks'; }, 1000);
            return true;
        }
        return false;
    }

    function checkKiemMoney() {
        var cur = window.location.href;
        var pause = (cur.includes('kiemmoney.com') && !cur.includes('/rewards/') && !cur.includes('/task')) ||
                    (cur.includes('huongdangetlink.com') && cur.includes('complete'));
        if (pause) {
            if (isOn()) { storage.set({ catbell_active: false, catbell_paused_by_km: true }); catbell19(false); setPhase('Tạm dừng', false); }
            return true;
        }
        storage.get('catbell_paused_by_km', function (d) {
            if (d.catbell_paused_by_km) {
                 storage.remove('catbell_paused_by_km');
                storage.set({ catbell_active: true }); catbell19(true); catbell32();
            }
        });
        return false;
    }

    function runLogic() {
        if (!isOn()) return;
        
        // Luôn chạy kiểm tra map redirect đầu tiên
        if (checkMapRedirect()) return;

        if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
            setPhase('Đợi trang load...', true);
            window.addEventListener('load', runLogic, { once: true }); return;
        }
        if (checkKiemMoney()) return;
        if (check404()) return;

        var body = document.body.innerText;
        var curUrl = window.location.href;

        if (document.querySelector('canvas') && (curUrl.includes('uptolink') || curUrl.includes('huongdangetlink'))) { 
            handleCanvas(); 
            return; 
        }

        if (body.includes('Quay về Nhiệm vụ')) { setTimeout(function(){ window.location.href='https://moneytask.top/home/tasks'; }, 1000); return; }
        if (curUrl.includes('moneytask.top/home/tasks')) { setPhase('Tìm nhiệm vụ...', true); startUptolink(); return; }
        if (curUrl.includes('moneytask.top/task/') || curUrl.includes('kiemmoney.com/rewards/')) return;
        if (findTaskLink()) return;

        if (body.includes('Bấm vào đây để tiếp tục') || el('invisibleCaptchaShortlink')) {
            setPhase('Captcha...', true); waitCaptcha();
        } else if (body.includes('NHẤN LINK BẤT KỲ') || body.includes('NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC')) {
            setPhase('Reload...', true); window.location.reload();
        } else if (hasContinueBtn(body)) {
            waitContinue(null, function(){ window.location.reload(); });
        } else if (body.includes('LẤY MÃ STEP 3')) {
            waitStep(3, function(){ waitContinue(3, function(){ window.location.reload(); }); });
        } else if (body.includes('LẤY MÃ STEP 2')) {
            waitStep(2, function(){ waitContinue(2, function(){ window.location.reload(); }); });
        } else if (body.includes('LẤY MÃ STEP 1') || body.includes('LẤY MÃ')) {
            waitStep(1, function(){ waitContinue(1, function(){ window.location.reload(); }); });
        } else if (body.includes('ĐANG XỬ LÝ') || body.includes('ĐANG XỬ LY') || body.includes('đang xử lý')) {
            setPhase('Đang xử lý...', true); setTimeout(runLogic, 1000);
        } else {
            setTimeout(runLogic, 1500);
        }
    }

    function catbell32() {
        if (document.readyState === 'complete' || document.readyState === 'interactive') { runLogic(); }
        else { document.addEventListener('DOMContentLoaded', runLogic, { once: true }); }
    }

    // Khởi tạo và tải Map qua GM_xmlhttpRequest ngay khi vừa vào script
    loadRedirectMap();

    // ─── Boot (Tự động Re-inject nếu DOM thay đổi) ───────────────────────────
    var _observer = new MutationObserver(function () {
        if (!el('cb-widget') && document.body) injectWidget();
    });

    if (document.body) {
        injectWidget();
        _observer.observe(document.body, { childList: true });
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            injectWidget();
            _observer.observe(document.body, { childList: true });
        }, { once: true });
    }

})();
