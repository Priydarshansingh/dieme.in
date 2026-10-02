package com.digicast.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
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
            contentDescription = "Digicast",
            modifier = Modifier.size(size.dp)
        )
        if (useTextGraphic) {
            Image(
                painter = painterResource(id = R.drawable.logo_text),
                contentDescription = "Digicast Live",
                modifier = Modifier.height((size * 0.7).coerceAtLeast(18.0).dp),
                contentScale = ContentScale.Fit
            )
        }
    }
}
