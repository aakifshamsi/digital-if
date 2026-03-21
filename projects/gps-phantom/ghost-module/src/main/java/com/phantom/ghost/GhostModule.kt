package com.phantom.ghost

import de.robv.android.xposed.IXposedHookLoadPackage
import de.robv.android.xposed.XC_MethodHook
import de.robv.android.xposed.XposedHelpers
import de.robv.android.xposed.callbacks.XC_LoadPackage
import android.content.ContentResolver
import android.location.Location
import com.phantom.ghost.hooks.GnssStatusHook
import com.phantom.ghost.hooks.PackageHook

/**
 * GhostModule is the main entry point for the Xposed hooks.
 * It intercepts location-related API calls to hide the mock status.
 */
class GhostModule : IXposedHookLoadPackage {

    override fun handleLoadPackage(lpparam: XC_LoadPackage.LoadPackageParam) {
        // Skip our own app and system processes
        if (lpparam.packageName == "com.phantom.gps" || lpparam.packageName == "com.phantom.ghost") return

        // === HOOK 1: Strip the isMock() flag ===
        XposedHelpers.findAndHookMethod(
            "android.location.Location",
            lpparam.classLoader,
            "isMock",
            object : XC_MethodHook() {
                override fun afterHookedMethod(param: MethodHookParam) {
                    param.result = false // always claim "not mock"
                }
            }
        )

        // Also hook the older API for backward compatibility
        try {
            XposedHelpers.findAndHookMethod(
                "android.location.Location",
                lpparam.classLoader,
                "isFromMockProvider",
                object : XC_MethodHook() {
                    override fun afterHookedMethod(param: MethodHookParam) {
                        param.result = false
                    }
                }
            )
        } catch (e: Exception) { /* Method doesn't exist on newer APIs */ }

        // === HOOK 2: Hide developer options state ===
        XposedHelpers.findAndHookMethod(
            "android.provider.Settings\$Secure",
            lpparam.classLoader,
            "getInt",
            ContentResolver::class.java,
            String::class.java,
            Int::class.java,
            object : XC_MethodHook() {
                override fun afterHookedMethod(param: MethodHookParam) {
                    val setting = param.args[1] as? String
                    if (setting == "development_settings_enabled") {
                        param.result = 0 // report dev options as disabled
                    }
                    if (setting == "mock_location") {
                        param.result = 0 // report no mock location app selected
                    }
                }
            }
        )

        // === HOOK 3: Intercept mock location app package check ===
        XposedHelpers.findAndHookMethod(
            "android.provider.Settings\$Secure",
            lpparam.classLoader,
            "getString",
            ContentResolver::class.java,
            String::class.java,
            object : XC_MethodHook() {
                override fun afterHookedMethod(param: MethodHookParam) {
                    val setting = param.args[1] as? String
                    if (setting == "mock_location") {
                        param.result = "" // no mock location app configured
                    }
                }
            }
        )

        // === HOOK 4: Inject synthetic GNSS satellite data ===
        GnssStatusHook.install(lpparam)

        // === HOOK 5: Package manager scan prevention ===
        PackageHook.install(lpparam, "com.phantom.gps")
    }
}
