/** Matches <script type="module" src="./foo.tsx"> or similar entry points. */
const MODULE_SCRIPT_RE = /(<script[^>]+type=["']module["'][^>]+src=["'])([^"']+\.(?:ts|tsx|js|jsx))(["'][^>]*>)/i;

const HMR_OVERLAY_HTML = `
<style id="__actjs_hmr_style">
  #__actjs_reload_overlay {
    display: none;
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 99999;
    background: #1a1a2e;
    color: #e0e0ff;
    padding: 8px 16px;
    border-radius: 6px;
    font: 13px/1.5 monospace;
    box-shadow: 0 2px 12px rgba(0,0,0,.4);
  }
</style>
<div id="__actjs_reload_overlay">&#x27F3; Reloading&hellip;</div>
<script>
(function(){
  var overlay = document.getElementById('__actjs_reload_overlay');
  var ws = new WebSocket('ws://'+location.host+'/__actjs_hmr');
  ws.onmessage = function(e){
    var msg = JSON.parse(e.data);
    if (msg.type === 'reload') {
      overlay.style.display = 'block';
      setTimeout(function(){ location.reload(); }, 80);
    }
  };
  ws.onclose = function(){
    overlay.style.display = 'block';
    overlay.textContent = '\\u27F3 Reconnecting\u2026';
    var t = setInterval(function(){
      var s = new WebSocket('ws://'+location.host+'/__actjs_hmr');
      s.onopen  = function(){ clearInterval(t); location.reload(); };
      s.onerror = function(){ s.close(); };
    }, 1000);
  };
})();
<\/script>`;

export interface TransformResult {
  html: string;
  /** Detected entry point src value, e.g. "./src/main.tsx". Null if none found. */
  entryScript: string | null;
}

/**
 * Transform an HTML file for the actjs dev server:
 * 1. Rewrite <script type="module" src="./main.tsx"> → /__actjs_bundle.js
 * 2. Inject HMR overlay + client before </head>
 */
export function transformHtml(rawHtml: string): TransformResult {
  let html = rawHtml;
  let entryScript: string | null = null;

  // Rewrite module script src and capture the original entry path
  const match = MODULE_SCRIPT_RE.exec(html);
  if (match) {
    entryScript = match[2]!;
    html = html.replace(
      MODULE_SCRIPT_RE,
      `$1/__actjs_bundle.js$3`,
    );
  }

  // Inject HMR overlay before </head>
  html = html.replace('</head>', `${HMR_OVERLAY_HTML}\n</head>`);

  return { html, entryScript };
}
