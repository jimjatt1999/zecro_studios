# Neura

**Local Intelligence with a face**

An on-device AI assistant for iPhone, iPad and Mac with chat, content generation, note processing, reminders, and a daily digest - 100% private and offline.

## Key Features

- **Integrated Chat**: Conversational AI that can also discuss your notes and reminders.
- **Contextual Chat**: Enhance conversations by adding context from Notes, Reminders, Calendar, or uploaded Documents.
- **Document Interaction**: Upload PDF and TXT files, get AI summaries, and chat about their content directly within the app.
- **Smart Reminders**: Set reminders using natural language (e.g., "call mom tomorrow 5pm"). Includes notification scheduling, completion tracking, and recurrence.
- **AI-Powered Notes**: Process and organize your notes with AI assistance. Supports text input and audio recording (with automatic transcription).
- **Daily Digest**: Get a personalized summary of your upcoming calendar events and reminders for the day, week, or month. Includes optional interesting facts from the "Discover" feature.
- **Gamification (Optional)**: Earn XP and level up your AI companion by interacting with the app (chatting, completing reminders, saving notes, generating digests). Can be disabled or hidden in settings.
- **Customizable Animated Eyes**: Fun, interactive visual feedback with adjustable appearance and animations (optional).
- **Customizable Interface**: Choose standard UI or switch to unique Terminal-style interfaces for Chat and Daily Digest, including themes like Classic Green, Matrix, and even a retro **Game Boy Screen** look!
- **Voice Input**: Dictate notes, reminders, or chat messages.
- **Completely Local**: All processing happens on-device, no data sent anywhere.

## Supported Models

- **Core 1B** (0.7 GB): Fast, lightweight model for everyday use
- **Core 3B** (1.8 GB): Enhanced model with better capabilities

## What Sets Neura Apart

- **True Privacy**: Works offline with no external dependencies.
- **Unified Interface**: Chat, create, manage notes, track reminders, and view your daily digest within a single app.
- **Contextual Chat Modes**: Seamlessly switch between general chat, discussing notes, querying Reminders, or interacting with Documents.
- **Natural Language Input**: Use everyday language for reminders.
- **Unique Themes**: Stand out with optional retro Terminal and Game Boy interface styles.
- **Clean Design**: Minimalist interface focused on content.

## System Requirements

- Apple Silicon device (iPhone, iPad, Mac)
- iOS/iPadOS 17.6+ or macOS 14.0+

## Technical Details

Built with SwiftUI and powered by MLX from Apple. Models run efficiently using Metal optimizations on Apple Silicon.

## Getting Started (Running from Source)

To run the Neura app yourself from this source code:

1.  **Prerequisites:**
    *   macOS with Xcode installed (latest version recommended).
    *   An Apple Silicon Mac (for running on Mac or Simulators).
    *   An iPhone or iPad running iOS/iPadOS 17.6+ (for running on device).
    *   An Apple Developer account (may be required for running on a physical device).

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/jimjatt1999/neura.git
    cd neura
    ```

3.  **Open in Xcode:**
    *   Navigate to the cloned directory in Finder.
    *   Double-click the `neura.xcodeproj` file to open the project in Xcode.

4.  **Select Target & Run:**
    *   In Xcode, select your target device (e.g., your connected iPhone, an iOS Simulator, or "My Mac") from the scheme menu near the top.
    *   Click the "Run" button (the play icon ▶️) or press `Cmd + R`.

5.  **Download Models:**
    *   The app will likely need to download the AI models on first launch or prompt you to do so. Follow any in-app instructions.

*(Note: This assumes standard Xcode project setup. Dependencies should be handled automatically by Swift Package Manager if configured in the project.)* 