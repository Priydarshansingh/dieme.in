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
        )

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
        webView.evaluateJavascript(js) { res ->
            val isLogged = res?.trim() == "true" || (hasSessionCookie && res?.trim() != "false")
            ChatGptSessionManager.setIsChatGptConnected(isLogged)
            onResult?.invoke(isLogged)
        }
    }

    fun startNewChat(onComplete: ((Boolean) -> Unit)? = null) {
        val js = """
            (function() {
                try {
                    var newBtn = document.querySelector("a[href='/'], button[aria-label*='New chat' i], [data-testid*='new-chat']");
                    if (newBtn) {
                        newBtn.click();
                        return true;
                    }
                    var allLinks = Array.from(document.querySelectorAll("button, a"));
                    for (var i = 0; i < allLinks.length; i++) {
                        var t = (allLinks[i].innerText || allLinks[i].getAttribute('aria-label') || '').toLowerCase().trim();
                        if (t === 'new chat' || t.indexOf('new chat') !== -1) {
                            allLinks[i].click();
                            return true;
                        }
                    }
                    window.location.href = 'https://chatgpt.com/';
                    return true;
                } catch(e) {
                    window.location.href = 'https://chatgpt.com/';
                    return true;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 1500L)
        }
    }

    fun attachImages(files: List<File>, onComplete: ((Boolean) -> Unit)? = null) {
        this.pendingFiles = files
        Log.i(TAG, "📎 attachImages: Queueing ${files.size} media file(s) for ChatGPT: ${files.map { it.name }}")

        val js = """
            (function() {
                try {
                    // 1. Dismiss any blocking dialogs/popups (e.g. "Create richer images" promo banner)
                    var dismissBtns = document.querySelectorAll(
                        "button[aria-label='Close'], button[data-testid*='close'], div[role='dialog'] button:has(svg), button.absolute.right-4"
                    );
                    dismissBtns.forEach(function(b) {
                        try { b.click(); } catch(e) {}
                    });

                    // 2. Prepare DataTransfer with image blobs from pending files
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

                    // Strategy A: Synthetic paste event on #prompt-textarea
                    var editor = document.querySelector("#prompt-textarea, .ProseMirror, [contenteditable='true'], textarea");
                    if (editor && dt.items.length > 0) {
                        try {
                            editor.focus();
                            var pasteEvt = new ClipboardEvent('paste', {
                                bubbles: true,
                                cancelable: true,
                                clipboardData: dt
                            });
                            editor.dispatchEvent(pasteEvt);
                        } catch(e) {}
                    }

                    // Strategy B: Trigger native file input if directly mounted
                    var existingInputs = Array.from(document.querySelectorAll('input[type="file"]'));
                    if (existingInputs.length > 0) {
                        try {
                            existingInputs[0].click();
                            return true;
                        } catch(e) {}
                    }

                    // Strategy C: Click the "+" attachment button, then click "Photos" or "Files"
                    var plusBtn = document.querySelector(
                        "button[aria-label*='Attach' i], " +
                        "button[aria-label*='Upload' i], " +
                        "button[aria-label*='Add' i], " +
                        "button[data-testid*='attach-button'], " +
                        "button[data-testid*='composer-plus'], " +
                        "button[aria-haspopup='menu'], " +
                        "form button:not([data-testid*='send']):not([aria-label*='Send' i])"
                    );

                    if (plusBtn) {
                        plusBtn.click();
                        setTimeout(function() {
                            var items = Array.from(document.querySelectorAll("[role='menuitem'], button, div, span"));
                            var photoItem = items.find(function(el) {
                                var txt = (el.innerText || '').trim().toLowerCase();
                                return txt === 'photos' || txt === 'files' || txt.indexOf('photos') !== -1 || txt.indexOf('files') !== -1;
                            });
                            if (photoItem) {
                                photoItem.click();
                            } else {
                                var newInput = document.querySelector('input[type="file"]');
                                if (newInput) newInput.click();
                            }
                        }, 250);
                        return true;
                    }

                    return dt.items.length > 0;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 600L)
        }
    }

    fun clearPendingFiles() {
        this.pendingFiles = emptyList()
    }

    fun checkAttachmentsReady(callback: (Boolean) -> Unit) {
        val js = """
            (function() {
                try {
                    // Check for attachments inside the composer form
                    var attachments = document.querySelectorAll(
                        "button[aria-label*='Remove ' i], " +
                        ".composer-attachment-surface, " +
                        "[class*='composer-attachment'], " +
                        "[data-testid*='attachment'], " +
                        "[data-testid*='file-thumbnail'], " +
                        "[data-testid*='image-preview'], " +
                        "form img:not([class*='avatar']), " +
                        "[class*='attachment-preview']"
                    );

                    if (attachments.length === 0) {
                        return false;
                    }

                    // Check if any attachment is showing an upload error
                    for (var i = 0; i < attachments.length; i++) {
                        var text = attachments[i].innerText || "";
                        if (text.indexOf("Upload failed") !== -1 || text.indexOf("failed") !== -1) {
                            return false;
                        }
                    }

                    // Ensure none of the attachments are currently actively uploading
                    var activeSpinners = Array.from(document.querySelectorAll(".animate-spin, [role='progressbar']")).filter(function(el) {
                        var style = el.getAttribute('style') || '';
                        var inner = el.querySelector("[style*='play-state: paused']");
                        if (style.indexOf('paused') !== -1 || inner) return false;
                        return true;
                    });

                    return activeSpinners.length === 0;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            callback(res?.trim() == "true")
        }
    }

    fun injectPromptAndSubmit(prompt: String, onComplete: ((Boolean) -> Unit)? = null) {
        val escaped = org.json.JSONObject.quote(prompt)
        val js = """
            (function() {
                try {
                    var editor = document.querySelector("#prompt-textarea, .ProseMirror, [contenteditable='true'], textarea");
                    if (!editor) return false;

                    editor.focus();

                    // If ProseMirror or contentEditable, use execCommand to create a transaction so React state & send button update
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
                    } else {
                        editor.value = $escaped;
                    }

                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    editor.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(function() {
                        var sendBtn = document.querySelector("button[aria-label='Send'], button.bg-composer-primary, button[data-testid='send-button'], button[aria-label*='Send' i], button[aria-label*='Submit' i]");
                        if (sendBtn) {
                            sendBtn.removeAttribute('disabled');
                            sendBtn.removeAttribute('aria-disabled');
                            var rect = sendBtn.getBoundingClientRect();
                            var opts = { bubbles: true, cancelable: true, view: window, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 };
                            sendBtn.dispatchEvent(new PointerEvent('pointerdown', opts));
                            sendBtn.dispatchEvent(new MouseEvent('mousedown', opts));
                            sendBtn.dispatchEvent(new PointerEvent('pointerup', opts));
                            sendBtn.dispatchEvent(new MouseEvent('mouseup', opts));
                            sendBtn.click();
                        } else {
                            editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                        }
                    }, 600);

                    return true;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 1200L)
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
        webView.evaluateJavascript(js) { res ->
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
        webView.evaluateJavascript(js) { res ->
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
                    var allImgs = Array.from(document.querySelectorAll("img")).filter(function(img) {
                        if (img.getAttribute('alt') === 'User attachment') return false;
                        if (img.closest("[class*='composer-attachment']")) return false;
                        if (img.closest("form")) return false;
                        if (img.closest("[class*='avatar']")) return false;
                        var src = img.currentSrc || img.src || '';
                        if (!src) return false;
                        if (excludeSet.has(src)) return false;

                        var isGen = /generated/i.test(img.getAttribute('alt') || '') ||
                                    src.indexOf('oaiusercontent.com') !== -1 ||
                                    (src.startsWith('blob:') && (img.naturalWidth || 0) > 300) ||
                                    ((img.naturalWidth || 0) > 400 && (img.naturalHeight || 0) > 200);
                        return isGen;
                    });

                    if (allImgs.length === 0) {
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

                    // Sort by area (width * height) descending so the full 1080p canvas takes priority
                    allImgs.sort(function(a, b) {
                        var areaA = (a.naturalWidth || 0) * (a.naturalHeight || 0);
                        var areaB = (b.naturalWidth || 0) * (b.naturalHeight || 0);
                        return areaB - areaA;
                    });

                    var bestImg = allImgs[0];

                    // Verify image has finished loading
                    if (!bestImg.complete || (bestImg.naturalWidth && bestImg.naturalWidth < 180)) {
                        return "LOADING";
                    }

                    try {
                        var canvas = document.createElement('canvas');
                        canvas.width = bestImg.naturalWidth || bestImg.width || 1280;
                        canvas.height = bestImg.naturalHeight || bestImg.height || 720;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(bestImg, 0, 0);
                        var dUrl = canvas.toDataURL('image/jpeg', 0.95);
                        if (dUrl && dUrl.length > 200) {
                            return dUrl;
                        }
                    } catch(e) {}

                    return bestImg.currentSrc || bestImg.src || null;
                } catch(e) {
                    return null;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            val clean = res?.trim('"', ' ', '\n')
            if (!clean.isNullOrEmpty() && clean != "null") {
                callback(clean)
            } else {
                callback(null)
            }
        }
    }
}
