package com.digicast.app.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
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
import com.digicast.app.ui.screens.studio.ThumbnailStudioScreen
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

    // 3 primary tabs in bottom navigation bar: Home, Clips, Streams
    val tabOrder = listOf(
        Screen.Home.route,
        Screen.Clips.route,
        Screen.Streams.route
    )
    val bottomBarRoutes = tabOrder.toSet()

    Scaffold(
        containerColor = DigicastDeepNavy,
        bottomBar = {
            if (currentRoute in bottomBarRoutes) {
                BottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        if (route != currentRoute) {
                            navController.navigate(route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
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
                val initialIdx = tabOrder.indexOf(initialState.destination.route)
                val targetIdx = tabOrder.indexOf(targetState.destination.route)
                if (initialIdx != -1 && targetIdx != -1) {
                    val isMovingForward = targetIdx >= initialIdx
                    val direction = if (isMovingForward) {
                        AnimatedContentTransitionScope.SlideDirection.Start
                    } else {
                        AnimatedContentTransitionScope.SlideDirection.End
                    }
                    slideIntoContainer(
                        towards = direction,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        initialOffset = { fullWidth -> (fullWidth * 0.28f).toInt() }
                    ) + fadeIn(
                        animationSpec = tween(280, easing = LinearOutSlowInEasing)
                    ) + scaleIn(
                        initialScale = 0.96f,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        )
                    )
                } else {
                    slideIntoContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Start,
                        animationSpec = spring(
                            dampingRatio = 0.90f,
                            stiffness = Spring.StiffnessMediumLow
                        )
                    ) + fadeIn(
                        animationSpec = tween(250, easing = LinearOutSlowInEasing)
                    )
                }
            },
            exitTransition = {
                val initialIdx = tabOrder.indexOf(initialState.destination.route)
                val targetIdx = tabOrder.indexOf(targetState.destination.route)
                if (initialIdx != -1 && targetIdx != -1) {
                    val isMovingForward = targetIdx >= initialIdx
                    val direction = if (isMovingForward) {
                        AnimatedContentTransitionScope.SlideDirection.Start
                    } else {
                        AnimatedContentTransitionScope.SlideDirection.End
                    }
                    slideOutOfContainer(
                        towards = direction,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        targetOffset = { fullWidth -> (fullWidth * 0.22f).toInt() }
                    ) + fadeOut(
                        animationSpec = tween(220, easing = FastOutLinearInEasing)
                    ) + scaleOut(
                        targetScale = 0.96f,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        )
                    )
                } else {
                    slideOutOfContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Start,
                        animationSpec = spring(
                            dampingRatio = 0.90f,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        targetOffset = { fullWidth -> (fullWidth * 0.25f).toInt() }
                    ) + fadeOut(
                        animationSpec = tween(220, easing = FastOutLinearInEasing)
                    )
                }
            },
            popEnterTransition = {
                val initialIdx = tabOrder.indexOf(initialState.destination.route)
                val targetIdx = tabOrder.indexOf(targetState.destination.route)
                if (initialIdx != -1 && targetIdx != -1) {
                    val isMovingForward = targetIdx >= initialIdx
                    val direction = if (isMovingForward) {
                        AnimatedContentTransitionScope.SlideDirection.Start
                    } else {
                        AnimatedContentTransitionScope.SlideDirection.End
                    }
                    slideIntoContainer(
                        towards = direction,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        initialOffset = { fullWidth -> (fullWidth * 0.28f).toInt() }
                    ) + fadeIn(
                        animationSpec = tween(280, easing = LinearOutSlowInEasing)
                    ) + scaleIn(
                        initialScale = 0.96f,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        )
                    )
                } else {
                    slideIntoContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.End,
                        animationSpec = spring(
                            dampingRatio = 0.90f,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        initialOffset = { fullWidth -> (fullWidth * 0.25f).toInt() }
                    ) + fadeIn(
                        animationSpec = tween(250, easing = LinearOutSlowInEasing)
                    )
                }
            },
            popExitTransition = {
                val initialIdx = tabOrder.indexOf(initialState.destination.route)
                val targetIdx = tabOrder.indexOf(targetState.destination.route)
                if (initialIdx != -1 && targetIdx != -1) {
                    val isMovingForward = targetIdx >= initialIdx
                    val direction = if (isMovingForward) {
                        AnimatedContentTransitionScope.SlideDirection.Start
                    } else {
                        AnimatedContentTransitionScope.SlideDirection.End
                    }
                    slideOutOfContainer(
                        towards = direction,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        targetOffset = { fullWidth -> (fullWidth * 0.22f).toInt() }
                    ) + fadeOut(
                        animationSpec = tween(220, easing = FastOutLinearInEasing)
                    ) + scaleOut(
                        targetScale = 0.96f,
                        animationSpec = spring(
                            dampingRatio = 0.88f,
                            stiffness = Spring.StiffnessMediumLow
                        )
                    )
                } else {
                    slideOutOfContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.End,
                        animationSpec = spring(
                            dampingRatio = 0.90f,
                            stiffness = Spring.StiffnessMediumLow
                        )
                    ) + fadeOut(
                        animationSpec = tween(220, easing = FastOutLinearInEasing)
                    )
                }
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
                    onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                    onNavigateToThumbnailStudio = { navController.navigate(Screen.ThumbnailStudio.route) }
                )
            }
            composable(Screen.ThumbnailStudio.route) {
                ThumbnailStudioScreen(
                    onNavigateBack = { navController.popBackStack() }
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
                arguments = listOf(navArgument("streamId") { type = NavType.StringType }),
                deepLinks = listOf(navDeepLink { uriPattern = "digicast://streams/{streamId}" })
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
                arguments = listOf(navArgument("clipId") { type = NavType.StringType }),
                deepLinks = listOf(navDeepLink { uriPattern = "digicast://clips/{clipId}/generate" })
            ) { backStackEntry ->
                val clipId = backStackEntry.arguments?.getString("clipId") ?: return@composable
                ClipGenerateScreen(
                    clipId = clipId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(Screen.Team.route) { TeamScreen() }
            composable(
                route = Screen.Settings.route,
                deepLinks = listOf(navDeepLink { uriPattern = "digicast://settings" })
            ) {
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
