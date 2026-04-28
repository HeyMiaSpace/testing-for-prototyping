const sageTrigger = document.getElementById("sageTrigger");
const sagePanel = document.getElementById("sagePanel");
const askButton = document.getElementById("askSageButton");
const voiceButton = document.getElementById("voiceButton");
const voiceTranscript = document.getElementById("voiceTranscript");
const voiceStatus = document.getElementById("voiceStatus");
const loadingChip = document.getElementById("loadingChip");
const examEditorShell = document.querySelector(".exam-editor-shell");
const examNote = document.getElementById("examNote");
const acceptButton = document.getElementById("acceptButton");
const discardButton = document.getElementById("discardButton");
const decisionRow = document.querySelector(".decision-row");

const defaultPrompt = "Summarize the last visit";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let state = "default";
let loadingTimer;
let recognition;
let isListening = false;

function updateExamState() {
  const hasText = examNote.textContent.trim().length > 0;
  examNote.classList.toggle("empty", !hasText);
  sageTrigger.style.display = hasText ? "none" : "flex";
  decisionRow.classList.toggle("hidden", !hasText);
}

function setTranscript(value) {
  voiceTranscript.value = value || defaultPrompt;
}

function closeSagePanel() {
  sagePanel.classList.remove("visible");
  sagePanel.setAttribute("aria-hidden", "true");
  sageTrigger.setAttribute("aria-expanded", "false");
}

function openSagePanel() {
  if (state !== "default") return;

  state = "prompt";
  examEditorShell.classList.add("active");
  sageTrigger.classList.add("caret-on");
  sageTrigger.setAttribute("aria-expanded", "true");
  sagePanel.classList.add("visible");
  sagePanel.setAttribute("aria-hidden", "false");
  voiceStatus.textContent = "Use the microphone to speak your question.";
  requestAnimationFrame(() => {
    voiceTranscript.focus();
    voiceTranscript.setSelectionRange(0, voiceTranscript.value.length);
  });
}

function showLoading() {
  loadingChip.classList.add("visible");
  loadingChip.setAttribute("aria-hidden", "false");
}

function hideLoading() {
  loadingChip.classList.remove("visible");
  loadingChip.setAttribute("aria-hidden", "true");
}

function placeCaretAtEnd(element) {
  element.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function stopListening() {
  if (!recognition || !isListening) return;
  isListening = false;
  recognition.stop();
  voiceButton.classList.remove("listening");
}

function startListening() {
  if (!SpeechRecognition) {
    voiceStatus.textContent = "Voice input is not available in this browser. Use Chrome to demo the microphone flow.";
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      voiceButton.classList.add("listening");
      voiceStatus.textContent = "Listening...";
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();

      if (transcript) {
        setTranscript(transcript);
      }

      const lastResult = event.results[event.results.length - 1];
      voiceStatus.textContent = lastResult.isFinal ? "Voice question captured." : "Listening...";
    };

    recognition.onerror = () => {
      isListening = false;
      voiceButton.classList.remove("listening");
      voiceStatus.textContent = "Microphone permission or speech capture failed.";
    };

    recognition.onend = () => {
      isListening = false;
      voiceButton.classList.remove("listening");
      if (state === "prompt" && voiceStatus.textContent === "Listening...") {
        voiceStatus.textContent = "Voice question captured.";
      }
    };
  }

  recognition.start();
}

function toSentenceCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function generateDraft(question) {
  const normalized = question.trim().toLowerCase();
  const promptLabel = toSentenceCase(question.trim() || defaultPrompt);

  if (normalized.includes("last visit") || normalized.includes("summarize")) {
    return `Reviewed the prior visit and interval history with the patient. Since the last encounter, the patient reports stable day-to-day symptoms without new cardiopulmonary complaints, no recent urgent care visits, and good adherence with the current medication plan. We revisited the previous laboratory abnormalities and overall treatment response, then reinforced follow-up timing, return precautions, and continued monitoring as scheduled.`;
  }

  if (normalized.includes("lab") || normalized.includes("cbc") || normalized.includes("result")) {
    return `Requested Sage support for: ${promptLabel}. The note draft highlights mild persistent laboratory abnormalities without clear interval worsening, including previously documented CBC variation. Findings were reviewed with the patient, questions were answered, and the current plan is to trend repeat labs, monitor for new symptoms, and continue the present management approach pending follow-up results.`;
  }

  if (normalized.includes("plan") || normalized.includes("next step") || normalized.includes("follow up")) {
    return `Requested Sage support for: ${promptLabel}. The assessment and plan emphasize a stable clinical course today, continuation of the existing medication and monitoring strategy, and close outpatient follow-up. The patient was advised on warning signs that should prompt earlier reassessment, and next steps were reviewed in plain language before the visit concluded.`;
  }

  if (normalized.includes("med") || normalized.includes("medication")) {
    return `Requested Sage support for: ${promptLabel}. Medication adherence was reviewed and the patient denies significant side effects or barriers to taking the current regimen. We discussed continued use of the present medications, reinforced counseling points, and documented that additional adjustments can be considered if symptoms change before the next scheduled follow-up.`;
  }

  return `Requested Sage support for: ${promptLabel}. The generated note summarizes the patient as clinically stable today with no major new concerns raised during review. We discussed interval symptoms, reviewed the most relevant history tied to this question, and documented a practical next-step plan including monitoring, follow-up, and return precautions as appropriate.`;
}

