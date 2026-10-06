package com.digicast.app.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.digicast.app.data.repository.AuthRepository
import com.digicast.app.data.repository.AuthState
import com.digicast.app.ui.components.BottomNavBar
import com.digicast.app.ui.screens.clips.ClipGenerateScreen
import com.digicast.app.ui.screens.clips.ClipsScreen
import com.digicast.app.ui.screens.home.HomeScreen
import com.digicast.app.ui.screens.onboarding.OnboardingScreen
import com.digicast.app.ui.screens.settings.SettingsAuthWrapperViewModel
import com.digicast.app.ui.screens.settings.SettingsScreen
import com.digicast.app.ui.screens.streams.StreamDetailScreen
import com.digicast.app.ui.screens.streams.StreamsScreen
import com.digicast.app.ui.screens.team.TeamScreen
import com.digicast.app.ui.theme.DigicastDeepNavy

@Composable
fun DigicastNavGraph(
    navController: NavHostController,
    authRepository: AuthRepository = hiltViewModel<SettingsAuthWrapperViewModel>().authRepository
) {
    val authState by authRepository.authState.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val startDestination = if (authState is AuthState.SignedIn) {
        Screen.Home.route
    } else {
        Screen.Onboarding.route
    }

    // Only 3 primary tabs in bottom navigation bar: Home, Clips, Streams
    val bottomBarRoutes = setOf(
        Screen.Home.route,
        Screen.Clips.route,
        Screen.Streams.route
    )

    Scaffold(
        containerColor = DigicastDeepNavy,
        bottomBar = {
            if (currentRoute in bottomBarRoutes) {
                BottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        if (route != currentRoute) {
                            navController.navigate(route) {
                                popUpTo(Screen.Home.route) {
                                    saveState = false
                                }
                                launchSingleTop = true
                            }
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(paddingValues),
            enterTransition = {
                fadeIn(animationSpec = tween(220, easing = FastOutSlowInEasing)) +
                        slideIntoContainer(
                            towards = AnimatedContentTransitionScope.SlideDirection.Start,
                            animationSpec = tween(220, easing = FastOutSlowInEasing)
                        )
            },
            exitTransition = {
                fadeOut(animationSpec = tween(180, easing = FastOutSlowInEasing)) +
                        slideOutOfContainer(
                            towards = AnimatedContentTransitionScope.SlideDirection.Start,
                            animationSpec = tween(180, easing = FastOutSlowInEasing)
                        )
            },
            popEnterTransition = {
                fadeIn(animationSpec = tween(220, easing = FastOutSlowInEasing)) +
                        slideIntoContainer(
                            towards = AnimatedContentTransitionScope.SlideDirection.End,
                            animationSpec = tween(220, easing = FastOutSlowInEasing)
                        )
            },
            popExitTransition = {
                fadeOut(animationSpec = tween(180, easing = FastOutSlowInEasing)) +
                        slideOutOfContainer(
                            towards = AnimatedContentTransitionScope.SlideDirection.End,
                            animationSpec = tween(180, easing = FastOutSlowInEasing)
                        )
            }
        ) {
            composable(Screen.Onboarding.route) {
                OnboardingScreen(
                    onComplete = {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Onboarding.route) { inclusive = true }
                        }
                    }
                )
            }
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToStreamDetail = { navController.navigate(Screen.StreamDetail.createRoute(it)) },
                    onNavigateToClips = { navController.navigate(Screen.Clips.route) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }
            composable(Screen.Streams.route) {
                StreamsScreen(
                    onNavigateToDetail = { navController.navigate(Screen.StreamDetail.createRoute(it)) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }
            composable(
                route = Screen.StreamDetail.route,
                arguments = listOf(navArgument("streamId") { type = NavType.StringType })
            ) { backStackEntry ->
                if (backStackEntry.arguments?.getString("streamId") == null) return@composable
                StreamDetailScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onNavigateToClipGenerate = { navController.navigate(Screen.ClipGenerate.createRoute(it)) }
                )
            }
            composable(Screen.Clips.route) {
                ClipsScreen(
                    onNavigateToClipGenerate = { navController.navigate(Screen.ClipGenerate.createRoute(it)) },
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
                )
            }
            composable(
                route = Screen.ClipGenerate.route,
                arguments = listOf(navArgument("clipId") { type = NavType.StringType })
            ) { backStackEntry ->
                val clipId = backStackEntry.arguments?.getString("clipId") ?: return@composable
                ClipGenerateScreen(
                    clipId = clipId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.Team.route) { TeamScreen() }
            composable(Screen.Settings.route) {
                SettingsScreen(
                    onSignOut = {
                        navController.navigate(Screen.Onboarding.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }
    }
}
