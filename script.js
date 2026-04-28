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

function normalizeQuestion(question) {
  return (question || "").trim();
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

function buildBaseResponse(question) {
  const normalized = question.toLowerCase();

  if (normalized.includes("last visit") || normalized.includes("summarize")) {
    return `Interval history reviewed from the prior visit. The patient reports an overall stable course since the last encounter, without new cardiopulmonary complaints, no interval ED visits, and continued adherence to the current treatment plan. Prior laboratory findings were revisited with the patient, and the plan remains continued monitoring, repeat testing as scheduled, and reinforcement of return precautions.`;
  }

  if (normalized.includes("lab") || normalized.includes("cbc") || normalized.includes("result")) {
    return `Laboratory trends were reviewed for the chart. Previously documented CBC variation appears persistent but clinically stable without a clear interval decline. Findings were discussed with the patient, and the working plan is to continue trending results, monitor for symptom change, and follow up on repeat studies as already ordered.`;
  }

  if (normalized.includes("plan") || normalized.includes("next step") || normalized.includes("follow up")) {
    return `Assessment and plan reviewed for the current encounter. The patient appears clinically stable today, so the plan is to continue the present management strategy, reinforce monitoring instructions, and keep close outpatient follow-up. Return precautions were reviewed and next steps were explained clearly before closing the visit.`;
  }

  if (normalized.includes("med") || normalized.includes("medication")) {
    return `Medication review completed for the chart. The patient reports ongoing adherence to the prescribed regimen and does not describe major side effects or new barriers to treatment. Current medications will be continued for now, with reassessment at follow-up if symptoms change or tolerance concerns emerge.`;
  }

  return `Sage reviewed the provider question and drafted a chart-ready response. The patient appears clinically stable based on the available context, with no major new concerns documented today. Relevant interval history, current assessment, and practical next steps were summarized in a way that can be dropped directly into the note and refined by the provider as needed.`;
}

function applyTweakInstruction(question, existingNote) {
  const normalized = question.toLowerCase();

  if (normalized.includes("short") || normalized.includes("concise") || normalized.includes("briefer")) {
    return `Patient remains clinically stable since the last visit without major new concerns. Current plan, monitoring, and follow-up recommendations were reviewed with the patient.`;
  }

  if (normalized.includes("more detail") || normalized.includes("expand") || normalized.includes("elaborate")) {
    return `${existingNote} Additional detail added per provider request: interval symptoms remain stable, adherence has been consistent, prior results were reviewed in context, and follow-up expectations plus return precautions were discussed clearly with the patient.`;
  }

  if (normalized.includes("assessment")) {
    return `Assessment: ${existingNote}`;
  }

  if (normalized.includes("plan")) {
    return `${existingNote} Plan: continue current management, trend indicated studies, reinforce precautions, and reassess at follow-up unless symptoms change sooner.`;
  }

  if (normalized.includes("lab") || normalized.includes("cbc") || normalized.includes("result")) {
    return `${existingNote} Updated emphasis: prior laboratory findings were discussed specifically, with no clear evidence of interval worsening and a continued plan for repeat testing and follow-up review.`;
  }

  if (normalized.includes("med") || normalized.includes("medication")) {
    return `${existingNote} Updated emphasis: medication adherence and tolerance were reviewed, with no major side effects reported at this time.`;
  }

  return `Revised per provider instruction: ${toSentenceCase(question)}. ${existingNote}`;
}

function generateDraft(question, existingNote = "") {
  const cleanQuestion = normalizeQuestion(question) || defaultPrompt;

  if (existingNote.trim()) {
    return applyTweakInstruction(cleanQuestion, existingNote.trim());
  }

  return buildBaseResponse(cleanQuestion);
}

function insertDraft(question, { animate = true } = {}) {
  const existingNote = examNote.textContent.trim();
  const nextDraft = generateDraft(question, existingNote);

  examNote.style.transition = animate ? "opacity 220ms ease" : "none";
  examNote.style.opacity = animate ? "0.35" : "1";
  examNote.textContent = nextDraft.trim();
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

  const question = normalizeQuestion(voiceTranscript.value) || defaultPrompt;

  askButton.disabled = true;
  askButton.textContent = "Drafting...";
  stopListening();
  showLoading();
  state = "loading";
  voiceStatus.textContent = "Sage is drafting a response for the chart...";

  loadingTimer = window.setTimeout(() => {
    hideLoading();
    askButton.disabled = false;
    askButton.textContent = "Ask Sage";
    insertDraft(question);
    voiceStatus.textContent = "Ask a follow-up to refine the note.";
    sagePanel.classList.add("visible");
    sagePanel.setAttribute("aria-hidden", "false");
    sageTrigger.setAttribute("aria-expanded", "true");
    state = "prompt";
    requestAnimationFrame(() => {
      voiceTranscript.focus();
      voiceTranscript.select();
    });
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