function insertDraft(question, { animate = true } = {}) {
  examNote.style.transition = animate ? "opacity 220ms ease" : "none";
  examNote.style.opacity = animate ? "0.35" : "1";
  examNote.textContent = generateDraft(question).trim();
  updateExamState();

  if (animate) {
    requestAnimationFrame(() => {
      examNote.style.opacity = "1";
    });
  }

  placeCaretAtEnd(examNote);
  examEditorShell.classList.add("active");
  state = "inserted";
}

function resetToDefault() {
  clearTimeout(loadingTimer);
  stopListening();
  state = "default";
  closeSagePanel();
  hideLoading();
  askButton.disabled = false;
  askButton.textContent = "Ask Sage";
  examNote.textContent = "";
  examNote.style.transition = "none";
  examNote.style.opacity = "1";
  setTranscript(defaultPrompt);
  voiceStatus.textContent = "Use the microphone to speak your question.";
  sageTrigger.classList.remove("caret-on");
  examEditorShell.classList.remove("active");
  updateExamState();
  sageTrigger.focus();
}

function initializeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const requestedState = params.get("state");

  if (requestedState === "prompt") {
    openSagePanel();
    return;
  }

  if (requestedState === "inserted") {
    insertDraft(defaultPrompt, { animate: false });
  }
}

sageTrigger.addEventListener("click", openSagePanel);

sageTrigger.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    openSagePanel();
  }
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isEditable =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable;

  if (event.code === "Space" && state === "default" && !isEditable) {
    event.preventDefault();
    openSagePanel();
  }
});

voiceTranscript.addEventListener("input", () => {
  if (voiceTranscript.value.trim()) {
    voiceStatus.textContent = "Question ready to send.";
  } else {
    voiceStatus.textContent = "Use the microphone to speak your question.";
  }
});

voiceButton.addEventListener("click", () => {
  if (isListening) {
    stopListening();
    voiceStatus.textContent = "Voice question captured.";
    return;
  }

  startListening();
});

askButton.addEventListener("click", () => {
  if (state !== "prompt") return;

  const question = voiceTranscript.value.trim() || defaultPrompt;

  askButton.disabled = true;
  askButton.textContent = "Drafting...";
  stopListening();
  closeSagePanel();
  showLoading();
  state = "loading";

  loadingTimer = window.setTimeout(() => {
    hideLoading();
    askButton.disabled = false;
    askButton.textContent = "Ask Sage";
    insertDraft(question);
  }, 1000);
});

acceptButton.addEventListener("click", () => {
  decisionRow.classList.add("hidden");
  placeCaretAtEnd(examNote);
});

discardButton.addEventListener("click", resetToDefault);

document.addEventListener("click", (event) => {
  const clickedInsidePanel = sagePanel.contains(event.target);
  const clickedTrigger = sageTrigger.contains(event.target);

  if (state === "prompt" && !clickedInsidePanel && !clickedTrigger) {
    stopListening();
    closeSagePanel();
    sageTrigger.classList.remove("caret-on");
    examEditorShell.classList.remove("active");
    state = "default";
  }
});

examNote.addEventListener("focus", () => {
  examEditorShell.classList.add("active");
});

examNote.addEventListener("blur", () => {
  if (state !== "prompt") {
    examEditorShell.classList.remove("active");
  }
});

setTranscript(defaultPrompt);
updateExamState();
initializeFromQuery();
