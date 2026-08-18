package com.example.aichat.data

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class ChatMessage(
    val id: String,
    val role: String, // "user" or "model"
    val content: String,
    val timestamp: Long = System.currentTimeMillis()
)

class GeminiRepository(private val apiKey: String) {

    private val defaultModel = "gemini-2.5-flash"

    suspend fun sendMessage(
        prompt: String,
        history: List<ChatMessage>,
        modelName: String = defaultModel,
        isCodingMode: Boolean = false,
        isDeepMode: Boolean = false
    ): String = withContext(Dispatchers.IO) {
        try {
            var systemInstruction = "You are Nova AI Assistant, a helpful, precise, and professional AI."
            if (isCodingMode) {
                systemInstruction += "\n\n[CODING MODE ACTIVE]: Write complete, production-ready full source code without truncating."
            }
            if (isDeepMode) {
                systemInstruction += "\n\n[DEEP MODE ACTIVE]: Perform deep analytical research and comprehensive reasoning."
            }

            val generativeModel = GenerativeModel(
                modelName = modelName,
                apiKey = apiKey,
                systemInstruction = content { text(systemInstruction) }
            )

            val chatHistory = history.map { msg ->
                content(role = if (msg.role == "user") "user" else "model") {
                    text(msg.content)
                }
            }

            val chat = generativeModel.startChat(history = chatHistory)
            val response = chat.sendMessage(prompt)
            response.text ?: "No response generated."
        } catch (e: Exception) {
            "Error: ${e.localizedMessage ?: "Unknown error occurred"}"
        }
    }
}
