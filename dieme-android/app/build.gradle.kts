import java.io.File

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
    alias(libs.plugins.google.services)
}

android {
    namespace = "com.digicast.app" 
    compileSdk = 35
 
    defaultConfig {
        applicationId = "com.digicast.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 6
        versionName = "1.2.3"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Injected at build time from local.properties. Never put secrets in source.
        buildConfigField("String", "YOUTUBE_CLIENT_ID", "\"${project.findProperty("YOUTUBE_CLIENT_ID") ?: ""}\"")
        buildConfigField("String", "CLOUD_RUN_BASE_URL", "\"${project.findProperty("CLOUD_RUN_BASE_URL") ?: "https://api.digicast.app/"}\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.core.ktx)
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.splashscreen)
    implementation(libs.material)

    val composeBom = platform(libs.compose.bom)
    implementation(composeBom)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    implementation(libs.compose.activity)
    implementation(libs.compose.lifecycle.runtime)
    implementation(libs.compose.viewmodel)
    debugImplementation(libs.compose.ui.tooling)

    implementation(libs.navigation.compose)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)
    implementation(libs.hilt.work)
    ksp(libs.hilt.work.compiler)

    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)

    implementation(libs.work.runtime)

    implementation(libs.retrofit)
    implementation(libs.retrofit.moshi)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.moshi)
    ksp(libs.moshi.codegen)

    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    implementation(libs.firebase.analytics)

    implementation(libs.media3.exoplayer)
    implementation(libs.media3.ui)

    implementation(libs.coroutines.android)
    implementation(libs.datastore)
    implementation(libs.coil.compose)
    implementation("io.coil-kt:coil-svg:2.7.0")
    implementation("com.google.android.gms:play-services-ads:23.4.0")
}

tasks.register("copyDebugApkToBuildOutput") {
    doLast {
        val apkFile = file("${layout.buildDirectory.get()}/outputs/apk/debug/app-debug.apk")
        if (apkFile.exists()) {
            val outputDir = file("${rootDir}/../build output")
            outputDir.mkdirs()
            outputDir.listFiles()?.forEach { oldFile ->
                if (oldFile.name.endsWith(".apk")) {
                    oldFile.delete()
                }
            }
            apkFile.copyTo(File(outputDir, "app-debug.apk"), overwrite = true)
            println("=== [BUILD OUTPUT] Copied latest debug APK to 'build output/app-debug.apk' successfully ===")
        }
    }
}

tasks.matching { it.name == "assembleDebug" }.configureEach {
    finalizedBy("copyDebugApkToBuildOutput")
}
