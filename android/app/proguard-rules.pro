# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo Modules Core & Expo Packages
-keep class expo.modules.** { *; }
-keepclassmembers class * {
    @expo.modules.core.interfaces.ExpoProp *;
}

# Google Sign-In & Firebase Auth
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.firebase.** { *; }
-keep class com.reactnativegooglesignin.** { *; }
-dontwarn com.google.android.gms.**

# Razorpay Checkout SDK
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
    public void onPayment*(...);
}

# React Native Gesture Handler / Screens / SafeArea / SVG / Maps
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.horcrux.svg.** { *; }
-keep class com.rnmaps.maps.** { *; }

# OkHttp / Okio
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
