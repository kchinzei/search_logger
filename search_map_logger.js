// ==UserScript==
// @name         Search Map Logger
// @description  https://github.com/kchinzei/search_logger.git
// @version      0.5.0
// @match        https://www.google.com/maps/search*
// @match        https://www.google.co.jp/maps/search*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function() {
    const s = window.location.pathname;
    const m = s.match(/^\/maps\/search\/([^\/]+)/);
    if (!m) return;

    const query = decodeURIComponent(m[1]);
    const searchUrl = `${location.origin}/maps/search/${encodeURIComponent(query)}`;
		
    GM_xmlhttpRequest({
        method: "POST",
        url: "http://localhost:27123",
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify({
            query: query,
            url: searchUrl
        }),
        onload: function(res) {
            console.log("[Userscript] Sent search to Python:", res.status);
        },
        onerror: function(err) {
            console.error("[Userscript] Failed to send:", err);
        }
    });
})();
