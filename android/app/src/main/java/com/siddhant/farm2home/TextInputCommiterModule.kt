package com.siddhant.farm2home

import android.widget.EditText
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.uimanager.UIManagerModule

class TextInputCommiterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "TextInputCommiter"
    }

    @ReactMethod
    fun getAndCommitText(reactTag: Int, promise: Promise) {
        val context = reactApplicationContext
        context.runOnUiQueueThread {
            try {
                val uiManager = context.getNativeModule(UIManagerModule::class.java)
                var view: android.view.View? = null
                try {
                    view = uiManager?.resolveView(reactTag)
                } catch (e: Exception) {
                    // Ignore exception in resolveView
                }
                
                if (view == null) {
                    // Fallback for Fabric/New Architecture where UIManagerModule doesn't work
                    view = context.currentActivity?.findViewById<android.view.View>(reactTag)
                }
                
                if (view is EditText) {
                    // Fetch the exact current text (including any active composing words)
                    // We specifically DO NOT call view.clearComposingText() because on some OEM 
                    // keyboards (Samsung/Gboard), forcibly removing the composing span causes 
                    // the keyboard to discard the uncommitted word, causing truncation.
                    val textAfter = view.text.toString()
                    promise.resolve(textAfter)
                } else {
                    promise.reject("ERR_NOT_EDITTEXT", "View is not an EditText")
                }
            } catch (e: Exception) {
                promise.reject("ERR_UI", e.message)
            }
        }
    }
}
