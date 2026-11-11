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
                this@ChatGptWebAdapter.filePathCallback = filePathCallback
                if (pendingFiles.isNotEmpty()) {
                    val uris = pendingFiles.map { FileProviderUtils.getContentUri(context, it) }.toTypedArray()
                    filePathCallback?.onReceiveValue(uris)
                    this@ChatGptWebAdapter.filePathCallback = null
                    return true
                }
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
        this.pendingFiles = files.take(2) // Max 2 images as requested
        val js = """
            (function() {
                try {
                    var inputs = Array.from(document.querySelectorAll("input[type='file']"));
                    if (inputs.length === 0) {
                        var attachBtn = document.querySelector("button[aria-label*='Attach' i], button[aria-label*='Add attachments' i], [aria-label*='Upload' i]");
                        if (attachBtn) attachBtn.click();
                    }

                    if (window.DgImagesJs && window.DgImagesJs.getPendingFilesCount() > 0) {
                        var count = window.DgImagesJs.getPendingFilesCount();
                        var dt = new DataTransfer();
                        for (var i = 0; i < count; i++) {
                            var b64 = window.DgImagesJs.getPendingFileBase64(i);
                            var name = window.DgImagesJs.getPendingFileName(i);
                            var mime = window.DgImagesJs.getPendingFileMime(i);
                            var binary = atob(b64);
                            var bytes = new Uint8Array(binary.length);
                            for (var j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
                            var blob = new Blob([bytes], { type: mime });
                            var file = new File([blob], name, { type: mime });
                            dt.items.add(file);
                        }

                        var targetInput = document.querySelector("input[type='file']");
                        if (targetInput) {
                            targetInput.files = dt.files;
                            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
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
                    }, 500);

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

    fun captureGeneratedImage(callback: (String?) -> Unit) {
        val js = """
            (function() {
                var imgs = Array.from(document.querySelectorAll("div[data-message-author-role='assistant'] img, img[alt*='Generated' i], img[src*='oaiusercontent.com']"));
                if (imgs.length > 0) {
                    var lastImg = imgs[imgs.length - 1];
                    return lastImg.src || lastImg.currentSrc || null;
                }
                return null;
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

