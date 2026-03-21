package com.phantom.ghost.hooks

import de.robv.android.xposed.XC_MethodHook
import de.robv.android.xposed.XposedHelpers
import de.robv.android.xposed.callbacks.XC_LoadPackage
import android.content.pm.PackageInfo
import android.content.pm.ApplicationInfo

/**
 * PackageHook hides the GPS Phantom app from other apps' package scans.
 */
object PackageHook {

    fun install(lpparam: XC_LoadPackage.LoadPackageParam, packageName: String) {
        XposedHelpers.findAndHookMethod(
            "android.app.ApplicationPackageManager",
            lpparam.classLoader,
            "getInstalledPackages",
            Int::class.java,
            object : XC_MethodHook() {
                override fun afterHookedMethod(param: MethodHookParam) {
                    val list = param.result as? MutableList<PackageInfo>
                    list?.removeIf { it.packageName == packageName }
                }
            }
        )

        XposedHelpers.findAndHookMethod(
            "android.app.ApplicationPackageManager",
            lpparam.classLoader,
            "getInstalledApplications",
            Int::class.java,
            object : XC_MethodHook() {
                override fun afterHookedMethod(param: MethodHookParam) {
                    val list = param.result as? MutableList<ApplicationInfo>
                    list?.removeIf { it.packageName == packageName }
                }
            }
        )
    }
}
