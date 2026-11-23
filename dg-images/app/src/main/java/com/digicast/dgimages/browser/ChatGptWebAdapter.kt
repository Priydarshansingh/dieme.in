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
                    // 1. Dismiss any blocking dialogs, promo modals ("Stay on web", "Create richer images", "Open the app", etc.)
                    var stayBtn = Array.from(document.querySelectorAll("button, a")).find(function(b) {
                        return (b.innerText || '').toLowerCase().indexOf("stay on web") !== -1;
                    });
                    if (stayBtn) { try { stayBtn.click(); } catch(e) {} }

                    var dismissBtns = document.querySelectorAll(
                        "button[aria-label='Close'], button[aria-label*='Close' i], button[data-testid*='close'], div[role='dialog'] button:has(svg), button.absolute.right-4"
                    );
                    dismissBtns.forEach(function(b) { try { b.click(); } catch(e) {} });

                    // 2. If sidebar drawer is open, close it (or use "New chat" inside sidebar)
                    var newChatBtn = Array.from(document.querySelectorAll("button, a")).find(function(b) {
                        var txt = (b.innerText || b.getAttribute('aria-label') || '').toLowerCase().trim();
                        return txt === 'new chat' || txt.indexOf('new chat') !== -1;
                    });
                    if (newChatBtn) {
                        newChatBtn.click();
                        setTimeout(function() {
                            var hideSidebar = document.querySelector("button[aria-label*='Hide sidebar' i], button[aria-label*='Close sidebar' i]");
                            if (hideSidebar) hideSidebar.click();
                        }, 300);
                        return true;
                    }

                    var hideSidebar = document.querySelector("button[aria-label*='Hide sidebar' i], button[aria-label*='Close sidebar' i]");
                    if (hideSidebar) { try { hideSidebar.click(); } catch(e) {} }

                    var topNewChat = document.querySelector("a[href='/'], [data-testid*='new-chat']");
                    if (topNewChat) {
                        topNewChat.click();
                        return true;
                    }

                    if (window.location.pathname.indexOf('/c/') !== -1) {
                        window.location.href = 'https://chatgpt.com/';
                    } else {
                        // Clear any lingering composer attachment buttons
                        var removeBtns = document.querySelectorAll("button[aria-label*='Remove' i], button[aria-label*='Delete' i]");
                        removeBtns.forEach(function(b) { try { b.click(); } catch(e) {} });
                    }
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

    fun clearComposerAttachments(onComplete: ((Int) -> Unit)? = null) {
        val js = """
            (function() {
                try {
                    // Close any open popups/banners first
                    var stayBtn = Array.from(document.querySelectorAll("button, a")).find(function(b) {
                        return (b.innerText || '').toLowerCase().indexOf("stay on web") !== -1;
                    });
                    if (stayBtn) { try { stayBtn.click(); } catch(e) {} }

                    var dismissBtns = document.querySelectorAll(
                        "button[aria-label='Close'], button[aria-label*='Close' i], button[data-testid*='close'], div[role='dialog'] button:has(svg), button.absolute.right-4"
                    );
                    dismissBtns.forEach(function(b) {
                        try { b.click(); } catch(e) {}
                    });

                    // Close sidebar if open
                    var hideSidebar = document.querySelector("button[aria-label*='Hide sidebar' i], button[aria-label*='Close sidebar' i]");
                    if (hideSidebar) { try { hideSidebar.click(); } catch(e) {} }

                    var removed = 0;
                    var removeBtns = document.querySelectorAll(
                        "button[aria-label*='Remove' i], button[aria-label*='Delete' i], [data-testid*='remove-attachment'], .composer-attachment-surface button, [class*='attachment'] button"
                    );
                    removeBtns.forEach(function(b) {
                        try {
                            b.click();
                            removed++;
                        } catch(e) {}
                    });

                    var fileInputs = document.querySelectorAll('input[type="file"]');
                    fileInputs.forEach(function(input) {
                        try { input.value = ''; } catch(e) {}
                    });

                    return removed;
                } catch(e) {
                    return 0;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            val count = res?.trim('"', ' ')?.toIntOrNull() ?: 0
            onComplete?.invoke(count)
        }
    }

    fun attachImages(files: List<File>, onComplete: ((Boolean) -> Unit)? = null) {
        // Deduplicate files to prevent duplicate attachments
        val distinctFiles = files.distinctBy { it.canonicalPath }
        this.pendingFiles = distinctFiles
        Log.i(TAG, "📎 attachImages: Queueing ${distinctFiles.size} media file(s) for ChatGPT (distinct from ${files.size}): ${distinctFiles.map { it.name }}")

        val js = """
            (function() {
                try {
                    // 1. Dismiss any blocking dialogs/popups (e.g. "Stay on web", promo banner)
                    var stayBtn = Array.from(document.querySelectorAll("button, a")).find(function(b) {
                        return (b.innerText || '').toLowerCase().indexOf("stay on web") !== -1;
                    });
                    if (stayBtn) { try { stayBtn.click(); } catch(e) {} }

                    var dismissBtns = document.querySelectorAll(
                        "button[aria-label='Close'], button[aria-label*='Close' i], button[data-testid*='close'], div[role='dialog'] button:has(svg), button.absolute.right-4"
                    );
                    dismissBtns.forEach(function(b) {
                        try { b.click(); } catch(e) {}
                    });

                    // 2. Close sidebar if open so backdrop never blocks composer
                    var hideSidebar = document.querySelector("button[aria-label*='Hide sidebar' i], button[aria-label*='Close sidebar' i]");
                    if (hideSidebar) { try { hideSidebar.click(); } catch(e) {} }

                    // 3. Clear any previous lingering composer attachment buttons
                    var oldRemoveBtns = document.querySelectorAll(
                        "button[aria-label*='Remove' i], button[aria-label*='Delete' i], [data-testid*='remove-attachment'], .composer-attachment-surface button"
                    );
                    oldRemoveBtns.forEach(function(b) {
                        try { b.click(); } catch(e) {}
                    });

                    // 4. Prepare DataTransfer with image blobs from pending files
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

                    // 5. Select non-capture photo input (specifically target input[aria-label="Attach photos"])
                    var allInputs = Array.from(document.querySelectorAll('input[type="file"]'));
                    var nonCaptureInputs = allInputs.filter(function(i) {
                        return !i.hasAttribute('capture');
                    });

                    var imgInput = document.querySelector("input[aria-label='Attach photos']") ||
                                   document.querySelector("input[aria-label*='Attach photos' i]") ||
                                   nonCaptureInputs.find(function(i) {
                                       return i.accept && i.accept === 'image/*';
                                   }) ||
                                   nonCaptureInputs.find(function(i) {
                                       var label = (i.getAttribute('aria-label') || '').toLowerCase();
                                       return label.indexOf('photo') !== -1 || label.indexOf('attach') !== -1;
                                   }) ||
                                   nonCaptureInputs[0] ||
                                   allInputs[0];

                    if (imgInput) {
                        try {
                            imgInput.files = dt.files;
                            imgInput.dispatchEvent(new Event('change', { bubbles: true }));
                            imgInput.dispatchEvent(new Event('input', { bubbles: true }));
                            return true;
                        } catch(e) {}
                    }

                    // 6. Fallback strategy: Synthetic paste event on #prompt-textarea
                    var editor = document.querySelector("#prompt-textarea, .ProseMirror, [contenteditable='true'], textarea");
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

                    // 7. Secondary fallback: click attachment plus button only if input not yet present
                    var plusBtn = document.querySelector(
                        "button[aria-label*='Add files' i], " +
                        "button[aria-label*='Attach' i], " +
                        "button[aria-label*='Upload' i], " +
                        "button[data-testid*='attach-button'], " +
                        "button[data-testid*='composer-plus']"
                    );

                    if (plusBtn) {
                        plusBtn.click();
                        return true;
                    }

                    return false;
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
                    // 1. Check if file upload is still in progress (pending state)
                    var pendingUpload = Array.from(document.querySelectorAll("button")).find(function(b) {
                        return (b.getAttribute('aria-label') || '').toLowerCase().indexOf('file upload pending') !== -1;
                    });
                    if (pendingUpload) {
                        return false; // Still uploading to OpenAI CDN!
                    }

                    var progressBars = document.querySelectorAll("[role='progressbar']");
                    if (progressBars.length > 0) {
                        return false; // Active progress bar!
                    }

                    // 2. Check for removal buttons which indicate attached media chips in composer
                    var removeButtons = Array.from(document.querySelectorAll("button[aria-label*='Remove' i], button[aria-label*='Delete' i]"));
                    if (removeButtons.length > 0) {
                        // Check if any attachment is showing an upload error
                        for (var i = 0; i < removeButtons.length; i++) {
                            var parent = removeButtons[i].parentElement || removeButtons[i];
                            var text = (parent.innerText || '').toLowerCase();
                            if (text.indexOf("upload failed") !== -1 || text.indexOf("failed") !== -1) {
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
                    }

                    // Fallback to composer attachment surface or preview elements
                    var attachments = document.querySelectorAll(
                        ".composer-attachment-surface, [class*='composer-attachment'], [data-testid*='attachment'], [data-testid*='file-thumbnail'], [data-testid*='image-preview'], form img:not([class*='avatar']), [class*='attachment-preview']"
                    );

                    if (attachments.length === 0) {
                        return false;
                    }

                    for (var j = 0; j < attachments.length; j++) {
                        var t = (attachments[j].innerText || '').toLowerCase();
                        if (t.indexOf("upload failed") !== -1 || t.indexOf("failed") !== -1) {
                            return false;
                        }
                    }

                    var spinners = Array.from(document.querySelectorAll(".animate-spin, [role='progressbar']")).filter(function(el) {
                        var style = el.getAttribute('style') || '';
                        var inner = el.querySelector("[style*='play-state: paused']");
                        if (style.indexOf('paused') !== -1 || inner) return false;
                        return true;
                    });

                    return spinners.length === 0;
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

                    // If ProseMirror or contentEditable, use execCommand & InputEvent to update React state
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
                        var sendBtn = Array.from(document.querySelectorAll("button")).find(function(b) {
                            return /send|submit/i.test(b.getAttribute('aria-label') || b.innerText || '') ||
                                   (b.className && b.className.indexOf('bg-composer-primary') !== -1);
                        });
                        if (sendBtn) {
                            sendBtn.removeAttribute('disabled');
                            sendBtn.removeAttribute('aria-disabled');

                            // 1. Invoke React onClick prop directly if present
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

                            // 2. Dispatch simulated events & click
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

                    var targetSrc = bestImg.currentSrc || bestImg.src || '';

                    // Authenticated in-WebView fetch to extract Base64 DataURL directly
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
                            .catch(function(err) {
                                try {
                                    var canvas = document.createElement('canvas');
                                    canvas.width = bestImg.naturalWidth || 1280;
                                    canvas.height = bestImg.naturalHeight || 720;
                                    var ctx = canvas.getContext('2d');
                                    ctx.drawImage(bestImg, 0, 0);
                                    var dUrl = canvas.toDataURL('image/jpeg', 0.95);
                                    if (dUrl && dUrl.length > 200 && window.DgImagesJs && window.DgImagesJs.onCapturedImageDataUrl) {
                                        window.DgImagesJs.onCapturedImageDataUrl(dUrl);
                                    }
                                } catch(e2) {}
                            });
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

                    return targetSrc || null;
                } catch(e) {
                    return null;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            val clean = res?.trim('"', ' ', '\n')
            val pushed = lastCapturedDataUrl
            if (!pushed.isNullOrBlank()) {
                callback(pushed)
            } else if (!clean.isNullOrEmpty() && clean != "null") {
                callback(clean)
            } else {
                callback(null)
            }
        }
    }
}
