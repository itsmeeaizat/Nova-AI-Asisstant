# Nova AI Assistant - Versi Kotlin (Android Jetpack Compose)

Repositori ini menyediakan implementasi lengkap aplikasi **Nova AI Assistant** dalam bahasa **Kotlin** menggunakan **Jetpack Compose** dan **Google GenAI SDK (`com.google.ai.client.generativeai:generativeai`)** untuk Android.

## Fitur Utama Versi Kotlin:
1. **Jetpack Compose UI**: Antarmuka modern, responsif, dan mendukung Dark/Light Mode.
2. **Google GenAI SDK**: Integrasi langsung dengan model Gemini (`gemini-2.5-flash` / `gemini-2.5-pro`).
3. **Mode Coding & Mode Deep**: Toggle sakelar untuk mengaktifkan instruksi khusus AI pembuat proyek lengkap maupun analisis investigatif mendalam.
4. **Pencarian Pesan (Message Search)**: Kolom filter cepat untuk mencari riwayat pesan dalam percakapan.
5. **Coroutine & Asynchronous**: Pemrosesan respons AI di background thread dengan `kotlinx-coroutines`.

## Cara Membuka di Android Studio:
1. Buka **Android Studio**.
2. Pilih **Open an Existing Project** lalu arahkan ke folder `kotlin-android` di dalam direktori proyek ini.
3. Sinkronkan Gradle (`Sync Project with Gradle Files`).
4. Masukkan API Key Gemini Anda di `GeminiRepository.kt` (atau simpan di `local.properties`).
5. Jalankan aplikasi pada emulator atau perangkat Android fisik.
