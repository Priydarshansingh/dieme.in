-keepattributes *Annotation*
-dontwarn javax.annotation.**
-keepclassmembers class * {
    @androidx.room.* <methods>;
}
-keep class com.digicast.app.data.remote.models.** { *; }
