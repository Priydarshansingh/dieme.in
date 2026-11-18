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
                            var file = new File([blob], name, { type: mime, lastModified: Date.now() });
                            dt.items.add(file);
                        }
                    }

                    if (dt.items.length === 0) return false;

                    var fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).filter(function(inp) {
                        var acc = inp.getAttribute('accept') || '';
                        return acc.indexOf('image') !== -1 || inp.hasAttribute('multiple');
                    });
                    if (fileInputs.length === 0) {
                        fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
                    }
                    if (fileInputs.length === 0) return false;

                    var attached = false;
                    fileInputs.forEach(function(input) {
                        try {
                            var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
                            if (desc && desc.set) {
                                desc.set.call(input, dt.files);
                            } else {
                                input.files = dt.files;
                            }

                            // Trigger React synthetic onChange directly
                            for (var k in input) {
                                if (k.startsWith('__reactProps')) {
                                    var props = input[k];
                                    if (props && typeof props.onChange === 'function') {
                                        try {
                                            props.onChange({
                                                target: input,
                                                currentTarget: input,
                                                nativeEvent: new Event('change', { bubbles: true }),
                                                bubbles: true,
                                                cancelable: true,
                                                defaultPrevented: false,
                                                isDefaultPrevented: function() { return false; },
                                                isPropagationStopped: function() { return false; },
                                                persist: function() {},
                                                timeStamp: Date.now(),
                                                type: 'change'
                                            });
                                        } catch(e) {}
                                    }
                                }
                            }

                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            attached = true;
                        } catch(e) {}
                    });

                    return attached;
                } catch(e) {
                    return false;
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(js) { res ->
            Handler(Looper.getMainLooper()).postDelayed({
                onComplete?.invoke(res?.trim() == "true")
            }, 1000L)
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
                        "[class*='composer-attachment'], " +
                        "[data-testid*='attachment'], " +
                        "[data-testid*='file-thumbnail'], " +
                        "form img"
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
                    var userContainers = document.querySelectorAll("div[data-message-author-role='user'], #prompt-textarea, [data-testid*='attachment'], [class*='composer-attachment'], form");
                    var userImgs = new Set();
                    userContainers.forEach(function(c) {
                        c.querySelectorAll("img").forEach(function(i) { userImgs.add(i); });
                    });

                    var allImgs = Array.from(document.querySelectorAll(
                        "main img, article img, div[class*='conversation'] img, [class*='turn'] img, img[alt*='Generated' i], img[src*='oaiusercontent.com']"
                    )).filter(function(img) {
                        if (userImgs.has(img)) return false;
                        if (img.getAttribute('alt') === 'User attachment') return false;
                        if (img.closest("[class*='composer-attachment']")) return false;
                        if (img.closest("form")) return false;
                        if (img.closest("[class*='avatar']")) return false;
                        return true;
                    });

                    var urls = allImgs.map(function(img) {
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

                    // 2. Check if generation is still active (only check actual stop button or spinners, never body text)
                    var stopBtn = document.querySelector(
                        "button[data-testid='stop-button'], button[aria-label*='Stop' i], [data-icon='stop'], button:has(svg rect)"
                    );
                    var isWorking = !!stopBtn || !!document.querySelector("[role='progressbar'], .animate-spin, [class*='result-streaming']");

                    var excludeList = $excludeJson;
                    var excludeSet = new Set(excludeList);

                    // 3. Find candidate images strictly within the NEWEST ASSISTANT responses
                    var assistantTurns = Array.from(document.querySelectorAll(
                        "[data-message-author-role='assistant'], article[data-testid*='assistant'], [class*='agent-turn'], [class*='assistant']"
                    ));

                    // If we know initialTurnCount and new turns have appeared, inspect only the new turns
                    var candidateTurns = assistantTurns;
                    if (assistantTurns.length > $initialTurnCount) {
                        candidateTurns = assistantTurns.slice($initialTurnCount);
                    } else if (assistantTurns.length > 0) {
                        // Otherwise inspect the latest assistant turn
                        candidateTurns = [assistantTurns[assistantTurns.length - 1]];
                    }

                    var allImgs = [];
                    candidateTurns.forEach(function(turn) {
                        turn.querySelectorAll("img").forEach(function(img) {
                            allImgs.push(img);
                        });
                    });

                    // If no images found in candidate assistant turns, check all assistant turns
                    if (allImgs.length === 0) {
                        assistantTurns.forEach(function(turn) {
                            turn.querySelectorAll("img").forEach(function(img) {
                                allImgs.push(img);
                            });
                        });
                    }

                    var targetImgs = allImgs.filter(function(img) {
                        if (img.closest("[data-message-author-role='user']")) return false;
                        if (img.closest("[class*='user-turn']")) return false;
                        if (img.closest("[data-testid*='turn-user']")) return false;
                        if (img.getAttribute('alt') === 'User attachment') return false;
                        if (img.closest("[class*='composer-attachment']")) return false;
                        if (img.closest("form")) return false;
                        if (img.closest("[class*='avatar']")) return false;
                        var src = img.currentSrc || img.src || '';
                        if (!src) return false;
                        if (excludeSet.has(src)) return false;
                        if (img.naturalWidth && img.naturalWidth < 180) return false;
                        return true;
                    });

                    if (targetImgs.length === 0) {
                        if (isWorking) {
                            return "GENERATING";
                        }
                        return null;
                    }

                    // If still actively streaming/generating, do not capture prematurely
                    if (isWorking) {
                        return "GENERATING";
                    }

                    // Sort by area (width * height) descending so the full 1080p canvas takes priority over small thumbnails
                    targetImgs.sort(function(a, b) {
                        var areaA = (a.naturalWidth || 0) * (a.naturalHeight || 0);
                        var areaB = (b.naturalWidth || 0) * (b.naturalHeight || 0);
                        return areaB - areaA;
                    });

                    var bestImg = targetImgs[0];

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
            if (!clean.isNullOrEmpty() && clean != "null" && clean != "GENERATING" && clean != "LOADING") {
                callback(clean)
            } else {
                callback(null)
            }
        }
    }
}
