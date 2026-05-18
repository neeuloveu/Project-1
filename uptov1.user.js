// ==UserScript==
// @name         Neei Tool v2.0 (Pro Redirect Edition)
// @version      2.0
// @description  Smart auto-redirect engine with dynamic rules, MutationObserver, loop protection, and debug mode
// @match        https://huongdangetlink.com/*
// @match        https://uptolink.net/*
// @match        https://*.uptolink.*/*
// @match        https://*/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      *
// ==/UserScript==

(function () {
    'use strict';

    // ════════════════════════════════════════════════════════════════════════
    // ── CONFIGURATION ────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    const CONFIG = {
        // Toggle the entire script on/off
        ENABLED: true,

        // Print debug logs to console
        DEBUG: false,

        // URL to fetch dynamic redirect rules (JSON)
        // Set to null or '' to disable remote rules
        REMOTE_RULES_URL: '',

        // How often (ms) to re-fetch remote rules (default: 5 minutes)
        REMOTE_RULES_INTERVAL: 5 * 60 * 1000,

        // Cooldown between redirects (ms) — prevents rapid-fire loops
        REDIRECT_COOLDOWN_MS: 2000,

        // Max redirects tracked in history to detect loops
        REDIRECT_HISTORY_LIMIT: 10,

        // How long (ms) after page load to keep retrying for late DOM elements
        RETRY_DURATION_MS: 8000,

        // Interval (ms) between each DOM re-scan retry
        RETRY_INTERVAL_MS: 800,

        // Domains that, when detected in links/buttons/text, trigger a redirect
        AUTO_DETECT_DOMAINS: [
            'huongdangetlink.com',
            'uptolink.net',
        ],

        // Patterns in href that immediately redirect to that href
        PASSTHROUGH_PATTERNS: [
            'maxtask.net/task/',
            'kiemmoney.com/rewards/',
        ],

        // Text triggers → redirect targets
        TEXT_TRIGGERS: [
            { text: 'Quay về Nhiệm vụ', target: 'https://maxtask.net/home/tasks' },
        ],
    };

    // ════════════════════════════════════════════════════════════════════════
    // ── BUILT-IN (LOCAL) REDIRECT MAP ────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════
    // Format: "substring_of_current_url": "redirect_target_url"
    // Leave target empty ("") to skip that rule.

    const LOCAL_REDIRECT_MAP = {
        "huongdangetlink.com/complete": "https://kiemmoney.com",
        // "uptolink.net/error": "https://maxtask.net/home/tasks",
    };

    // ════════════════════════════════════════════════════════════════════════
    // ── STATE ─────────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    let dynamicRedirectMap = {};        // Rules loaded from remote JSON
    let lastRedirectTime = 0;           // Timestamp of last redirect
    let redirectHistory = [];           // Recent redirect targets for loop detection
    let observer = null;                // MutationObserver instance
    let retryTimer = null;              // Retry interval handle
    let retryStartTime = Date.now();    // When retry scanning started

    // ════════════════════════════════════════════════════════════════════════
    // ── UTILITIES ─────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Log to console only when DEBUG mode is on.
     */
    function log(...args) {
        if (CONFIG.DEBUG) {
            console.log('[NeeiTool]', ...args);
        }
    }

    /**
     * Validate that a string is a safe, absolute HTTP/HTTPS URL.
     * @param {string} url
     * @returns {boolean}
     */
    function isSafeUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const parsed = new URL(url);
            return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
            return false;
        }
    }

    /**
     * Perform a safe redirect using window.location.replace().
     * Enforces cooldown, loop detection, and URL validation.
     * @param {string} targetUrl
     * @param {string} [reason] - Debug label for why this redirect fired
     */
    function safeRedirect(targetUrl, reason = 'unknown') {
        if (!CONFIG.ENABLED) return;

        // Validate URL
        if (!isSafeUrl(targetUrl)) {
            log(`Blocked redirect — invalid URL: "${targetUrl}" (reason: ${reason})`);
            return;
        }

        // Don't redirect to the current page
        if (targetUrl === window.location.href) {
            log(`Blocked redirect — already on target: "${targetUrl}"`);
            return;
        }

        // Enforce cooldown
        const now = Date.now();
        if (now - lastRedirectTime < CONFIG.REDIRECT_COOLDOWN_MS) {
            log(`Blocked redirect — cooldown active (${now - lastRedirectTime}ms elapsed)`);
            return;
        }

        // Detect redirect loop: if this target was already visited recently
        if (redirectHistory.includes(targetUrl)) {
            log(`Blocked redirect — loop detected for: "${targetUrl}"`);
            return;
        }

        // Record redirect
        lastRedirectTime = now;
        redirectHistory.push(targetUrl);
        if (redirectHistory.length > CONFIG.REDIRECT_HISTORY_LIMIT) {
            redirectHistory.shift();
        }

        log(`Redirecting → "${targetUrl}" [${reason}]`);

        // Stop observer and retry to prevent post-redirect interference
        stopObserver();
        stopRetry();

        window.location.replace(targetUrl);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ── REMOTE RULES LOADER ──────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Fetch redirect rules from remote JSON and merge into dynamicRedirectMap.
     * Expected JSON format: { "url_substring": "target_url", ... }
     * Falls back silently to local rules on any error.
     */
    function fetchRemoteRules() {
        const url = CONFIG.REMOTE_RULES_URL;
        if (!url) return;

        log(`Fetching remote rules from: ${url}`);

        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            timeout: 8000,
            headers: { 'Cache-Control': 'no-cache' },
            onload(response) {
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const parsed = JSON.parse(response.responseText);
                    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                        dynamicRedirectMap = parsed;
                        log('Remote rules loaded:', dynamicRedirectMap);
                    } else {
                        throw new Error('Invalid JSON structure');
                    }
                } catch (err) {
                    log('Failed to parse remote rules:', err.message);
                }
            },
            onerror() {
                log('Network error fetching remote rules — using local fallback');
            },
            ontimeout() {
                log('Timeout fetching remote rules — using local fallback');
            },
        });
    }

    /**
     * Start periodic re-fetching of remote rules.
     */
    function startRemoteRulesPolling() {
        if (!CONFIG.REMOTE_RULES_URL) return;
        fetchRemoteRules();
        setInterval(fetchRemoteRules, CONFIG.REMOTE_RULES_INTERVAL);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ── REDIRECT ENGINE ───────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Check current URL against the merged redirect map (local + dynamic).
     * Fires at most one redirect.
     * @returns {boolean} true if a redirect was triggered
     */
    function checkUrlRedirectMap() {
        const currentUrl = window.location.href;
        const mergedMap = Object.assign({}, LOCAL_REDIRECT_MAP, dynamicRedirectMap);

        for (const [key, target] of Object.entries(mergedMap)) {
            if (key && target && currentUrl.includes(key)) {
                safeRedirect(target, `redirectMap key="${key}"`);
                return true;
            }
        }
        return false;
    }

    /**
     * Scan document body text for known text triggers.
     * @returns {boolean}
     */
    function checkTextTriggers() {
        if (!document.body) return false;
        const bodyText = document.body.innerText || '';

        for (const { text, target } of CONFIG.TEXT_TRIGGERS) {
            if (bodyText.includes(text)) {
                safeRedirect(target, `text trigger="${text}"`);
                return true;
            }
        }
        return false;
    }

    /**
     * Scan all anchor elements for passthrough patterns (e.g. maxtask.net/task/).
     * If found, redirect directly to that href.
     * @returns {boolean}
     */
    function checkPassthroughLinks() {
        const links = document.querySelectorAll('a[href]');
        for (const link of links) {
            const href = link.href;
            for (const pattern of CONFIG.PASSTHROUGH_PATTERNS) {
                if (href.includes(pattern)) {
                    safeRedirect(href, `passthrough pattern="${pattern}"`);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Scan anchors, buttons, onclick attributes, and text content for
     * auto-detect domains. When found in a link, redirect to it.
     * When found in text/onclick without a valid URL, redirect to the domain root.
     * @returns {boolean}
     */
    function checkAutoDetectDomains() {
        for (const domain of CONFIG.AUTO_DETECT_DOMAINS) {

            // 1. Anchors containing the domain
            const anchors = document.querySelectorAll('a[href]');
            for (const a of anchors) {
                if (a.href.includes(domain) && isSafeUrl(a.href)) {
                    safeRedirect(a.href, `auto-detect anchor domain="${domain}"`);
                    return true;
                }
            }

            // 2. Buttons with onclick containing the domain
            const buttons = document.querySelectorAll('button, [onclick]');
            for (const btn of buttons) {
                const onclick = btn.getAttribute('onclick') || '';
                const match = extractUrlFromString(onclick, domain);
                if (match) {
                    safeRedirect(match, `auto-detect onclick domain="${domain}"`);
                    return true;
                }
            }

            // 3. Body text containing the domain (look for a URL pattern)
            if (document.body) {
                const bodyText = document.body.innerText || '';
                if (bodyText.includes(domain)) {
                    const match = extractUrlFromString(bodyText, domain);
                    if (match) {
                        safeRedirect(match, `auto-detect bodyText domain="${domain}"`);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Extract the first valid URL containing a given domain from a raw string.
     * @param {string} text
     * @param {string} domain
     * @returns {string|null}
     */
    function extractUrlFromString(text, domain) {
        // Match http(s)://...domain... patterns
        const regex = /https?:\/\/[^\s"'<>()]+/g;
        const matches = text.match(regex) || [];
        for (const url of matches) {
            if (url.includes(domain) && isSafeUrl(url)) {
                return url;
            }
        }
        return null;
    }

    /**
     * Run all redirect checks in priority order.
     * Returns true if any redirect was triggered.
     */
    function runAllChecks() {
        log('Running all redirect checks...');
        return (
            checkUrlRedirectMap() ||
            checkTextTriggers() ||
            checkPassthroughLinks() ||
            checkAutoDetectDomains()
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // ── MUTATIONOBSERVER ──────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Debounce helper — prevents the observer callback from firing too rapidly.
     */
    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    const debouncedCheck = debounce(() => {
        log('MutationObserver triggered re-scan');
        runAllChecks();
    }, 300);

    /**
     * Start watching the DOM for dynamically added content.
     */
    function startObserver() {
        if (observer) return;
        const target = document.body || document.documentElement;
        if (!target) return;

        observer = new MutationObserver((mutations) => {
            // Only react to mutations that added nodes or changed text
            const hasRelevantChange = mutations.some(
                m => m.addedNodes.length > 0 || m.type === 'characterData'
            );
            if (hasRelevantChange) {
                debouncedCheck();
            }
        });

        observer.observe(target, {
            childList: true,
            subtree: true,
            characterData: false, // avoid noise from text edits
        });

        log('MutationObserver started');
    }

    /**
     * Disconnect the MutationObserver.
     */
    function stopObserver() {
        if (observer) {
            observer.disconnect();
            observer = null;
            log('MutationObserver stopped');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ── RETRY SYSTEM ──────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Keep re-scanning the DOM for a limited duration after page load.
     * Handles cases where content loads late (AJAX, SPA transitions).
     */
    function startRetry() {
        retryStartTime = Date.now();
        retryTimer = setInterval(() => {
            const elapsed = Date.now() - retryStartTime;
            if (elapsed > CONFIG.RETRY_DURATION_MS) {
                stopRetry();
                log('Retry window expired');
                return;
            }
            log(`Retry scan (${elapsed}ms elapsed)`);
            runAllChecks();
        }, CONFIG.RETRY_INTERVAL_MS);
    }

    /**
     * Cancel the retry interval.
     */
    function stopRetry() {
        if (retryTimer !== null) {
            clearInterval(retryTimer);
            retryTimer = null;
            log('Retry stopped');
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ── SPA / AJAX NAVIGATION SUPPORT ────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Re-run checks when the URL changes via pushState / replaceState (SPA).
     */
    function patchHistory() {
        const wrap = (original) => function (...args) {
            const result = original.apply(this, args);
            log('History navigation detected — re-running checks');
            setTimeout(runAllChecks, 100); // Small delay for DOM to settle
            return result;
        };

        if (history.pushState) history.pushState = wrap(history.pushState);
        if (history.replaceState) history.replaceState = wrap(history.replaceState);

        window.addEventListener('popstate', () => {
            log('popstate event — re-running checks');
            setTimeout(runAllChecks, 100);
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    // ── BOOTSTRAP ─────────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Initialize the script. Called once after DOM is ready.
     */
    function init() {
        if (!CONFIG.ENABLED) {
            log('Script is disabled via CONFIG.ENABLED = false');
            return;
        }

        log('Initializing Neei Tool v2.0...');

        // Load remote rules (async; falls back to local if unavailable)
        startRemoteRulesPolling();

        // Patch history for SPA/AJAX navigation
        patchHistory();

        // Initial scan (DOM is ready at document-end)
        runAllChecks();

        // Start MutationObserver for dynamic content
        startObserver();

        // Keep retrying for late-loading elements
        startRetry();
    }

    // ── Entry point ──────────────────────────────────────────────────────────
    // Guard against null body (e.g. very early execution edge cases)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
