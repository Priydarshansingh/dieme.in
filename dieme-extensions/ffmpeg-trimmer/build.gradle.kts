plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.digicast.ext.ffmpeg"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.digicast.ext.ffmpeg"
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

tasks.register("assembleDcast") {
    dependsOn("assembleRelease")
    doLast {
        val buildDir = layout.buildDirectory.asFile.get()
        val apkFile = File(buildDir, "outputs/apk/release/ffmpeg-trimmer-release-unsigned.apk")
        val fallbackApk = File(buildDir, "outputs/apk/release/ffmpeg-trimmer-release.apk")
        val sourceApk = if (apkFile.exists()) apkFile else fallbackApk

        if (sourceApk.exists()) {
            val distDir = File(rootDir, "dist")
            if (!distDir.exists()) distDir.mkdirs()
            val dcastFile = File(distDir, "com.digicast.ext.ffmpeg.dcast")
            sourceApk.copyTo(dcastFile, overwrite = true)
            println("✅ Generated .dcast extension artifact: ${dcastFile.absolutePath}")
        }
    }
}
