package com.example.aichat.model

data class ChatMessage(
    val id: String,
    val role: String, // "user" or "model"
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

data class ChatSession(
    val id: String,
    val title: String,
    val messages: List<ChatMessage> = emptyList(),
    val createdAt: Long = System.currentTimeMillis()
)

data class Persona(
    val id: String,
    val name: String,
    val description: String,
    val systemPrompt: String
)

data class AppSettings(
    val apiKey: String = "",
    val selectedModel: String = "gemini-2.5-flash",
    val temperature: Float = 0.7f,
    val topP: Float = 0.95f,
    val maxOutputTokens: Int = 8192
)
