package com.digicast.dgimages.browser

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import com.digicast.dgimages.util.FileProviderUtils
import java.io.File

class ChatGptWebAdapter(
    private val context: Context,
    val webView: WebView,
    private val onStateChanged: (status: String) -> Unit,
    private val onResultCaptured: (String) -> Unit,
    private val onAuthRequired: () -> Unit
) {
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    var pendingFiles: List<File> = emptyList()
    @Volatile
    var lastCapturedDataUrl: String? = null

    val jsInterface = ChatGptJsInterface(
        onPageLoaded = { success ->
            onStateChanged(if (success) "ChatGPT Loaded" else "Load Failed")
        },
        onResponseCaptured = { resultJson ->
            onResultCaptured(resultJson)
        },
        onError = { error ->
            onStateChanged("Error: $error")
        },
        onAuthRequired = {
            onAuthRequired()
        },
        pendingFilesProvider = { pendingFiles }
    ).apply {
        onImageCapturedCallback = { dataUrl ->
            lastCapturedDataUrl = dataUrl
            Log.i("ChatGptWebAdapter", "🎯 Received captured image DataURL from WebView JS (len=${dataUrl.length})")
        }
    }

    companion object {
        private const val TAG = "ChatGptWebAdapter"
        const val CHATGPT_URL = "https://chatgpt.com"
        const val USER_AGENT =
            "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
    }

    init {
        setupWebView()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        WebView.setWebContentsDebuggingEnabled(true)
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportMultipleWindows(false)
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.userAgentString = USER_AGENT

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.setBackgroundColor(Color.TRANSPARENT)

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        webView.addJavascriptInterface(jsInterface, "DgImagesJs")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                wv: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                val mode = fileChooserParams?.mode
                Log.i(TAG, "📂 onShowFileChooser called! pendingFiles count: ${pendingFiles.size}, mode: $mode")
                this@ChatGptWebAdapter.filePathCallback = filePathCallback
                if (pendingFiles.isNotEmpty()) {
                    val uris = pendingFiles.map { file ->
                        val uri = FileProviderUtils.getContentUri(context, file)
                        try {
                            context.grantUriPermission(context.packageName, uri, android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        } catch (e: Exception) {
                            Log.w(TAG, "grantUriPermission failed for $uri", e)
                        }
                        uri
                    }.toTypedArray()
                    Log.i(TAG, "📂 Passing ${uris.size} URIs to file chooser: ${uris.joinToString()}")
                    filePathCallback?.onReceiveValue(uris)
                    this@ChatGptWebAdapter.filePathCallback = null
                    return true
                }
                Log.w(TAG, "⚠️ onShowFileChooser called but pendingFiles is empty!")
                return false
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                // Ensure auth, oauth redirects, and internal navigations remain inside WebView
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false
                }
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                CookieManager.getInstance().flush()
                onStateChanged("ChatGPT Online")
                checkLoginStatus()
            }
        }

        webView.loadUrl(CHATGPT_URL)
    }

    fun safeEvalJs(js: String, callback: ((String?) -> Unit)? = null) {
        val runnable = Runnable {
            try {
                webView.evaluateJavascript(js) { res ->
                    callback?.invoke(res)
                }
            } catch (t: Throwable) {
                Log.e(TAG, "safeEvalJs error", t)
                callback?.invoke(null)
            }
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            runnable.run()
        } else {
            Handler(Looper.getMainLooper()).post(runnable)
        }
    }

    fun checkLoginStatus(onResult: ((Boolean) -> Unit)? = null) {
        val cookies = CookieManager.getInstance().getCookie(CHATGPT_URL) ?: ""
        val hasSessionCookie = cookies.contains("__Secure") || cookies.contains("session-token") || cookies.contains("_puid") || cookies.contains("oai-")

        val js = """
            (function() {
                try {
                    var composer = document.querySelector("#prompt-textarea, .ProseMirror, button[data-testid='send-button']");
                    var userMsg = document.querySelector("[data-message-author-role]");
                    var loginBtn = document.querySelector("a[href*='login'], button[data-testid*='login']");
                    if (composer || userMsg) return true;
                    if (loginBtn) return false;
                    return ${hasSessionCookie};
                } catch(e) {
                    return ${hasSessionCookie};
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            val isLogged = res?.trim() == "true" || (hasSessionCookie && res?.trim() != "false")
            ChatGptSessionManager.setIsChatGptConnected(isLogged)
            onResult?.invoke(isLogged)
        }
    }

    fun startNewChat(onComplete: ((Boolean) -> Unit)? = null) {
        val js = """
            (function() {
                try {
                    // 1. Ensure sidebar is closed and any modal backdrop is dismissed
                    var hideSidebar = document.querySelector("button[aria-label='Hide sidebar'], button[aria-label='Close sidebar']");
                    if (hideSidebar) { try { hideSidebar.click(); } catch(e) {} }
                    var overlays = document.querySelectorAll(".codex-dialog-overlay, [class*='dialog-overlay']");
                    overlays.forEach(function(o) { try { o.remove(); } catch(e) {} });
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));

                    // 2. Dismiss promo banners ("Stay on web", "Open the app", "Free offer", etc.)
                    var stayBtns = Array.from(document.querySelectorAll("button, a")).filter(function(b) {
                        return /stay on web/i.test(b.innerText || '');
                    });
                    stayBtns.forEach(function(b) { try { b.click(); } catch(e) {} });

                    var appBanners = Array.from(document.querySelectorAll("div, aside, section, header")).filter(function(d) {
                        var txt = d.innerText || '';
                        return txt.indexOf('Open the app') !== -1 || txt.indexOf('Free offer') !== -1;
                    });
                    appBanners.forEach(function(b) {
                        var close = b.querySelector("button, [aria-label*='Close' i], [aria-label*='Dismiss' i]");
                        if (close) { try { close.click(); } catch(e) {} }
                        try { b.remove(); } catch(e) {}
                    });

                    var dismissBtns = document.querySelectorAll(
                        "button[aria-label='Close'], button[aria-label*='Close' i], button[aria-label*='Dismiss' i], button[data-testid*='close'], button.absolute.right-4"
                    );
                    dismissBtns.forEach(function(b) { try { b.click(); } catch(e) {} });

                    // 3. Clear composer attachments from all forms immediately
                    for (var iter = 0; iter < 5; iter++) {
                        var removeBtns = Array.from(document.querySelectorAll("button[aria-label^='Remove '], button[aria-label*='Remove '], .composer-attachment-surface button, [class*='ComposerLayoutAttachments'] button"));
                        if (removeBtns.length === 0) break;
                        removeBtns.forEach(function(b) { try { b.click(); } catch(e) {} });
                    }

                    var fileInputs = document.querySelectorAll('input[type="file"]');
                    fileInputs.forEach(function(input) { try { input.value = ''; } catch(e) {} });

                    // 4. Clear editor text from all forms
                    var editors = document.querySelectorAll(".ProseMirror, #prompt-textarea, [contenteditable='true'], [role='textbox'], textarea");
                    editors.forEach(function(ed) {
                        try {
                            ed.focus();
                            document.execCommand('selectAll', false, null);
                            document.execCommand('delete', false, null);
                            ed.innerText = '';
                            ed.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
                            ed.dispatchEvent(new Event('change', { bubbles: true }));
                        } catch(e) {}
                    });

                    // 5. If we are currently on an existing conversation path (/c/... or /g/...), transition to fresh chat
                    var path = window.location.pathname;
                    if (path.indexOf('/c/') !== -1 || path.indexOf('/g/') !== -1) {
                        var header = Array.from(document.querySelectorAll('header')).find(function(h) {
                            var r = h.getBoundingClientRect();
                            return r.width > 0 && r.height > 0;
                        }) || document.querySelector('header');
                        var headerNewChat = header ? header.querySelector("button[aria-label='New chat'], a[aria-label='New chat'], [data-testid='new-chat-button']") : null;
                        if (headerNewChat) {
                            try {
                                headerNewChat.click();
                                return true;
                            } catch(e) {}
                        }
                        window.location.href = 'https://chatgpt.com/';
                        return true;
                    }

                    // Already at root fresh chat
                    return true;
                } catch(e) {
                    window.location.href = 'https://chatgpt.com/';
                    return true;
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 500L)
        }
    }

    fun ensureComposerReady(timeoutMs: Long = 10000L, onReady: (Boolean) -> Unit) {
        val startTime = System.currentTimeMillis()
        val handler = Handler(Looper.getMainLooper())

        val checkRunnable = object : Runnable {
            override fun run() {
                val js = """
                    (function() {
                        try {
                            var hideSidebar = document.querySelector("button[aria-label='Hide sidebar']");
                            if (hideSidebar) { try { hideSidebar.click(); } catch(e) {} }

                            var composer = document.querySelector("form[data-chatgpt-composer], .ComposerLayoutRoot-XCKS7O, .ProseMirror, input[aria-label*='Attach photos']");
                            return !!composer;
                        } catch(e) {
                            return false;
                        }
                    })();
                """.trimIndent()

                safeEvalJs(js) { res ->
                    val isReady = res?.trim() == "true"
                    if (isReady) {
                        onReady(true)
                    } else if (System.currentTimeMillis() - startTime < timeoutMs) {
                        handler.postDelayed(this, 350L)
                    } else {
                        Log.w(TAG, "⚠️ ensureComposerReady timed out after ${timeoutMs}ms")
                        onReady(false)
                    }
                }
            }
        }
        handler.post(checkRunnable)
    }

    fun clearComposerAttachments(onComplete: ((Int) -> Unit)? = null) {
        val js = """
            (function() {
                try {
                    // 1. Dismiss promo banners & overlays
                    var appBanners = Array.from(document.querySelectorAll("div, aside, section, header")).filter(function(d) {
                        var txt = d.innerText || '';
                        return txt.indexOf('Open the app') !== -1 || txt.indexOf('Free offer') !== -1;
                    });
                    appBanners.forEach(function(b) {
                        var close = b.querySelector("button, [aria-label*='Close' i], [aria-label*='Dismiss' i]");
                        if (close) { try { close.click(); } catch(e) {} }
                        try { b.remove(); } catch(e) {}
                    });

                    // 2. Dismiss drawer if open
                    var hideSidebar = document.querySelector("button[aria-label='Hide sidebar'], button[aria-label='Close sidebar']");
                    if (hideSidebar) { try { hideSidebar.click(); } catch(e) {} }
                    var overlays = document.querySelectorAll(".codex-dialog-overlay, [class*='dialog-overlay']");
                    overlays.forEach(function(o) { try { o.remove(); } catch(e) {} });
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));

                    var forms = Array.from(document.querySelectorAll('form')).filter(function(f) {
                        var r = f.getBoundingClientRect();
                        return r.width > 0 && r.height > 0;
                    });
                    var activeForm = forms[forms.length - 1] || document;

                    var removed = 0;
                    // 3. Click all remove buttons on attached media chips in active composer
                    for (var iter = 0; iter < 5; iter++) {
                        var removeBtns = Array.from(activeForm.querySelectorAll("button[aria-label^='Remove '], button[aria-label*='Remove '], .composer-attachment-surface button, [class*='ComposerLayoutAttachments'] button"));
                        if (removeBtns.length === 0) break;
                        removeBtns.forEach(function(b) {
                            try {
                                b.click();
                                removed++;
                            } catch(e) {}
                        });
                    }

                    // 4. Clear all file inputs in active form
                    var fileInputs = activeForm.querySelectorAll('input[type="file"]');
                    fileInputs.forEach(function(input) {
                        try { input.value = ''; } catch(e) {}
                    });

                    // 5. Clear editor text
                    var editor = activeForm.querySelector(".ProseMirror, #prompt-textarea, [contenteditable='true'], textarea");
                    if (editor) {
                        try {
                            editor.focus();
                            document.execCommand('selectAll', false, null);
                            document.execCommand('delete', false, null);
                        } catch(e) {}
                    }

                    return removed;
                } catch(e) {
                    return 0;
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            val count = res?.trim('"', ' ')?.toIntOrNull() ?: 0
            onComplete?.invoke(count)
        }
    }

    fun attachImages(files: List<File>, onComplete: ((Boolean) -> Unit)? = null) {
        // Take at most 2 distinct files (1 base + 1 ref) to prevent composer overcrowding
        val distinctFiles = files.distinctBy { it.canonicalPath }.take(2)
        this.pendingFiles = distinctFiles
        Log.i(TAG, "📎 attachImages: Queueing ${distinctFiles.size} media file(s) for ChatGPT: ${distinctFiles.map { it.name }}")

        val js = """
            (function() {
                try {
                    // 1. Dismiss any blocking dialogs/popups (e.g. "Stay on web", promo banner, sidebar overlay)
                    var stayBtns = Array.from(document.querySelectorAll("button, a")).filter(function(b) {
                        return /stay on web/i.test(b.innerText || '');
                    });
                    stayBtns.forEach(function(b) { try { b.click(); } catch(e) {} });

                    var appBanners = Array.from(document.querySelectorAll("div, aside, section, header")).filter(function(d) {
                        var txt = d.innerText || '';
                        return txt.indexOf('Open the app') !== -1 || txt.indexOf('Free offer') !== -1;
                    });
                    appBanners.forEach(function(b) {
                        var close = b.querySelector("button, [aria-label*='Close' i], [aria-label*='Dismiss' i]");
                        if (close) { try { close.click(); } catch(e) {} }
                        try { b.remove(); } catch(e) {}
                    });

                    // Dismiss drawer if open so backdrop never blocks composer
                    var hideSidebar = document.querySelector("button[aria-label='Hide sidebar'], button[aria-label='Close sidebar']");
                    if (hideSidebar) { try { hideSidebar.click(); } catch(e) {} }
                    var overlays = document.querySelectorAll(".codex-dialog-overlay, [class*='dialog-overlay']");
                    overlays.forEach(function(o) { try { o.remove(); } catch(e) {} });
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));

                    // 2. Identify active visible composer form
                    var forms = Array.from(document.querySelectorAll('form')).filter(function(f) {
                        var r = f.getBoundingClientRect();
                        return r.width > 0 && r.height > 0;
                    });
                    var activeForm = forms[forms.length - 1] || document;

                    // 3. Clear any previous lingering composer attachment buttons in active form
                    for (var iter = 0; iter < 5; iter++) {
                        var oldRemoveBtns = Array.from(activeForm.querySelectorAll("button[aria-label^='Remove '], button[aria-label*='Remove '], .composer-attachment-surface button, [class*='ComposerLayoutAttachments'] button"));
                        if (oldRemoveBtns.length === 0) break;
                        oldRemoveBtns.forEach(function(b) {
                            try { b.click(); } catch(e) {}
                        });
                    }

                    // 4. Prepare DataTransfer with image blobs from pending files (1 base + 1 ref)
                    var count = window.DgImagesJs ? window.DgImagesJs.getPendingFilesCount() : 0;
                    var dt = new DataTransfer();
                    if (count > 0) {
                        for (var i = 0; i < count; i++) {
                            var b64 = window.DgImagesJs.getPendingFileBase64(i);
                            var name = window.DgImagesJs.getPendingFileName(i);
                            var mime = window.DgImagesJs.getPendingFileMime(i) || 'image/jpeg';
                            if (b64 && b64.length > 0) {
                                var binary = atob(b64);
                                var bytes = new Uint8Array(binary.length);
                                for (var j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
                                var blob = new Blob([bytes], { type: mime });
                                var file = new File([blob], name, { type: mime, lastModified: Date.now() });
                                dt.items.add(file);
                            }
                        }
                    }

                    if (dt.items.length === 0) return false;

                    // 5. Dispatch synthetic ClipboardEvent('paste') to active ProseMirror editor
                    var editor = activeForm.querySelector(".ProseMirror, #prompt-textarea, [contenteditable='true'], textarea") ||
                                 document.querySelector(".ProseMirror, #prompt-textarea, [contenteditable='true'], textarea");

                    if (editor) {
                        try {
                            editor.focus();
                            var pasteEvt = new ClipboardEvent('paste', {
                                bubbles: true,
                                cancelable: true,
                                clipboardData: dt
                            });
                            editor.dispatchEvent(pasteEvt);
                            return true;
                        } catch(e) {}
                    }

                    // Fallback to direct input assignment if editor paste was unavailable
                    var targetInput = activeForm.querySelector("input[aria-label*='Attach photos or videos']") ||
                                      activeForm.querySelector("input[aria-label*='Attach photos']") ||
                                      activeForm.querySelector("input[type='file']");
                    if (targetInput) {
                        try {
                            var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
                            if (desc && desc.set) {
                                desc.set.call(targetInput, dt.files);
                            } else {
                                targetInput.files = dt.files;
                            }
                            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                        } catch(e2) {}
                    }

                    return false;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 600L)
        }
    }

    fun clearPendingFiles() {
        this.pendingFiles = emptyList()
    }

    fun hasAnyComposerAttachments(callback: (Boolean) -> Unit) {
        val js = """
            (function() {
                try {
                    var forms = Array.from(document.querySelectorAll('form')).filter(function(f) {
                        var r = f.getBoundingClientRect();
                        return r.width > 0 && r.height > 0;
                    });
                    var activeForm = forms[forms.length - 1] || document;

                    var removeBtns = activeForm.querySelectorAll("button[aria-label^='Remove '], button[aria-label*='Remove '], .composer-attachment-surface button, [class*='ComposerLayoutAttachments'] button");
                    var readyImgs = Array.from(activeForm.querySelectorAll(".composer-attachment-surface img, [class*='ComposerLayoutAttachments'] img, form img")).filter(function(img) {
                        if (img.closest("[class*='avatar'], header, nav")) return false;
                        return (img.naturalWidth > 10 || img.width > 10 || (img.alt && img.alt.length > 0));
                    });
                    return removeBtns.length > 0 || readyImgs.length > 0;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            callback(res?.trim() == "true")
        }
    }

    fun checkAttachmentsReady(expectedCount: Int = 1, callback: (Boolean) -> Unit) {
        val js = """
            (function(expected) {
                try {
                    var forms = Array.from(document.querySelectorAll('form')).filter(function(f) {
                        var r = f.getBoundingClientRect();
                        return r.width > 0 && r.height > 0;
                    });
                    var activeForm = forms[forms.length - 1] || document;

                    // 1. Check if active upload is in progress (spinner, shimmer, or uploading progressbar)
                    var uploadingProgress = activeForm.querySelectorAll("[role='progressbar'], [aria-label*='Uploading' i], .animate-spin, [data-loading-indicator]");
                    if (uploadingProgress.length > 0) {
                        return false; // Still actively uploading
                    }

                    // 2. Count ready attachment chips
                    var removeBtns = Array.from(activeForm.querySelectorAll("button[aria-label^='Remove '], button[aria-label*='Remove '], .composer-attachment-surface button, [class*='ComposerLayoutAttachments'] button"));
                    var surfaces = Array.from(activeForm.querySelectorAll(".composer-attachment-surface, [class*='ComposerLayoutAttachments'] > div"));
                    var readyImgs = Array.from(activeForm.querySelectorAll(".composer-attachment-surface img, [class*='ComposerLayoutAttachments'] img, form img")).filter(function(img) {
                        if (img.closest("[class*='avatar'], header, nav")) return false;
                        return (img.naturalWidth > 10 || img.width > 10 || (img.alt && img.alt.length > 0)) && img.complete;
                    });

                    var chipCount = Math.max(removeBtns.length, readyImgs.length, surfaces.length);
                    if (expected > 0) {
                        return chipCount >= expected;
                    }
                    return chipCount > 0;
                } catch(e) {
                    return false;
                }
            })($expectedCount);
        """.trimIndent()
        safeEvalJs(js) { res ->
            callback(res?.trim() == "true")
        }
    }

    fun injectPromptAndSubmit(prompt: String, onComplete: ((Boolean) -> Unit)? = null) {
        val escaped = org.json.JSONObject.quote(prompt)
        val js = """
            (function() {
                try {
                    var forms = Array.from(document.querySelectorAll('form')).filter(function(f) {
                        var r = f.getBoundingClientRect();
                        return r.width > 0 && r.height > 0;
                    });
                    var activeForm = forms[forms.length - 1] || document;

                    var editor = activeForm.querySelector(".ProseMirror, #prompt-textarea, [contenteditable='true'], textarea") ||
                                 document.querySelector(".ProseMirror, #prompt-textarea, [contenteditable='true'], textarea");
                    if (!editor) return false;

                    editor.focus();

                    if (editor.isContentEditable) {
                        try {
                            document.execCommand('selectAll', false, null);
                            document.execCommand('insertText', false, $escaped);
                        } catch(e) {
                            var p = editor.querySelector('p');
                            if (!p) {
                                p = document.createElement('p');
                                editor.appendChild(p);
                            }
                            p.innerText = $escaped;
                        }
                        editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: $escaped }));
                    } else {
                        editor.value = $escaped;
                        editor.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    editor.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(function() {
                        var sendBtn = activeForm.querySelector("button[aria-label='Send']") ||
                                      activeForm.querySelector("button[data-testid='send-button']") ||
                                      activeForm.querySelector("button.bg-composer-primary") ||
                                      document.querySelector("button[aria-label='Send']") ||
                                      document.querySelector("button[data-testid='send-button']") ||
                                      document.querySelector("button.bg-composer-primary");
                        if (sendBtn) {
                            sendBtn.removeAttribute('disabled');
                            sendBtn.removeAttribute('aria-disabled');

                            var reactKey = Object.keys(sendBtn).find(function(k) {
                                return k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers');
                            });
                            var props = reactKey ? sendBtn[reactKey] : null;
                            if (props && typeof props.onClick === 'function') {
                                try {
                                    props.onClick({
                                        preventDefault: function(){},
                                        stopPropagation: function(){},
                                        currentTarget: sendBtn,
                                        target: sendBtn,
                                        isDefaultPrevented: function(){ return false; }
                                    });
                                } catch(e) {}
                            }

                            var rect = sendBtn.getBoundingClientRect();
                            var opts = { bubbles: true, cancelable: true, view: window, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 };
                            sendBtn.dispatchEvent(new PointerEvent('pointerdown', opts));
                            sendBtn.dispatchEvent(new MouseEvent('mousedown', opts));
                            sendBtn.dispatchEvent(new PointerEvent('pointerup', opts));
                            sendBtn.dispatchEvent(new MouseEvent('mouseup', opts));
                            var form = sendBtn.closest('form');
                            if (form && typeof form.requestSubmit === 'function') {
                                try { form.requestSubmit(sendBtn); } catch(e) { sendBtn.click(); }
                            } else {
                                sendBtn.click();
                            }
                        } else {
                            editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                        }
                    }, 500);

                    return true;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 1000L)
        }
    }

    fun getAssistantTurnCount(callback: (Int) -> Unit) {
        val js = """
            (function() {
                try {
                    var turns = document.querySelectorAll("div[data-message-author-role='assistant'], article, [data-testid*='turn'], [class*='turn-action-controls']");
                    return turns.length;
                } catch(e) {
                    return 0;
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            val count = res?.trim('"', ' ')?.toIntOrNull() ?: 0
            callback(count)
        }
    }

    fun getExistingAssistantImageUrls(callback: (List<String>) -> Unit) {
        val js = """
            (function() {
                try {
                    // Collect every existing image src currently in the document
                    var allImgs = Array.from(document.querySelectorAll("img")).map(function(img) {
                        return img.currentSrc || img.src || '';
                    }).filter(Boolean);
                    return JSON.stringify(allImgs);
                } catch(e) {
                    return "[]";
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            try {
                val clean = res?.trim('"', ' ', '\n') ?: "[]"
                val unescaped = if (clean.startsWith("[") && clean.endsWith("]")) {
                    org.json.JSONArray(clean)
                } else {
                    val raw = org.json.JSONTokener(res ?: "[]").nextValue()
                    if (raw is String) org.json.JSONArray(raw) else raw as org.json.JSONArray
                }
                val list = mutableListOf<String>()
                for (i in 0 until unescaped.length()) {
                    list.add(unescaped.getString(i))
                }
                callback(list)
            } catch (e: Exception) {
                callback(emptyList())
            }
        }
    }

    fun captureGeneratedImage(
        initialTurnCount: Int = 0,
        excludeUrls: List<String> = emptyList(),
        callback: (String?) -> Unit
    ) {
        val excludeJson = org.json.JSONArray(excludeUrls).toString()
        val js = """
            (function() {
                try {
                    // 1. Auto-scroll transcript container to bottom so turns & images render
                    var scroller = document.querySelector("[class*='scroll-container'], [class*='scrollContainer'], main, div[role='region']");
                    if (scroller) {
                        scroller.scrollTop = scroller.scrollHeight;
                    }

                    // 2. Check if generation is still active (detect stop buttons or streaming indicators)
                    var stopBtn = document.querySelector(
                        "button[data-testid='stop-button'], button[aria-label*='Stop generating' i], button[aria-label*='Stop streaming' i], [data-testid='fruitjuice-stop-button'], [data-testid*='stop-button']"
                    );
                    var isStreaming = !!document.querySelector("[class*='result-streaming'], [class*='streaming'], [data-testid*='streaming']");
                    var isWorking = !!stopBtn || isStreaming;

                    var excludeList = $excludeJson;
                    var excludeSet = new Set(excludeList);

                    // 3. Find candidate generated images anywhere in the conversation
                    var genImgs = Array.from(document.querySelectorAll("img")).filter(function(img) {
                        if (img.getAttribute('alt') === 'User attachment') return false;
                        if (img.closest("[class*='composer-attachment']")) return false;
                        if (img.closest("form")) return false;
                        if (img.closest("[class*='avatar']")) return false;
                        var src = img.currentSrc || img.src || '';
                        if (!src) return false;
                        if (excludeSet.has(src)) return false;

                        var isGen = !!img.closest("[class*='generated-image']") ||
                                    /generated/i.test(img.getAttribute('alt') || '') ||
                                    src.indexOf('oaiusercontent.com') !== -1 ||
                                    (src.startsWith('blob:') && (img.naturalWidth || 0) > 400) ||
                                    ((img.naturalWidth || 0) > 500 && (img.naturalHeight || 0) > 280);
                        return isGen;
                    });

                    if (genImgs.length === 0) {
                        // Check if generation finished and assistant replied with text instead
                        if (!isWorking) {
                            var turnTexts = Array.from(document.querySelectorAll("[data-message-author-role='assistant'], [class*='agent-turn'], [class*='assistant']"));
                            if (turnTexts.length > 0) {
                                var txt = (turnTexts[turnTexts.length - 1].innerText || '').trim();
                                if (txt.length > 0 && !/creating|generating|drawing|thinking/i.test(txt)) {
                                    return "TEXT_RESPONSE:" + txt;
                                }
                            }
                        }
                        return "GENERATING";
                    }

                    // If still actively streaming/generating, wait for completion
                    if (isWorking) {
                        return "GENERATING";
                    }

                    // Pick the LAST generated image in DOM order (the newest assistant generation)
                    var bestImg = genImgs[genImgs.length - 1];

                    // Verify image has finished loading
                    if (!bestImg.complete || (bestImg.naturalWidth && bestImg.naturalWidth < 180)) {
                        return "LOADING";
                    }

                    var targetSrc = bestImg.currentSrc || bestImg.src || '';

                    // Synchronously render to canvas and extract JPEG Base64 DataURL
                    try {
                        var canvas = document.createElement('canvas');
                        canvas.width = bestImg.naturalWidth || 1280;
                        canvas.height = bestImg.naturalHeight || 720;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(bestImg, 0, 0);
                        var dUrl = canvas.toDataURL('image/jpeg', 0.95);
                        if (dUrl && dUrl.length > 200) {
                            if (window.DgImagesJs && window.DgImagesJs.onCapturedImageDataUrl) {
                                window.DgImagesJs.onCapturedImageDataUrl(dUrl);
                            }
                            return dUrl;
                        }
                    } catch(e) {}

                    // Authenticated in-WebView fetch fallback
                    if (targetSrc && window.DgImagesJs && window.DgImagesJs.onCapturedImageDataUrl) {
                        fetch(targetSrc)
                            .then(function(r) { return r.blob(); })
                            .then(function(blob) {
                                var reader = new FileReader();
                                reader.onloadend = function() {
                                    if (reader.result && window.DgImagesJs && window.DgImagesJs.onCapturedImageDataUrl) {
                                        window.DgImagesJs.onCapturedImageDataUrl(reader.result);
                                    }
                                };
                                reader.readAsDataURL(blob);
                            })
                            .catch(function(err) {});
                    }

                    return targetSrc || null;
                } catch(e) {
                    return null;
                }
            })();
        """.trimIndent()
        safeEvalJs(js) { res ->
            val clean = res?.trim('"', ' ', '\n')
            val pushed = lastCapturedDataUrl
            if (!pushed.isNullOrBlank() && pushed.startsWith("data:")) {
                callback(pushed)
            } else if (clean != null && clean.startsWith("data:")) {
                callback(clean)
            } else if (clean != null && clean.startsWith("blob:")) {
                callback(clean)
            } else if (!clean.isNullOrEmpty() && clean != "null") {
                callback(clean)
            } else {
                callback(null)
            }
        }
    }
}
