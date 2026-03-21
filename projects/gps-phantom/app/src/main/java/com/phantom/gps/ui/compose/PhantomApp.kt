package com.phantom.gps.ui.compose

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.phantom.gps.ui.compose.screens.DashboardScreen
import com.phantom.gps.ui.compose.screens.DetectionScreen
import com.phantom.gps.ui.compose.screens.MapScreen
import com.phantom.gps.ui.compose.screens.SettingsScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhantomApp() {
    val navController = rememberNavController()
    var selectedItem by remember { mutableIntStateOf(0) }
    val items = listOf("Map", "Dashboard", "Detection", "Settings")
    val icons = listOf(Icons.Filled.LocationOn, Icons.Filled.Home, Icons.Filled.Warning, Icons.Filled.Settings)

    Scaffold(
        bottomBar = {
            NavigationBar {
                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { Icon(icons[index], contentDescription = item) },
                        label = { Text(item) },
                        selected = selectedItem == index,
                        onClick = {
                            selectedItem = index
                            navController.navigate(item.lowercase())
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "map",
            modifier = Modifier.padding(innerPadding)
        ) {
            composable("map") { MapScreen() }
            composable("dashboard") { DashboardScreen() }
            composable("detection") { DetectionScreen() }
            composable("settings") { SettingsScreen() }
        }
    }
}
