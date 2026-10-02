package com.digicast.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.ui.navigation.DigicastNavGraph
import com.digicast.app.ui.theme.DigicastTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DigicastTheme {
                DigicastNavGraph(navController = rememberNavController())
            }
        }
    }
}
