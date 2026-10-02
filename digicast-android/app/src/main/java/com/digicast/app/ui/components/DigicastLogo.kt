package com.digicast.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.R
import com.digicast.app.ui.theme.DigicastSlate
import com.digicast.app.ui.theme.DigicastWhite

@Composable
fun DigicastLogo(size: Int = 32, modifier: Modifier = Modifier, showLiveText: Boolean = true) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Image(
            painter = painterResource(id = R.drawable.ic_digicast_logo),
            contentDescription = "Digicast",
            modifier = Modifier.size(size.dp)
        )
        Text(
            text = "Digicast",
            color = DigicastWhite,
            fontWeight = FontWeight.Bold,
            fontSize = (size * 0.55).sp
        )
        if (showLiveText) {
            Text(
                text = "Live",
                color = DigicastSlate,
                fontWeight = FontWeight.Medium,
                fontSize = (size * 0.4).sp
            )
        }
    }
}
