package com.example.aichat.ui

import android.speech.tts.TextToSpeech
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.platform.ContextCompat
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aichat.data.DEFAULT_PERSONAS
import com.example.aichat.data.GeminiRepository
import com.example.aichat.model.ChatMessage
import com.example.aichat.model.ChatSession
import com.example.aichat.model.Persona
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    // State management
    var sessions = remember {
        mutableStateListOf(
            ChatSession(
                id = "1",
                title = "Percakapan Baru",
                messages = listOf(
                    ChatMessage(id = "m1", role = "model", content = "Halo! Saya Nova AI Assistant versi Android Native Kotlin. Bagaimana saya dapat membantu Anda hari ini?")
                )
            )
        )
    }
    var activeSessionId = remember { mutableStateOf("1") }
    val activeSession = sessions.find { it.id == activeSessionId.value } ?: sessions[0]

    var inputText by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }

    // Settings & Config
    var selectedModel = remember { mutableStateOf("gemini-2.5-flash") }
    var selectedPersona = remember { mutableStateOf(DEFAULT_PERSONAS[0]) }
    var apiKey by remember { mutableStateOf("") }
    var isCodingMode = remember { mutableStateOf(false) }
    var isDeepMode = remember { mutableStateOf(false) }

    // Search
    var searchQuery = remember { mutableStateOf("") }
    var isSearchOpen = remember { mutableStateOf(false) }

    // Dialogs & Drawers
    var showSettingsDialog = remember { mutableStateOf(false) }
    var showPersonaDialog = remember { mutableStateOf(false) }
    var drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    // TTS
    var tts by remember { mutableStateOf<TextToSpeech?>(null) }
    var activeSpeechId = remember { mutableStateOf<String?>(null) }

    DisposableEffect(context) {
        val ttsObj = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("id", "ID")
            }
        }
        tts = ttsObj
        onDispose {
            ttsObj.stop()
            ttsObj.shutdown()
        }
    }

    val repository = remember(apiKey) { GeminiRepository(apiKey) }

    val filteredMessages = remember(activeSession.messages, searchQuery.value) {
        if (searchQuery.value.isBlank()) activeSession.messages
        else activeSession.messages.filter { it.content.contains(searchQuery.value, ignoreCase = true) }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Spacer(modifier = Modifier.height(16.dp))
                Text("Daftar Percakapan", modifier = Modifier.padding(16.dp), style = MaterialTheme.typography.titleMedium)
                HorizontalDivider()
                Button(
                    onClick = {
                        val newId = System.currentTimeMillis().toString()
                        sessions.add(ChatSession(id = newId, title = "Sesi Baru", messages = listOf(ChatMessage(id = "init", role = "model", content = "Percakapan baru dimulai."))))
                        activeSessionId.value = newId
                        scope.launch { drawerState.close() }
                    },
                    modifier = Modifier.fillMaxWidth().padding(16.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Percakapan Baru")
                }
                LazyColumn(modifier = Modifier.fillMaxWidth().weight(1f)) {
                    items(sessions, key = { it.id }) { s ->
                        NavigationDrawerItem(
                            label = { Text(s.title, maxLines = 1) },
                            selected = s.id == activeSessionId.value,
                            onClick = {
                                activeSessionId.value = s.id
                                scope.launch { drawerState.close() }
                            },
                            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding)
                        )
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(activeSession.title, fontSize = 15.sp, maxLines = 1)
                            Text("${selectedPersona.value.name} • ${selectedModel.value}", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu")
                        }
                    },
                    actions = {
                        IconButton(onClick = { isSearchOpen.value = !isSearchOpen.value }) {
                            Icon(Icons.Default.Search, contentDescription = "Cari Pesan")
                        }
                        IconButton(onClick = { showPersonaDialog.value = true }) {
                            Icon(Icons.Default.Person, contentDescription = "Persona")
                        }
                        IconButton(onClick = { showSettingsDialog.value = true }) {
                            Icon(Icons.Default.Settings, contentDescription = "Pengaturan")
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
                // Search Bar
                if (isSearchOpen.value) {
                    OutlinedTextField(
                        value = searchQuery.value,
                        onValueChange = { searchQuery.value = it },
                        placeholder = { Text("Cari kata dalam pesan...") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 6.dp),
                        singleLine = true,
                        trailingIcon = {
                            IconButton(onClick = { searchQuery.value = ""; isSearchOpen.value = false }) {
                                Icon(Icons.Default.Close, contentDescription = "Tutup")
                            }
                        }
                    )
                }

                // Chat Messages List
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(vertical = 12.dp)
                ) {
                    items(filteredMessages, key = { it.id }) { msg ->
                        val isUser = msg.role == "user"
                        val isSpeaking = activeSpeechId.value == msg.id

                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
                        ) {
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = if (isUser) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                                modifier = Modifier.widthIn(max = 320.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Text(
                                        text = msg.content,
                                        color = if (isUser) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant,
                                        fontSize = 14.sp
                                    )
                                    
                                    // Voice read button on assistant messages with pulse animation when speaking
                                    if (!isUser) {
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .clickable {
                                                    if (isSpeaking) {
                                                        tts?.stop()
                                                        activeSpeechId.value = null
                                                    } else {
                                                        activeSpeechId.value = msg.id
                                                        tts?.speak(msg.content, TextToSpeech.QUEUE_FLUSH, null, msg.id)
                                                    }
                                                }
                                                .padding(horizontal = 6.dp, vertical = 4.dp)
                                        ) {
                                            Icon(
                                                imageVector = if (isSpeaking) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                                                contentDescription = "Baca Suara",
                                                modifier = Modifier.size(14.dp),
                                                tint = if (isSpeaking) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = if (isSpeaking) "Berhenti" else "Baca Suara",
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (isLoading) {
                    LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                }

                // Toggles for Coding Mode & Deep Mode
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = isCodingMode.value,
                        onClick = { isCodingMode.value = !isCodingMode.value },
                        label = { Text("Mode Coding") },
                        leadingIcon = { Icon(Icons.Default.Code, contentDescription = null, modifier = Modifier.size(16.dp)) }
                    )
                    FilterChip(
                        selected = isDeepMode.value,
                        onClick = { isDeepMode.value = !isDeepMode.value },
                        label = { Text("Mode Deep") },
                        leadingIcon = { Icon(Icons.Default.Psychology, contentDescription = null, modifier = Modifier.size(16.dp)) }
                    )
                }

                // Input Bar
                Surface(
                    tonalElevation = 4.dp,
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
                            placeholder = { Text("Ketik pesan atau tanyakan sesuatu...") },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 52.dp, max = 130.dp),
                            shape = RoundedCornerShape(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        FloatingActionButton(
                            onClick = {
                                if (inputText.isBlank() || isLoading) return@FloatingActionButton
                                val userMsg = ChatMessage(id = System.currentTimeMillis().toString(), role = "user", content = inputText)
                                
                                val updatedMessages = activeSession.messages + userMsg
                                val index = sessions.indexOf(activeSession)
                                if (index != -1) {
                                    sessions[index] = activeSession.copy(
                                        messages = updatedMessages,
                                        title = if (activeSession.title == "Percakapan Baru") inputText.take(25) else activeSession.title
                                    )
                                }

                                val prompt = inputText
                                inputText = ""
                                isLoading = true

                                scope.launch {
                                    val reply = repository.sendMessage(
                                        prompt = prompt,
                                        history = updatedMessages,
                                        modelName = selectedModel.value,
                                        systemInstructionText = selectedPersona.value.systemPrompt,
                                        isCodingMode = isCodingMode.value,
                                        isDeepMode = isDeepMode.value
                                    )
                                    val aiMsg = ChatMessage(id = (System.currentTimeMillis() + 1).toString(), role = "model", content = reply)
                                    val currSession = sessions.find { it.id == activeSessionId.value }
                                    if (currSession != null) {
                                        val idx = sessions.indexOf(currSession)
                                        sessions[idx] = currSession.copy(messages = currSession.messages + aiMsg)
                                    }
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

    // Persona Selection Dialog
    if (showPersonaDialog.value) {
        AlertDialog(
            onDismissRequest = { showPersonaDialog.value = false },
            title = { Text("Pilih Persona AI") },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(DEFAULT_PERSONAS) { p ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedPersona.value = p
                                    showPersonaDialog.value = false
                                },
                            colors = CardDefaults.cardColors(
                                containerColor = if (selectedPersona.value.id == p.id) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(p.name, style = MaterialTheme.typography.titleSmall)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(p.description, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showPersonaDialog.value = false }) {
                    Text("Tutup")
                }
            }
        )
    }

    // Settings Dialog
    if (showSettingsDialog.value) {
        AlertDialog(
            onDismissRequest = { showSettingsDialog.value = false },
            title = { Text("Pengaturan & Model") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = apiKey,
                        onValueChange = { apiKey = it },
                        label = { Text("Gemini API Key") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text("Pilih Model Gemini:", style = MaterialTheme.typography.labelMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = selectedModel.value == "gemini-2.5-flash",
                            onClick = { selectedModel.value = "gemini-2.5-flash" },
                            label = { Text("Gemini 2.5 Flash") }
                        )
                        FilterChip(
                            selected = selectedModel.value == "gemini-2.5-pro",
                            onClick = { selectedModel.value = "gemini-2.5-pro" },
                            label = { Text("Gemini 2.5 Pro") }
                        )
                    }
                }
            },
            confirmButton = {
                Button(onClick = { showSettingsDialog.value = false }) {
                    Text("Simpan")
                }
            }
        )
    }
}
