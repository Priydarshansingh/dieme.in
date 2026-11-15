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

                    var editor = document.querySelector(".ProseMirror, [contenteditable='true'], textarea, #prompt-textarea") || document.body;
                    if (!editor) return false;

                    editor.focus();

                    function pasteFileAt(idx) {
                        if (idx >= count) return;
                        try {
                            var b64 = window.DgImagesJs.getPendingFileBase64(idx);
                            var name = window.DgImagesJs.getPendingFileName(idx);
                            var mime = window.DgImagesJs.getPendingFileMime(idx) || 'image/jpeg';
                            if (b64 && b64.length > 0) {
                                var binary = atob(b64);
                                var bytes = new Uint8Array(binary.length);
                                for (var j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
                                var blob = new Blob([bytes], { type: mime });
                                var file = new File([blob], name, { type: mime, lastModified: Date.now() });
                                var dt = new DataTransfer();
                                dt.items.add(file);
                                var pasteEvt = new ClipboardEvent('paste', {
                                    bubbles: true,
                                    cancelable: true,
                                    clipboardData: dt
                                });
                                editor.dispatchEvent(pasteEvt);
                            }
                        } catch(e) {}
                        setTimeout(function() { pasteFileAt(idx + 1); }, 350);
                    }

                    pasteFileAt(0);
                    return true;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, files.size * 400L + 800L)
        }
    }

    fun checkAttachmentsReady(callback: (Boolean) -> Unit) {
        val js = """
            (function() {
                try {
                    // Check for attachments inside the composer form
                    var attachments = document.querySelectorAll(
                        ".group\\/composer-attachment, " +
                        "[class*='composer-attachment'], " +
                        "[data-testid*='attachment'], " +
                        "[data-testid*='file-thumbnail'], " +
                        "form img[src*='blob:']"
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
                    var editor = document.querySelector(".ProseMirror, [contenteditable='true'], textarea, #prompt-textarea");
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
                        var sendBtn = document.querySelector("button[data-testid='send-button'], button[aria-label*='Send' i], button[aria-label*='Submit' i]");
                        if (sendBtn) {
                            sendBtn.removeAttribute('disabled');
                            sendBtn.click();
                        }
                    }, 800);

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
                    // Auto-scroll transcript container to bottom so virtualized turns & images are rendered
                    var scroller = document.querySelector("[class*='scroll-container'], [class*='scrollContainer'], main, div[role='region']");
                    if (scroller) {
                        scroller.scrollTop = scroller.scrollHeight;
                    }

                    // Check if generation is still active (Stop button visible or Creating image progress visible)
                    var stopBtn = document.querySelector("button[data-testid='stop-button'], button[aria-label*='Stop' i]");
                    var bodyText = document.body.innerText || "";
                    if (stopBtn || bodyText.indexOf("Creating image") !== -1) {
                        return "GENERATING";
                    }

                    var excludeList = $excludeJson;
                    var excludeSet = new Set(excludeList);

                    // Target assistant generated image candidates
                    var assistantImgs = Array.from(document.querySelectorAll(
                        "img[alt*='Generated' i], " +
                        "img[alt*='Created' i], " +
                        "img[src*='oaiusercontent.com'], " +
                        ".markdown img"
                    )).filter(function(img) {
                        if (img.getAttribute('alt') === 'User attachment') return false;
                        if (img.closest("[class*='user-message']")) return false;
                        if (img.closest("[class*='composer-attachment']")) return false;
                        var src = img.currentSrc || img.src || '';
                        if (!src) return false;
                        if (excludeSet.has(src)) return false;
                        return true;
                    });

                    // If no explicit alt='Generated', find any blob/url img not in user-message
                    if (assistantImgs.length === 0) {
                        var candidateImgs = Array.from(document.querySelectorAll("img")).filter(function(img) {
                            if (img.getAttribute('alt') === 'User attachment') return false;
                            if (img.closest("[class*='user-message']")) return false;
                            if (img.closest("[class*='composer-attachment']")) return false;
                            var src = img.currentSrc || img.src || '';
                            if (!src) return false;
                            if (excludeSet.has(src)) return false;
                            return (img.naturalWidth && img.naturalWidth > 400);
                        });
                        if (candidateImgs.length > 0) {
                            assistantImgs = candidateImgs;
                        }
                    }

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
