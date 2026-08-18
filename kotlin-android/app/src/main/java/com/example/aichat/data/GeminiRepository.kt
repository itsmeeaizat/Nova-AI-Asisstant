package com.example.aichat.data

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.GenerationConfig
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GeminiRepository(private val apiKey: String) {

    suspend fun sendMessage(
        prompt: String,
        history: List<ChatMessage>,
        modelName: String = "gemini-2.5-flash",
        systemInstructionText: String = "",
        isCodingMode: Boolean = false,
        isDeepMode: Boolean = false,
        temperature: Float = 0.7f
    ): String = withContext(Dispatchers.IO) {
        try {
            val finalApiKey = if (apiKey.isBlank()) "AIzaSyDummyKeyForPreview" else apiKey

            var fullSystemInstruction = systemInstructionText
            if (isCodingMode) {
                fullSystemInstruction += "\n\n[CODING MODE ACTIVE]: Provide complete, production-ready code blocks without truncation or placeholders."
            }
            if (isDeepMode) {
                fullSystemInstruction += "\n\n[DEEP MODE ACTIVE]: Perform rigorous multi-step reasoning, analytical breakdown, and comprehensive evaluation."
            }

            val config = GenerationConfig.Builder()
                .temperature(temperature)
                .topP(0.95f)
                .maxOutputTokens(8192)
                .build()

            val generativeModel = GenerativeModel(
                modelName = modelName,
                apiKey = finalApiKey,
                generationConfig = config,
                systemInstruction = if (fullSystemInstruction.isNotBlank()) content { text(fullSystemInstruction) } else null
            )

            val chatHistory = history.map { msg ->
                content(role = if (msg.role == "user") "user" else "model") {
                    text(msg.content)
                }
            }

            val chat = generativeModel.startChat(history = chatHistory)
            val response = chat.sendMessage(prompt)
            response.text ?: "Tidak ada respons yang dihasilkan oleh model."
        } catch (e: Exception) {
            "Terjadi kesalahan koneksi atau API Key: ${e.localizedMessage ?: "Unknown error"}. Pastikan API Key Gemini valid."
        }
    }
}
