# 🎓 Sarvam AI Avatar Tutor

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![Sarvam AI SDK](https://img.shields.io/badge/Sarvam_AI-SDK_v1.1+-indigo.svg)](https://docs.sarvam.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An interactive, multilingual **AI Avatar Tutor** powered by **Sarvam AI**. The tutor teaches complex concepts across science, mathematics, coding, and history through an expressive animated avatar, native Indic speech synthesis, an interactive visual whiteboard, and adaptive checkpoints.

---

## ✨ Features

- **🗣️ Lifelike Animated Avatar**:
  - Expressive facial features with natural eye blinking, gentle breathing gestures, and real-time lip-sync synchronized to audio amplitude.
  - Live audio spectrum visualizer reacting dynamically to spoken audio.
  - Multiple voice personas (*Priya*, *Rohan*, *Kavya*, *Advait*).

- **🧠 Conversational Brain (`sarvam-105b-conversations`)**:
  - Real-time pedagogical reasoning that breaks down concepts into intuitive, friendly steps.
  - Generates structured whiteboard actions and adaptive checkpoint quizzes on the fly.

- **🔊 Expressive Speech Synthesis (`bulbul:v3`)**:
  - Converts tutor responses into natural-sounding speech across Indian languages with low latency.

- **📋 Interactive Visual Whiteboard**:
  - Dynamically renders interactive vector diagrams for concepts (e.g., *Pythagorean Theorem*, *Photosynthesis*, *Newton's 3rd Law*, *Binary Search*).
  - Includes a **Student Pen** mode for freehand sketching and problem solving.

- **🎯 Adaptive Checkpoints & Mastery Tracking**:
  - Generates multiple-choice questions to test understanding with immediate celebratory or corrective feedback.
  - Real-time **Concept Mastery** gauge and session streak tracking.

- **🇮🇳 Multilingual Indic Support**:
  - Native support for **English (India)**, **हिंदी (Hindi)**, **தமிழ் (Tamil)**, **తెలుగు (Telugu)**, **বাংলা (Bengali)**, and **ಕನ್ನಡ (Kannada)**.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- A **Sarvam AI API Key** (Get one at [dashboard.sarvam.ai](https://dashboard.sarvam.ai))

### 2. Clone the Repository
```bash
git clone https://github.com/Snehamakharia/sarvam-ai-avatar-tutor.git
cd sarvam-ai-avatar-tutor
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment
Copy the example environment file and add your Sarvam API key:
```bash
cp .env.example .env
```
Edit `.env`:
```env
SARVAM_API_KEY=your_sarvam_api_key_here
PORT=3000
```

> **Security Note:** `.env` is listed in `.gitignore` and is never committed to GitHub.

### 5. Launch the Application
```bash
npm start
```
Visit **`http://localhost:3000`** in your browser!

---

## 📁 Project Structure

```text
├── public/
│   ├── index.html       # Classroom dashboard layout
│   ├── style.css        # Modern glassmorphism & responsive styling
│   └── app.js           # Avatar lip-sync, whiteboard engine & client logic
├── .env.example         # Template for environment configuration
├── .gitignore           # Ignores .env and node_modules
├── index.js             # Minimal CLI chat completion test
├── server.js            # Node.js backend server orchestrating Sarvam APIs
├── package.json         # Project metadata and dependencies
└── README.md            # Project documentation
```

---

## 🛠️ Tech Stack & Models

| Component | Technology / Model |
| :--- | :--- |
| **Conversational Intelligence** | `sarvam-105b-conversations` |
| **Text-to-Speech (TTS)** | `bulbul:v3` |
| **Language Translation** | `mayura:v1` (Sarvam Translate) |
| **Backend** | Node.js native HTTP server + `sarvamai` SDK |
| **Frontend** | Vanilla JavaScript, SVG Vector Graphics, HTML5 Canvas, Web Audio API |

---

## 📄 License
This project is licensed under the MIT License.
