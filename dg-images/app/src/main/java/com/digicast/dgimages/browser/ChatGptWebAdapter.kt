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
                Log.i(TAG, "📂 onShowFileChooser called! pendingFiles count: ${pendingFiles.size}")
                this@ChatGptWebAdapter.filePathCallback = filePathCallback
                if (pendingFiles.isNotEmpty()) {
                    val uris = pendingFiles.map { FileProviderUtils.getContentUri(context, it) }.toTypedArray()
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
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                CookieManager.getInstance().flush()
                onStateChanged("ChatGPT Online")
            }
        }

        webView.loadUrl(CHATGPT_URL)
    }

    fun startNewChat(onComplete: ((Boolean) -> Unit)? = null) {
        val js = """
            (function() {
                var newBtn = document.querySelector("a[href='/'], button[aria-label*='New chat' i], a[aria-label*='New chat' i]");
                if (newBtn) {
                    newBtn.click();
                    return true;
                }
                window.location.href = 'https://chatgpt.com/';
                return true;
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 800)
        }
    }

    fun attachImages(files: List<File>, onComplete: ((Boolean) -> Unit)? = null) {
        this.pendingFiles = files
        Log.i(TAG, "📎 attachImages: Queueing ${files.size} media file(s) for ChatGPT")

        val js = """
            (function() {
                try {
                    var count = window.DgImagesJs ? window.DgImagesJs.getPendingFilesCount() : 0;
                    if (count <= 0) return false;

                    var dt = new DataTransfer();
                    for (var i = 0; i < count; i++) {
                        var b64 = window.DgImagesJs.getPendingFileBase64(i);
                        var name = window.DgImagesJs.getPendingFileName(i);
                        var mime = window.DgImagesJs.getPendingFileMime(i) || 'image/jpeg';
                        if (b64 && b64.length > 0) {
                            var binary = atob(b64);
                            var bytes = new Uint8Array(binary.length);
                            for (var j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
                            var blob = new Blob([bytes], { type: mime });
                            var file = new File([blob], name, { type: mime });
                            dt.items.add(file);
                        }
                    }

                    // 1. Locate file inputs or trigger upload button
                    var fileInputs = Array.from(document.querySelectorAll("input[type='file']"));
                    if (fileInputs.length === 0) {
                        var attachBtn = document.querySelector("button[aria-label*='Attach' i], button[data-testid='attach-button'], button[aria-label*='Add files' i], button[aria-label*='Upload' i]");
                        if (attachBtn) {
                            try { attachBtn.click(); } catch(e) {}
                        }
                        fileInputs = Array.from(document.querySelectorAll("input[type='file']"));
                    }

                    // 2. Set files on all relevant file inputs to ensure React picks up all files (Base + References)
                    var applied = false;
                    for (var k = 0; k < fileInputs.length; k++) {
                        var inp = fileInputs[k];
                        try {
                            inp.removeAttribute('disabled');
                            inp.setAttribute('multiple', '');
                            inp.multiple = true;
                            try {
                                var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files').set;
                                setter.call(inp, dt.files);
                            } catch(e) {
                                inp.files = dt.files;
                            }
                            inp.dispatchEvent(new Event('input', { bubbles: true }));
                            inp.dispatchEvent(new Event('change', { bubbles: true }));
                            applied = true;
                        } catch(e) {}
                    }

                    // 3. Dispatch drop and paste events directly to prompt textarea
                    var editor = document.querySelector("#prompt-textarea, div[contenteditable='true'], textarea") || document.body;
                    if (editor) {
                        try {
                            var dropEvt = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
                            editor.dispatchEvent(dropEvt);
                        } catch(e) {}
                        try {
                            var pasteEvt = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
                            editor.dispatchEvent(pasteEvt);
                        } catch(e) {}
                    }
                    return true;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 1200)
        }
    }

    fun checkAttachmentsReady(callback: (Boolean) -> Unit) {
        val js = """
            (function() {
                try {
                    // Check for attachments inside the composer form
                    var attachments = document.querySelectorAll(
                        "[data-testid*='attachment'], " +
                        "[class*='attachment'], " +
                        "[data-testid*='file-thumbnail'], " +
                        "form img[src*='blob:'], " +
                        "#prompt-textarea ~ div img, " +
                        "[data-testid*='composer'] img"
                    );

                    if (attachments.length === 0) {
                        return false;
                    }

                    // Ensure none of the attachments are currently uploading or spinning
                    var uploading = document.querySelectorAll(
                        "[role='progressbar'], " +
                        ".animate-spin, " +
                        "[aria-label*='Uploading' i], " +
                        "[aria-label*='Processing' i]"
                    );
                    return uploading.length === 0;
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
                    var editor = document.querySelector("#prompt-textarea, div[contenteditable='true'], textarea");
                    if (!editor) return false;

                    editor.focus();
                    if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
                        editor.value = $escaped;
                    } else {
                        editor.innerText = $escaped;
                    }
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                    editor.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(function() {
                        var sendBtn = document.querySelector("button[data-testid='send-button'], button[aria-label*='Send' i], button[aria-label*='Submit' i]");
                        if (sendBtn && !sendBtn.disabled) {
                            sendBtn.click();
                        }
                    }, 600);

                    return true;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            onComplete?.invoke(res?.trim() == "true")
        }
    }

    fun getExistingAssistantImageUrls(callback: (List<String>) -> Unit) {
        val js = """
            (function() {
                try {
                    var userContainers = document.querySelectorAll("div[data-message-author-role='user'], #prompt-textarea, [data-testid*='attachment']");
                    var userImgs = new Set();
                    userContainers.forEach(function(c) {
                        c.querySelectorAll("img").forEach(function(i) { userImgs.add(i); });
                    });

                    var assistantImgs = Array.from(document.querySelectorAll(
                        "div[data-message-author-role='assistant'] img, " +
                        "[data-testid*='conversation-turn']:not(:has([data-message-author-role='user'])) img, " +
                        "img[alt*='Generated' i], " +
                        "img[src*='oaiusercontent.com']"
                    )).filter(function(img) {
                        return !userImgs.has(img);
                    });

                    var urls = assistantImgs.map(function(img) {
                        return img.currentSrc || img.src || '';
                    }).filter(Boolean);

                    return JSON.stringify(urls);
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

    fun captureGeneratedImage(excludeUrls: List<String> = emptyList(), callback: (String?) -> Unit) {
        val excludeJson = org.json.JSONArray(excludeUrls).toString()
        val js = """
            (function() {
                try {
                    // Check if generation is still active (Stop button visible)
                    var stopBtn = document.querySelector("button[data-testid='stop-button'], button[aria-label*='Stop' i]");
                    if (stopBtn) {
                        return "GENERATING";
                    }

                    var excludeList = $excludeJson;
                    var excludeSet = new Set(excludeList);

                    // Exclude images from user message containers or editor attachment thumbnails
                    var userContainers = document.querySelectorAll("div[data-message-author-role='user'], #prompt-textarea, [data-testid*='attachment']");
                    var userImgs = new Set();
                    userContainers.forEach(function(c) {
                        c.querySelectorAll("img").forEach(function(i) { userImgs.add(i); });
                    });

                    // Target assistant generated image candidates
                    var assistantImgs = Array.from(document.querySelectorAll(
                        "div[data-message-author-role='assistant'] img, " +
                        "[data-testid*='conversation-turn']:not(:has([data-message-author-role='user'])) img, " +
                        "img[alt*='Generated' i], " +
                        "img[src*='oaiusercontent.com']"
                    )).filter(function(img) {
                        if (userImgs.has(img)) return false;
                        var src = img.currentSrc || img.src || '';
                        if (!src) return false;
                        if (excludeSet.has(src)) return false;
                        return true;
                    });

                    if (assistantImgs.length === 0) return null;
                    var lastImg = assistantImgs[assistantImgs.length - 1];

                    // Verify image has loaded
                    if (!lastImg.complete || (lastImg.naturalWidth && lastImg.naturalWidth < 100)) {
                        return "LOADING";
                    }

                    try {
                        var canvas = document.createElement('canvas');
                        canvas.width = lastImg.naturalWidth || lastImg.width || 1280;
                        canvas.height = lastImg.naturalHeight || lastImg.height || 720;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(lastImg, 0, 0);
                        var dUrl = canvas.toDataURL('image/jpeg', 0.95);
                        if (dUrl && dUrl.length > 200) {
                            return dUrl;
                        }
                    } catch(e) {}

                    return lastImg.currentSrc || lastImg.src || null;
                } catch(e) {
                    return null;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            val clean = res?.trim('"', ' ', '\n')
            if (!clean.isNullOrEmpty() && clean != "null" && clean != "GENERATING" && clean != "LOADING") {
                callback(clean)
            } else {
                callback(null)
            }
        }
    }
}
