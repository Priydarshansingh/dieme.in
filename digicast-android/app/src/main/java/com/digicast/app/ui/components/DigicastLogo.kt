package com.digicast.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.digicast.app.R

@Composable
fun DigicastLogo(
    size: Int = 32,
    modifier: Modifier = Modifier,
    useTextGraphic: Boolean = true
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Image(
            painter = painterResource(id = R.drawable.logo_round),
            contentDescription = "Dieme",
            modifier = Modifier.size(size.dp)
        )
        if (useTextGraphic) {
            Text(
                text = "Dieme",
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = (size * 0.65).coerceAtLeast(18.0).sp,
                letterSpacing = (-0.5).sp
            )
        }
    }
}
