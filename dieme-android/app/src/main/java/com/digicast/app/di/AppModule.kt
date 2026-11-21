package com.digicast.app.di

import android.content.Context
import androidx.room.Room
import com.digicast.app.data.local.DigicastDatabase
import com.digicast.app.data.local.dao.DigicastDao
import com.digicast.app.data.remote.YouTubeApiService
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): DigicastDatabase {
        return Room.databaseBuilder(
            context,
            DigicastDatabase::class.java,
            "digicast.db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideDao(db: DigicastDatabase): DigicastDao = db.digicastDao()

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideOkHttp(@ApplicationContext context: Context): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            // BASIC only — never log Authorization headers or chat bodies
            level = HttpLoggingInterceptor.Level.BASIC
        }
        val cacheSize = 50L * 1024L * 1024L // 50 MB disk cache
        val httpCache = okhttp3.Cache(java.io.File(context.cacheDir, "http_cache"), cacheSize)
        return OkHttpClient.Builder()
            .cache(httpCache)
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideYouTubeApi(client: OkHttpClient, moshi: Moshi): YouTubeApiService {
        return Retrofit.Builder()
            .baseUrl("https://www.googleapis.com/youtube/v3/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(YouTubeApiService::class.java)
    }
}
