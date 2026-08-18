package com.example.aichat.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aichat.data.ChatMessage
import com.example.aichat.data.GeminiRepository
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen() {
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    var messages = remember {
        mutableStateListOf(
            ChatMessage(id = "1", role = "model", content = "Halo! Saya Nova AI Assistant versi Kotlin. Ada yang bisa saya bantu hari ini?")
        )
    }

    var inputText by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var selectedModel by remember { mutableStateOf("gemini-2.5-flash") }
    var isCodingMode by remember { mutableStateOf(false) }
    var isDeepMode by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }
    var isSearchOpen by remember { mutableStateOf(false) }

    // Placeholder API Key (Replace with your Gemini API Key or read from BuildConfig)
    val apiKey = "YOUR_GEMINI_API_KEY"
    val repository = remember { GeminiRepository(apiKey) }

    val filteredMessages = remember(messages, searchQuery) {
        if (searchQuery.isBlank()) messages
        else messages.filter { it.content.contains(searchQuery, ignoreCase = true) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Nova AI Assistant (Kotlin)", fontSize = 16.sp)
                        Text("Model: $selectedModel", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                    }
                },
                actions = {
                    IconButton(onClick = { isSearchOpen = !isSearchOpen }) {
                        Icon(Icons.Default.Search, contentDescription = "Cari Pesan")
                    }
                    IconButton(onClick = {
                        selectedModel = if (selectedModel == "gemini-2.5-flash") "gemini-2.5-pro" else "gemini-2.5-flash"
                    }) {
                        Icon(Icons.Default.ModelTraining, contentDescription = "Pilih Model")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Bar if open
            if (isSearchOpen) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Cari di pesan...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    singleLine = true,
                    trailingIcon = {
                        IconButton(onClick = { searchQuery = ""; isSearchOpen = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Tutup")
                        }
                    }
                )
            }

            // Messages List
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                items(filteredMessages, key = { it.id }) { msg ->
                    val isUser = msg.role == "user"
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                    ) {
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isUser) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.widthIn(max = 300.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = msg.content,
                                    color = if (isUser) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }

            if (isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            // Mode Toggles (Coding Mode & Deep Mode)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = isCodingMode,
                    onClick = { isCodingMode = !isCodingMode },
                    label = { Text("Mode Coding") },
                    leadingIcon = { Icon(Icons.Default.Code, contentDescription = null, modifier = Modifier.size(16.dp)) }
                )
                FilterChip(
                    selected = isDeepMode,
                    onClick = { isDeepMode = !isDeepMode },
                    label = { Text("Mode Deep") },
                    leadingIcon = { Icon(Icons.Default.Terminal, contentDescription = null, modifier = Modifier.size(16.dp)) }
                )
            }

            // Input Bar
            Surface(
                tonalElevation = 3.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = { Text("Ketik pesan...") },
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 50.dp, max = 120.dp),
                        shape = RoundedCornerShape(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    FloatingActionButton(
                        onClick = {
                            if (inputText.isBlank() || isLoading) return@AsMon
                            val userMsg = ChatMessage(id = System.currentTimeMillis().toString(), role = "user", content = inputText)
                            messages.add(userMsg)
                            val prompt = inputText
                            inputText = ""
                            isLoading = true

                            scope.launch {
                                val reply = repository.sendMessage(prompt, messages.toList(), selectedModel, isCodingMode, isDeepMode)
                                messages.add(ChatMessage(id = (System.currentTimeMillis() + 1).toString(), role = "model", content = reply))
                                isLoading = false
                            }
                        },
                        modifier = Modifier.size(50.dp),
                        shape = CircleShape
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Kirim")
                    }
                }
            }
        }
    }
}
