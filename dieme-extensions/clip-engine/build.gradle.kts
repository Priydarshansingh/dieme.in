plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.digicast.ext.clipengine"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.digicast.ext.clipengine"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}

// Custom task to package compiled APK into .dcast format for Digicast Core App
tasks.register("assembleDcast") {
    dependsOn("assembleRelease")
    doLast {
        val buildDir = layout.buildDirectory.asFile.get()
        val apkFile = File(buildDir, "outputs/apk/release/clip-engine-release-unsigned.apk")
        val fallbackApk = File(buildDir, "outputs/apk/release/clip-engine-release.apk")
        val sourceApk = if (apkFile.exists()) apkFile else fallbackApk

        if (sourceApk.exists()) {
            val distDir = File(rootDir, "dist")
            if (!distDir.exists()) distDir.mkdirs()
            val dcastFile = File(distDir, "com.digicast.ext.clipengine.dcast")
            sourceApk.copyTo(dcastFile, overwrite = true)
            println("✅ Generated .dcast extension artifact: ${dcastFile.absolutePath}")
        } else {
            println("⚠️ Could not find release APK to convert to .dcast")
        }
    }
}
