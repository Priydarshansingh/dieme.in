package com.digicast.app.ui.screens.studio

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import android.text.format.DateFormat
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Calendar
import java.util.Date

data class MediaGalleryItem(
    val uri: Uri,
    val name: String,
    val dateAddedSec: Long,
    val bucketName: String,
    val isVideo: Boolean,
    val durationMs: Long = 0L
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GalleryMediaPickerSheet(
    context: Context,
    title: String = "Select Media from Gallery",
    subtitle: String = "Organized by folder and date for stream thumbnails",
    isOpen: Boolean,
    onDismiss: () -> Unit,
    onMediaSelected: (Uri, Boolean) -> Unit // (uri, isVideo)
) {
    if (!isOpen) return

    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var allItems by remember { mutableStateOf<List<MediaGalleryItem>>(emptyList()) }
    var selectedFolder by remember { mutableStateOf("All") }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        isLoading = true
        allItems = withContext(Dispatchers.IO) {
            queryDeviceMedia(context)
        }
        isLoading = false
    }

    val folders = remember(allItems) {
        val set = mutableSetOf("All")
        allItems.forEach { set.add(it.bucketName) }
        set.toList()
    }

    val filteredItems = remember(allItems, selectedFolder) {
        if (selectedFolder == "All") allItems else allItems.filter { it.bucketName == selectedFolder }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color(0xFF0A0E1A),
        tonalElevation = 8.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 24.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = title,
                        color = Color.White,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = subtitle,
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.08f))
                        .clickable { onDismiss() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Folder Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(folders) { folder ->
                    val isSelected = folder == selectedFolder
                    val count = if (folder == "All") allItems.size else allItems.count { it.bucketName == folder }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) Color(0xFF10B981) else Color(0xFF161D2E))
                            .border(
                                1.dp,
                                if (isSelected) Color(0xFF10B981) else Color.White.copy(alpha = 0.1f),
                                RoundedCornerShape(10.dp)
                            )
                            .clickable { selectedFolder = folder }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Folder,
                                contentDescription = null,
                                tint = if (isSelected) Color(0xFF041014) else Color(0xFF94A3B8),
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = "$folder ($count)",
                                color = if (isSelected) Color(0xFF041014) else Color.White,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Media Grid with Date Grouping
            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(280.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Scanning media gallery...", color = Color(0xFF94A3B8), fontSize = 13.sp)
                }
            } else if (filteredItems.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No media found in this folder", color = Color(0xFF64748B), fontSize = 13.sp)
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(380.dp)
                ) {
                    items(filteredItems) { item ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF111622))
                                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                                .clickable {
                                    onMediaSelected(item.uri, item.isVideo)
                                    onDismiss()
                                }
                        ) {
                            AsyncImage(
                                model = item.uri,
                                contentDescription = item.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )

                            // Top folder tag
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopStart)
                                    .padding(4.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(Color.Black.copy(alpha = 0.65f))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = item.bucketName,
                                    color = Color(0xFF94A3B8),
                                    fontSize = 8.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            // Bottom date / video duration pill
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .fillMaxWidth()
                                    .background(Color.Black.copy(alpha = 0.7f))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val dateStr = formatTimestamp(item.dateAddedSec)
                                    Text(
                                        text = dateStr,
                                        color = Color.White,
                                        fontSize = 9.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                    if (item.isVideo) {
                                        Icon(
                                            imageVector = Icons.Default.Videocam,
                                            contentDescription = "Video",
                                            tint = Color(0xFF00F0FF),
                                            modifier = Modifier.size(10.dp)
                                        )
                                    } else {
                                        Icon(
                                            imageVector = Icons.Default.Image,
                                            contentDescription = "Image",
                                            tint = Color(0xFF10B981),
                                            modifier = Modifier.size(10.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun formatTimestamp(timestampSec: Long): String {
    val millis = timestampSec * 1000L
    val now = Calendar.getInstance()
    val time = Calendar.getInstance().apply { timeInMillis = millis }

    return if (now.get(Calendar.YEAR) == time.get(Calendar.YEAR) &&
        now.get(Calendar.DAY_OF_YEAR) == time.get(Calendar.DAY_OF_YEAR)
    ) {
        DateFormat.format("hh:mm a", Date(millis)).toString()
    } else {
        DateFormat.format("dd MMM", Date(millis)).toString()
    }
}

private fun queryDeviceMedia(context: Context): List<MediaGalleryItem> {
    val results = mutableListOf<MediaGalleryItem>()

    // 1. Query Images (MediaStore)
    try {
        val imgUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        val imgProj = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            arrayOf(
                MediaStore.Images.Media._ID,
                MediaStore.Images.Media.DISPLAY_NAME,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.BUCKET_DISPLAY_NAME,
                MediaStore.Images.Media.RELATIVE_PATH
            )
        } else {
            arrayOf(
                MediaStore.Images.Media._ID,
                MediaStore.Images.Media.DISPLAY_NAME,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.BUCKET_DISPLAY_NAME
            )
        }
        val imgSort = "${MediaStore.Images.Media.DATE_ADDED} DESC"

        context.contentResolver.query(imgUri, imgProj, null, null, imgSort)?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME)
            val dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED)
            val bucketCol = cursor.getColumnIndex(MediaStore.Images.Media.BUCKET_DISPLAY_NAME)
            val relPathCol = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                cursor.getColumnIndex(MediaStore.Images.Media.RELATIVE_PATH)
            } else -1

            var count = 0
            while (cursor.moveToNext() && count < 500) {
                val id = cursor.getLong(idCol)
                val name = cursor.getString(nameCol) ?: "Image"
                val dateAdded = cursor.getLong(dateCol)
                var bucket = if (bucketCol != -1) cursor.getString(bucketCol) else null
                if (bucket.isNullOrBlank() && relPathCol != -1) {
                    val rel = cursor.getString(relPathCol)
                    if (!rel.isNullOrBlank()) {
                        bucket = rel.trim('/').split('/').lastOrNull()
                    }
                }
                if (bucket.isNullOrBlank()) bucket = "Images"
                val contentUri = ContentUris.withAppendedId(imgUri, id)

                results.add(
                    MediaGalleryItem(
                        uri = contentUri,
                        name = name,
                        dateAddedSec = dateAdded,
                        bucketName = bucket,
                        isVideo = false
                    )
                )
                count++
            }
        }
    } catch (_: Exception) {}

    // 2. Query Videos (MediaStore)
    try {
        val vidUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        val vidProj = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            arrayOf(
                MediaStore.Video.Media._ID,
                MediaStore.Video.Media.DISPLAY_NAME,
                MediaStore.Video.Media.DATE_ADDED,
                MediaStore.Video.Media.BUCKET_DISPLAY_NAME,
                MediaStore.Video.Media.DURATION,
                MediaStore.Video.Media.RELATIVE_PATH
            )
        } else {
            arrayOf(
                MediaStore.Video.Media._ID,
                MediaStore.Video.Media.DISPLAY_NAME,
                MediaStore.Video.Media.DATE_ADDED,
                MediaStore.Video.Media.BUCKET_DISPLAY_NAME,
                MediaStore.Video.Media.DURATION
            )
        }
        val vidSort = "${MediaStore.Video.Media.DATE_ADDED} DESC"

        context.contentResolver.query(vidUri, vidProj, null, null, vidSort)?.use { cursor ->
            val idCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID)
            val nameCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME)
            val dateCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DATE_ADDED)
            val bucketCol = cursor.getColumnIndex(MediaStore.Video.Media.BUCKET_DISPLAY_NAME)
            val durCol = cursor.getColumnIndex(MediaStore.Video.Media.DURATION)
            val relPathCol = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                cursor.getColumnIndex(MediaStore.Video.Media.RELATIVE_PATH)
            } else -1

            var count = 0
            while (cursor.moveToNext() && count < 200) {
                val id = cursor.getLong(idCol)
                val name = cursor.getString(nameCol) ?: "Video"
                val dateAdded = cursor.getLong(dateCol)
                var bucket = if (bucketCol != -1) cursor.getString(bucketCol) else null
                if (bucket.isNullOrBlank() && relPathCol != -1) {
                    val rel = cursor.getString(relPathCol)
                    if (!rel.isNullOrBlank()) {
                        bucket = rel.trim('/').split('/').lastOrNull()
                    }
                }
                if (bucket.isNullOrBlank()) bucket = "Videos"
                val duration = if (durCol != -1) cursor.getLong(durCol) else 0L
                val contentUri = ContentUris.withAppendedId(vidUri, id)

                results.add(
                    MediaGalleryItem(
                        uri = contentUri,
                        name = name,
                        dateAddedSec = dateAdded,
                        bucketName = bucket,
                        isVideo = true,
                        durationMs = duration
                    )
                )
                count++
            }
        }
    } catch (_: Exception) {}

    // Sort combined by date added descending
    results.sortByDescending { it.dateAddedSec }
    return results
}

