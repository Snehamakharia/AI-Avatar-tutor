// ==========================================================================
// Sarvam AI Avatar Tutor — Frontend Application Logic
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const userInput = document.getElementById("userInput");
  const chatForm = document.getElementById("chatForm");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("micBtn");
  const languageSelect = document.getElementById("languageSelect");
  const speakerSelect = document.getElementById("speakerSelect");
  const muteToggleBtn = document.getElementById("muteToggleBtn");
  const volumeIcon = document.getElementById("volumeIcon");
  const replayVoiceBtn = document.getElementById("replayVoiceBtn");

  const avatarStage = document.getElementById("avatarStage");
  const headGroup = document.getElementById("headGroup");
  const avatarEyes = document.getElementById("avatarEyes");
  const mouthShape = document.getElementById("mouthShape");
  const avatarStateLabel = document.getElementById("avatarStateLabel");
  const avatarNameDisplay = document.getElementById("avatarNameDisplay");
  const speechVisualizer = document.getElementById("speechVisualizer");
  const visualizerBars = speechVisualizer.querySelectorAll(".vbar");

  const tutorSpeechBubble = document.getElementById("tutorSpeechBubble");
  const diagramTitle = document.getElementById("diagramTitle");
  const conceptVisualGroup = document.getElementById("conceptVisualGroup");
  const diagramKeypoints = document.getElementById("diagramKeypoints");
  const masteryPercent = document.getElementById("masteryPercent");
  const masteryProgressFill = document.getElementById("masteryProgressFill");

  const adaptiveQuizCard = document.getElementById("adaptiveQuizCard");
  const quizQuestionText = document.getElementById("quizQuestionText");
  const quizOptionsContainer = document.getElementById("quizOptionsContainer");
  const quizFeedback = document.getElementById("quizFeedback");

  const studentCanvas = document.getElementById("studentCanvas");
  const drawModeBtn = document.getElementById("drawModeBtn");
  const clearWbBtn = document.getElementById("clearWbBtn");
  const topicChips = document.querySelectorAll(".chip");

  // State
  let isSpeaking = false;
  let isMuted = false;
  let currentAudio = null;
  let lastAudioBase64 = null;
  let audioContext = null;
  let analyser = null;
  let animFrameId = null;
  let conversationHistory = [];
  let currentMastery = 35;
  let activeQuiz = null;
  let isDrawingMode = false;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let recognition = null;
  let isRecording = false;

  // Speaker name mapping
  const speakerNames = {
    priya: "Tutor Priya",
    rohan: "Tutor Rohan",
    kavya: "Tutor Kavya",
    advait: "Tutor Advait"
  };

  // --------------------------------------------------------------------------
  // 1. Avatar Animation System (Blinking, Lip-sync, Gestures)
  // --------------------------------------------------------------------------

  // Natural Random Blinking Loop
  function scheduleNextBlink() {
    const delay = Math.random() * 3500 + 2000;
    setTimeout(() => {
      triggerBlink();
      scheduleNextBlink();
    }, delay);
  }

  function triggerBlink() {
    if (!avatarEyes) return;
    avatarEyes.classList.add("blinking");
    setTimeout(() => {
      avatarEyes.classList.remove("blinking");
    }, 140);
  }
  scheduleNextBlink();

  // Head Gesture Animation
  function avatarGesture(type = "nod") {
    if (!headGroup) return;
    if (type === "nod") {
      headGroup.style.transform = "translateY(5px) rotate(1.5deg)";
      setTimeout(() => {
        headGroup.style.transform = "translateY(-2px) rotate(-1deg)";
        setTimeout(() => {
          headGroup.style.transform = "translateY(0px) rotate(0deg)";
        }, 300);
      }, 250);
    } else if (type === "tilt") {
      headGroup.style.transform = "rotate(3.5deg) translateY(-2px)";
      setTimeout(() => {
        headGroup.style.transform = "rotate(0deg) translateY(0px)";
      }, 800);
    }
  }

  // Mouth Movement and Lip-Sync from Audio Frequency Analysis
  function startLipSync(audioElement) {
    isSpeaking = true;
    avatarStage.classList.add("speaking");
    speechVisualizer.classList.add("speaking-active");
    avatarStateLabel.textContent = "Speaking (Bulbul v3)";

    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function updateMouth() {
        if (!isSpeaking) return;

        analyser.getByteFrequencyData(dataArray);

        // Calculate average energy
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(avg / 120, 1.0);

        // Update SVG mouth path shape dynamically
        if (mouthShape) {
          const mouthOpen = 182 + normalized * 18;
          const mouthWidth = 14 + normalized * 6;
          mouthShape.setAttribute(
            "d",
            `M${160 - mouthWidth} 182 Q160 ${mouthOpen} ${160 + mouthWidth} 182 Q160 ${186 - normalized * 4} ${160 - mouthWidth} 182 Z`
          );
        }

        // Update waveform spectrum visualizer bars
        visualizerBars.forEach((bar, idx) => {
          const val = dataArray[idx % bufferLength] || 10;
          const barHeight = Math.max(4, (val / 255) * 28);
          bar.style.height = `${barHeight}px`;
        });

        animFrameId = requestAnimationFrame(updateMouth);
      }

      updateMouth();
    } catch (err) {
      console.warn("Web Audio API media element source fallback:", err);
      // Fallback synthetic lip-sync
      let toggle = false;
      const interval = setInterval(() => {
        if (!isSpeaking) {
          clearInterval(interval);
          return;
        }
        toggle = !toggle;
        if (mouthShape) {
          mouthShape.setAttribute(
            "d",
            toggle
              ? "M144 182 Q160 196 176 182 Q160 185 144 182 Z"
              : "M146 182 Q160 187 174 182 Q160 184 146 182 Z"
          );
        }
        visualizerBars.forEach((bar) => {
          bar.style.height = `${Math.floor(Math.random() * 20) + 6}px`;
        });
      }, 120);
    }
  }

  function stopLipSync() {
    isSpeaking = false;
    avatarStage.classList.remove("speaking");
    speechVisualizer.classList.remove("speaking-active");
    avatarStateLabel.textContent = "Ready to teach";

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }

    if (mouthShape) {
      mouthShape.setAttribute("d", "M146 182 Q160 188 174 182 Q160 185 146 182 Z");
    }

    visualizerBars.forEach((bar) => {
      bar.style.height = "6px";
    });
  }

  // --------------------------------------------------------------------------
  // 2. Sarvam Audio Playback (Text-To-Speech)
  // --------------------------------------------------------------------------

  async function speakText(text) {
    if (isMuted || !text) return;

    if (currentAudio) {
      currentAudio.pause();
      stopLipSync();
    }

    avatarStateLabel.textContent = "Synthesizing voice...";

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          language_code: languageSelect.value,
          speaker: speakerSelect.value
        })
      });

      const data = await response.json();
      if (data.audio) {
        lastAudioBase64 = data.audio;
        playBase64Audio(data.audio);
      } else {
        avatarStateLabel.textContent = "Ready";
      }
    } catch (err) {
      console.error("Failed to generate Sarvam TTS:", err);
      avatarStateLabel.textContent = "Ready";
    }
  }

  function playBase64Audio(base64) {
    if (currentAudio) {
      currentAudio.pause();
    }

    const audioUrl = `data:audio/wav;base64,${base64}`;
    currentAudio = new Audio(audioUrl);

    currentAudio.onplay = () => {
      startLipSync(currentAudio);
      avatarGesture("nod");
    };

    currentAudio.onended = () => {
      stopLipSync();
    };

    currentAudio.onerror = (e) => {
      console.warn("Audio playback error:", e);
      stopLipSync();
    };

    currentAudio.play().catch((err) => {
      console.warn("Audio autoplay blocked by browser policy:", err);
      avatarStateLabel.textContent = "Click anywhere to hear audio";
    });
  }

  // Mute / Unmute Button
  muteToggleBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    if (isMuted) {
      if (currentAudio) currentAudio.pause();
      stopLipSync();
      volumeIcon.innerHTML = `<line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line>`;
      muteToggleBtn.title = "Unmute Voice";
    } else {
      volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
      muteToggleBtn.title = "Mute Voice";
      if (lastAudioBase64) {
        playBase64Audio(lastAudioBase64);
      }
    }
  });

  // Replay Audio Button
  replayVoiceBtn.addEventListener("click", () => {
    if (lastAudioBase64) {
      playBase64Audio(lastAudioBase64);
    } else {
      speakText(tutorSpeechBubble.textContent);
    }
  });

  // Speaker Select change
  speakerSelect.addEventListener("change", (e) => {
    const name = speakerNames[e.target.value] || "Tutor Priya";
    avatarNameDisplay.textContent = name;
  });

  // --------------------------------------------------------------------------
  // 3. Interactive Whiteboard Rendering Engine
  // --------------------------------------------------------------------------

  function renderWhiteboard(wbData) {
    if (!wbData) return;

    diagramTitle.textContent = wbData.title || "Concept Diagram";

    // Build vector diagram based on concept type
    const visualType = wbData.visualType || "triangle";
    let svgContent = "";

    if (visualType === "triangle" || visualType === "geometry") {
      svgContent = `
        <polygon points="120,220 380,220 380,80" fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" stroke-width="3"/>
        <rect x="360" y="200" width="20" height="20" fill="none" stroke="#818cf8" stroke-width="2"/>
        <text x="250" y="245" fill="#e2e8f0" font-family="'Outfit', sans-serif" font-size="16" font-weight="600">Base a = 4</text>
        <text x="395" y="155" fill="#e2e8f0" font-family="'Outfit', sans-serif" font-size="16" font-weight="600">Height b = 3</text>
        <text x="210" y="140" fill="#a5b4fc" font-family="'Outfit', sans-serif" font-size="16" font-weight="700">Hypotenuse c = 5</text>
        <rect x="430" y="50" width="150" height="110" rx="8" fill="rgba(30, 41, 59, 0.7)" stroke="rgba(255,255,255,0.1)"/>
        <text x="445" y="80" fill="#38bdf8" font-family="'Outfit', sans-serif" font-size="18" font-weight="800">${wbData.formula || "a² + b² = c²"}</text>
        <text x="445" y="110" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="13">3² + 4² = 9 + 16 = 25</text>
        <text x="445" y="135" fill="#34d399" font-family="'Inter', sans-serif" font-size="14" font-weight="700">c = √25 = 5 ✓</text>
      `;
    } else if (visualType === "photosynthesis" || visualType === "biology") {
      svgContent = `
        <!-- Sun -->
        <circle cx="100" cy="70" r="30" fill="#f59e0b" filter="drop-shadow(0 0 15px #f59e0b)"/>
        <path d="M100 25 L100 10 M100 115 L100 130 M55 70 L40 70 M145 70 L160 70 M68 38 L57 27 M132 102 L143 113" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
        <!-- Sunlight ray to plant -->
        <path d="M130 90 L240 160" stroke="#fef08a" stroke-width="2.5" stroke-dasharray="6,4"/>
        <text x="145" y="120" fill="#fef08a" font-family="'Outfit', sans-serif" font-size="13" font-weight="600">Light Energy (Photons)</text>
        <!-- Plant Leaf -->
        <path d="M220 220 Q280 120 380 150 Q380 230 220 220 Z" fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" stroke-width="3"/>
        <path d="M220 220 Q300 185 380 150" stroke="#059669" stroke-width="2"/>
        <text x="270" y="195" fill="#6ee7b7" font-family="'Outfit', sans-serif" font-size="15" font-weight="700">Chloroplast</text>
        <!-- Inflow & Outflow -->
        <text x="140" y="240" fill="#38bdf8" font-family="'Inter', sans-serif" font-size="14" font-weight="600">IN: 6 CO₂ + 6 H₂O</text>
        <text x="350" y="240" fill="#34d399" font-family="'Inter', sans-serif" font-size="14" font-weight="700">OUT: C₆H₁₂O₆ (Glucose) + 6 O₂</text>
      `;
    } else if (visualType === "force" || visualType === "physics") {
      svgContent = `
        <!-- Rocket / Action Reaction Body -->
        <rect x="230" y="60" width="100" height="150" rx="20" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" stroke-width="3"/>
        <polygon points="280,20 230,60 330,60" fill="#4f46e5"/>
        <circle cx="280" cy="110" r="16" fill="#38bdf8"/>
        <!-- Action Force Arrow Down (Exhaust Gas) -->
        <path d="M280 210 L280 270" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
        <polygon points="274,260 286,260 280,275" fill="#ef4444"/>
        <text x="295" y="255" fill="#fca5a5" font-family="'Outfit', sans-serif" font-size="14" font-weight="700">Action: Exhaust Push Down</text>
        <!-- Reaction Force Arrow Up (Thrust) -->
        <path d="M280 50 L280 10" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
        <polygon points="274,20 286,20 280,5" fill="#10b981"/>
        <text x="295" y="35" fill="#6ee7b7" font-family="'Outfit', sans-serif" font-size="14" font-weight="700">Reaction: Rocket Thrust Up</text>
        <!-- Formula Box -->
        <rect x="40" y="90" width="160" height="70" rx="8" fill="rgba(30, 41, 59, 0.7)" stroke="rgba(255,255,255,0.1)"/>
        <text x="55" y="125" fill="#f59e0b" font-family="'Outfit', sans-serif" font-size="18" font-weight="800">F_action = - F_reaction</text>
        <text x="55" y="145" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="12">Equal &amp; Opposite</text>
      `;
    } else if (visualType === "binary_search" || visualType === "code") {
      svgContent = `
        <!-- Array Blocks -->
        <g transform="translate(60, 100)">
          <rect x="0" y="0" width="55" height="55" rx="6" fill="rgba(255,255,255,0.05)" stroke="#64748b" stroke-width="2"/>
          <text x="27" y="34" fill="#94a3b8" font-family="'Outfit', sans-serif" font-size="16" text-anchor="middle">2</text>

          <rect x="65" y="0" width="55" height="55" rx="6" fill="rgba(255,255,255,0.05)" stroke="#64748b" stroke-width="2"/>
          <text x="92" y="34" fill="#94a3b8" font-family="'Outfit', sans-serif" font-size="16" text-anchor="middle">5</text>

          <rect x="130" y="0" width="55" height="55" rx="6" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" stroke-width="2.5"/>
          <text x="157" y="34" fill="#818cf8" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" text-anchor="middle">8</text>
          <text x="157" y="-12" fill="#818cf8" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" text-anchor="middle">low</text>

          <!-- TARGET MID -->
          <rect x="195" y="0" width="55" height="55" rx="6" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="3"/>
          <text x="222" y="34" fill="#34d399" font-family="'Outfit', sans-serif" font-size="18" font-weight="800" text-anchor="middle">12</text>
          <text x="222" y="-12" fill="#34d399" font-family="'Outfit', sans-serif" font-size="13" font-weight="800" text-anchor="middle">MID (Match!)</text>

          <rect x="260" y="0" width="55" height="55" rx="6" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" stroke-width="2.5"/>
          <text x="287" y="34" fill="#818cf8" font-family="'Outfit', sans-serif" font-size="16" font-weight="700" text-anchor="middle">19</text>
          <text x="287" y="-12" fill="#818cf8" font-family="'Outfit', sans-serif" font-size="12" font-weight="700" text-anchor="middle">high</text>

          <rect x="325" y="0" width="55" height="55" rx="6" fill="rgba(255,255,255,0.05)" stroke="#64748b" stroke-width="2"/>
          <text x="352" y="34" fill="#94a3b8" font-family="'Outfit', sans-serif" font-size="16" text-anchor="middle">24</text>
        </g>
        <rect x="60" y="190" width="450" height="40" rx="8" fill="rgba(15, 23, 42, 0.8)"/>
        <text x="80" y="215" fill="#38bdf8" font-family="'Inter', sans-serif" font-size="14" font-weight="600">Time Complexity: O(log N) • Divide &amp; Conquer</text>
      `;
    } else {
      // General formula card
      svgContent = `
        <rect x="60" y="40" width="480" height="180" rx="12" fill="rgba(30, 41, 59, 0.6)" stroke="#6366f1" stroke-width="2"/>
        <text x="100" y="100" fill="#38bdf8" font-family="'Outfit', sans-serif" font-size="24" font-weight="800">${wbData.formula || wbData.title}</text>
        <text x="100" y="145" fill="#e2e8f0" font-family="'Inter', sans-serif" font-size="16">${wbData.summary || "Interactive Concept Representation"}</text>
      `;
    }

    conceptVisualGroup.innerHTML = svgContent;

    // Keypoints
    if (wbData.keyPoints && wbData.keyPoints.length) {
      diagramKeypoints.innerHTML = wbData.keyPoints
        .map(
          (kp, i) =>
            `<div class="keypoint-pill"><span class="bullet">${i + 1}</span> ${kp}</div>`
        )
        .join("");
    }
  }

  // --------------------------------------------------------------------------
  // 4. Adaptive Checkpoint Quiz Engine
  // --------------------------------------------------------------------------

  function renderQuiz(quizData) {
    if (!quizData || !quizData.options) {
      adaptiveQuizCard.style.display = "none";
      return;
    }

    activeQuiz = quizData;
    adaptiveQuizCard.style.display = "flex";
    quizQuestionText.textContent = quizData.question;
    quizFeedback.className = "quiz-feedback";
    quizFeedback.style.display = "none";

    quizOptionsContainer.innerHTML = quizData.options
      .map(
        (opt, idx) =>
          `<button class="quiz-option" data-index="${idx}">${opt}</button>`
      )
      .join("");

    const optionBtns = quizOptionsContainer.querySelectorAll(".quiz-option");
    optionBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectedIdx = parseInt(btn.getAttribute("data-index"), 10);
        handleQuizAnswer(selectedIdx, btn, optionBtns);
      });
    });
  }

  function handleQuizAnswer(selectedIdx, clickedBtn, allBtns) {
    if (!activeQuiz) return;

    allBtns.forEach((b) => (b.disabled = true));

    if (selectedIdx === activeQuiz.correctIndex) {
      clickedBtn.classList.add("correct");
      quizFeedback.className = "quiz-feedback success";
      quizFeedback.textContent = `🎉 Correct! ${activeQuiz.explanation || "Excellent reasoning!"}`;
      
      // Update Mastery
      currentMastery = Math.min(100, currentMastery + 15);
      masteryPercent.textContent = `${currentMastery}%`;
      masteryProgressFill.style.width = `${currentMastery}%`;

      avatarGesture("nod");
    } else {
      clickedBtn.classList.add("wrong");
      allBtns[activeQuiz.correctIndex].classList.add("correct");
      quizFeedback.className = "quiz-feedback error";
      quizFeedback.textContent = `Not quite. ${activeQuiz.explanation || "Let's review this step together!"}`;
      avatarGesture("tilt");
    }
  }

  // --------------------------------------------------------------------------
  // 5. Chat Interaction & API Orchestration
  // --------------------------------------------------------------------------

  async function handleUserQuestion(messageText, topic = "General") {
    if (!messageText.trim()) return;

    // UI State: Loading / Thinking
    sendBtn.disabled = true;
    avatarStateLabel.textContent = "Thinking (Sarvam-105B)...";
    avatarGesture("tilt");

    tutorSpeechBubble.innerHTML = `<span style="color: #94a3b8; font-style: italic;">Thinking about your question...</span>`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: conversationHistory,
          language: languageSelect.value,
          topic: topic
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update dialogue bubble
      tutorSpeechBubble.textContent = data.reply;
      conversationHistory.push({ role: "user", content: messageText });
      conversationHistory.push({ role: "assistant", content: data.reply });

      // Update Whiteboard
      if (data.whiteboard) {
        renderWhiteboard(data.whiteboard);
      }

      // Update Quiz
      if (data.quiz) {
        renderQuiz(data.quiz);
      }

      // Synthesize Speech with Sarvam Bulbul v3
      speakText(data.reply);
    } catch (err) {
      console.error("Chat error:", err);
      tutorSpeechBubble.textContent =
        "I experienced an issue processing that question. Let's try again!";
      avatarStateLabel.textContent = "Ready";
    } finally {
      sendBtn.disabled = false;
      userInput.value = "";
    }
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = userInput.value;
    handleUserQuestion(query);
  });

  // Quick Lesson Chips
  topicChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const topic = chip.getAttribute("data-topic");
      const question = `Please explain the concept of ${topic} visually with key formulas and steps.`;
      userInput.value = question;
      handleUserQuestion(question, topic);
    });
  });

  // Language Change Listener
  languageSelect.addEventListener("change", async (e) => {
    const langCode = e.target.value;
    avatarStateLabel.textContent = "Switching language...";

    const currentText = tutorSpeechBubble.textContent;
    if (currentText) {
      try {
        const transRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: currentText.slice(0, 300),
            source_language_code: "en-IN",
            target_language_code: langCode
          })
        });
        const transData = await transRes.json();
        if (transData.translated_text) {
          tutorSpeechBubble.textContent = transData.translated_text;
          speakText(transData.translated_text);
        }
      } catch (err) {
        console.warn("Translation switch error:", err);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 6. Speech-To-Text Microphone (Web Speech Recognition)
  // --------------------------------------------------------------------------

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isRecording = true;
      micBtn.classList.add("recording");
      avatarStateLabel.textContent = "Listening to you...";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      handleUserQuestion(transcript);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      micBtn.classList.remove("recording");
      isRecording = false;
      avatarStateLabel.textContent = "Ready";
    };

    recognition.onend = () => {
      micBtn.classList.remove("recording");
      isRecording = false;
    };

    micBtn.addEventListener("click", () => {
      if (isRecording) {
        recognition.stop();
      } else {
        recognition.lang = languageSelect.value;
        recognition.start();
      }
    });
  } else {
    micBtn.title = "Speech recognition not supported in this browser";
    micBtn.style.opacity = "0.5";
  }

  // --------------------------------------------------------------------------
  // 7. Student Freehand Canvas Whiteboard Tool
  // --------------------------------------------------------------------------

  const ctx = studentCanvas.getContext("2d");

  function resizeCanvas() {
    studentCanvas.width = studentCanvas.parentElement.clientWidth;
    studentCanvas.height = studentCanvas.parentElement.clientHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  drawModeBtn.addEventListener("click", () => {
    isDrawingMode = !isDrawingMode;
    studentCanvas.classList.toggle("active", isDrawingMode);
    drawModeBtn.classList.toggle("active", isDrawingMode);
    drawModeBtn.innerHTML = isDrawingMode
      ? `<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg> Exit Pen`
      : `<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg> Student Pen`;
  });

  clearWbBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, studentCanvas.width, studentCanvas.height);
  });

  studentCanvas.addEventListener("mousedown", (e) => {
    if (!isDrawingMode) return;
    isDrawing = true;
    const rect = studentCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });

  studentCanvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !isDrawingMode) return;
    const rect = studentCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  });

  window.addEventListener("mouseup", () => {
    isDrawing = false;
  });

  // Initial greeting audio trigger (first interactive touch)
  document.body.addEventListener(
    "click",
    () => {
      if (!lastAudioBase64 && !isSpeaking) {
        speakText(tutorSpeechBubble.textContent);
      }
    },
    { once: true }
  );
});
