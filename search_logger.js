// ==UserScript==
// @name         Search Logger
// @description  https://github.com/kchinzei/search_logger.git
// @version      0.5.0
// @match        https://www.google.com/search*
// @match        https://www.google.co.jp/search*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function() {
    const query = new URLSearchParams(window.location.search).get("q");
    if (!query) return;
    const searchUrl = `${window.location.origin}/search?q=${encodeURIComponent(query)}`;
		
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
