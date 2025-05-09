// ==UserScript==
// @name         Search Map Logger
// @description  https://github.com/kchinzei/search_logger.git
// @version      0.5.1
// @match        https://www.google.com/maps/place*
// @match        https://www.google.co.jp/maps/place*
// @match        https://www.google.com/maps/search*
// @match        https://www.google.co.jp/maps/search*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function() {
    const s = window.location.pathname;
    const m = s.match(/^\/maps\/(place|search)\/([^\/]+)/);
    if (!m) return;

    const query = decodeURIComponent(m[2]).replaceAll('+', ' ');
    var searchUrl = `${window.location.origin}/maps/${m[1]}/${m[2]}`;
    const m2 = s.match(/^\/maps\/(?:place|search)\/[^\/]+\/(@[^\/]+)/);
    if (m2) searchUrl = `${window.location.origin}/maps/${m[1]}/${m[2]}/${m2[1]}`;

    GM_xmlhttpRequest({
        method: "POST",
        url: "http://localhost:27123",
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify({
            query: query_readable,
            url: searchUrl
        }),
        onload: function(res) {
            console.log("[Search Map Logger] Sent search to Python:", res.status);
        },
        onerror: function(err) {
            console.error("[Search Map Logger] Failed to send:", err);
        }
    });
})();
