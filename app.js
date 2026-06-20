const STORAGE_KEY = "dc-flight-deck-v1";

const topicSignals = [
  { id: "networking", name: "Networking", color: "#42d9c8", keywords: ["network", "subnet", "vlan", "switch", "router", "fiber", "cable", "console", "dhcp", "dns", "ip", "sfp", "ethernet"] },
  { id: "power", name: "Power", color: "#ffbf69", keywords: ["power", "pdu", "ups", "phase", "wye", "delta", "voltage", "amp", "circuit", "load", "breaker"] },
  { id: "cooling", name: "Cooling", color: "#9ef06f", keywords: ["cooling", "airflow", "hot aisle", "cold aisle", "temperature", "humidity", "crac", "containment"] },
  { id: "hardware", name: "Hardware", color: "#d28cff", keywords: ["server", "rack", "rail", "cpu", "ram", "drive", "raid", "bios", "bmc", "idrac", "ilo"] },
  { id: "professional", name: "Professional", color: "#ff6b6b", keywords: ["interview", "resume", "star", "professional", "communication", "ticket", "escalate", "safety"] }
];

const demoTopics = [
  {
    title: "Cisco console access",
    details: "Practiced console cable setup. Still need to remember rollover versus straight-through and when console is separate from Ethernet.",
    confidence: 2
  },
  {
    title: "Three-phase PDU load math",
    details: "Covered Wye, Delta, PDU load balancing, and why moving power cords requires label/load checks.",
    confidence: 2
  },
  {
    title: "Hot aisle and cold aisle airflow",
    details: "Basic layout makes sense. Need more reps spotting blocked exhaust and messy cable management.",
    confidence: 3
  }
];

const tickets = [
  {
    title: "Explain it to a lead tech",
    body: "A lead asks you to explain the topic clearly, identify the risk if it is done wrong, and name your first verification step.",
    tags: ["explain", "risk", "verify"]
  },
  {
    title: "Lab check before sign-off",
    body: "You are asked to sign off on a lab involving this topic. What evidence would you gather before saying you understand it?",
    tags: ["lab", "evidence", "confidence"]
  },
  {
    title: "Interview follow-up",
    body: "An interviewer asks how you would troubleshoot a problem related to this topic. Give a safe, ordered answer.",
    tags: ["interview", "sequence", "safety"]
  }
];

let state = loadState();
let selectedDateKey = dateKey(new Date());
let visibleWeekStart = startOfWeek(new Date());
let currentTicket = null;

const els = {
  sections: document.querySelectorAll(".workspace-section"),
  navLinks: document.querySelectorAll(".nav-link"),
  storageStatus: document.querySelector("#storage-status"),
  readinessScore: document.querySelector("#readiness-score"),
  overviewCount: document.querySelector("#overview-count"),
  overviewLow: document.querySelector("#overview-low"),
  overviewStrong: document.querySelector("#overview-strong"),
  nextDrill: document.querySelector("#next-drill"),
  captureForm: document.querySelector("#capture-form"),
  topicTitle: document.querySelector("#topic-title"),
  noteInput: document.querySelector("#note-input"),
  topicConfidence: document.querySelector("#topic-confidence"),
  clearInput: document.querySelector("#clear-input"),
  noteCount: document.querySelector("#note-count"),
  ringValue: document.querySelector("#ring-value"),
  signalRing: document.querySelector(".signal-ring"),
  weakestArea: document.querySelector("#weakest-area"),
  openQuestionCount: document.querySelector("#open-question-count"),
  weekRange: document.querySelector("#week-range"),
  weekNoteCount: document.querySelector("#week-note-count"),
  weekCalendar: document.querySelector("#week-calendar"),
  prevWeek: document.querySelector("#prev-week"),
  todayWeek: document.querySelector("#today-week"),
  nextWeek: document.querySelector("#next-week"),
  exportWeek: document.querySelector("#export-week"),
  selectedDayTitle: document.querySelector("#selected-day-title"),
  selectedDayCount: document.querySelector("#selected-day-count"),
  dayTopicForm: document.querySelector("#day-topic-form"),
  dayTopicTitle: document.querySelector("#day-topic-title"),
  dayTopicNotes: document.querySelector("#day-topic-notes"),
  dayTopicConfidence: document.querySelector("#day-topic-confidence"),
  dayReview: document.querySelector("#day-review"),
  reviewThisWeek: document.querySelector("#review-this-week"),
  flashcards: document.querySelector("#flashcards"),
  flashCount: document.querySelector("#flash-count"),
  gapList: document.querySelector("#gap-list"),
  gapCount: document.querySelector("#gap-count"),
  newTicket: document.querySelector("#new-ticket"),
  ticketId: document.querySelector("#ticket-id"),
  ticketDomain: document.querySelector("#ticket-domain"),
  ticketTitle: document.querySelector("#ticket-title"),
  ticketBody: document.querySelector("#ticket-body"),
  ticketTags: document.querySelector("#ticket-tags"),
  responseForm: document.querySelector("#response-form"),
  ticketResponse: document.querySelector("#ticket-response"),
  clearResponse: document.querySelector("#clear-response"),
  gradeOutput: document.querySelector("#grade-output"),
  vaultCount: document.querySelector("#vault-count"),
  noteTimeline: document.querySelector("#note-timeline"),
  markdownPreview: document.querySelector("#markdown-preview"),
  exportMd: document.querySelector("#export-md"),
  exportData: document.querySelector("#export-data"),
  importDataTrigger: document.querySelector("#import-data-trigger"),
  importData: document.querySelector("#import-data"),
  backupStatus: document.querySelector("#backup-status"),
  archiveCount: document.querySelector("#archive-count"),
  weeklyArchive: document.querySelector("#weekly-archive"),
  resetVault: document.querySelector("#reset-vault")
};

function loadState() {
  const fallback = { topics: [], notes: [], lastBackupAt: null };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return fallback;
    const next = { ...fallback, ...saved };

    if (!Array.isArray(next.topics)) next.topics = [];
    if (!next.topics.length && Array.isArray(next.notes) && next.notes.length) {
      next.topics = migrateNotesToTopics(next.notes, saved.confidence);
    }
    next.topics = next.topics.map(normalizeTopic);

    return next;
  } catch {
    return fallback;
  }
}

function averageLegacyConfidence(confidence = {}, ids = []) {
  const values = ids.map((id) => Number(confidence[id])).filter(Boolean);
  if (!values.length) return 3;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function migrateNotesToTopics(notes = [], confidence = {}) {
  return notes.map((note) => normalizeTopic({
    id: note.id || `topic-${crypto.randomUUID()}`,
    title: note.summary?.slice(0, 70) || "Imported note",
    details: note.raw || note.summary || "",
    confidence: averageLegacyConfidence(confidence, note.domains),
    date: dateKey(note.createdAt || new Date()),
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.createdAt || new Date().toISOString(),
    tags: note.tags || []
  }));
}

function normalizeTopic(topic) {
  const createdAt = topic.createdAt || new Date().toISOString();
  return {
    id: topic.id || `topic-${crypto.randomUUID()}`,
    title: topic.title || "Untitled topic",
    details: topic.details || "",
    confidence: Math.min(5, Math.max(1, Number(topic.confidence || 3))),
    date: topic.date || dateKey(createdAt),
    createdAt,
    updatedAt: topic.updatedAt || createdAt,
    tags: Array.isArray(topic.tags) ? topic.tags : []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  els.storageStatus.textContent = "Saved locally";
  els.backupStatus.textContent = state.lastBackupAt ? `Backed up ${formatShortDate(state.lastBackupAt)}` : "Browser vault";
  window.setTimeout(() => {
    els.storageStatus.textContent = "Local vault ready";
  }, 1000);
}

function dateKey(date) {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date) {
  const value = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? dateFromKey(date) : new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatShortDate(date) {
  const value = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? dateFromKey(date) : new Date(date);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(value);
}

function weekKey(date) {
  return dateKey(startOfWeek(date));
}

function weekLabel(weekStart) {
  return `${formatShortDate(weekStart)} - ${formatShortDate(addDays(weekStart, 6))}`;
}

function topicsForDay(key) {
  return state.topics.filter((topic) => topic.date === key).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function topicsForWeek(weekStart) {
  const days = Array.from({ length: 7 }, (_, index) => dateKey(addDays(weekStart, index)));
  return state.topics.filter((topic) => days.includes(topic.date));
}

function getArchiveWeeks() {
  return [...new Set(state.topics.map((topic) => weekKey(topic.date)))]
    .map(dateFromKey)
    .sort((a, b) => b - a);
}

function detectSignals(topic) {
  const text = `${topic.title} ${topic.details}`.toLowerCase();
  return topicSignals.filter((signal) => signal.keywords.some((keyword) => text.includes(keyword)));
}

function getStatus(topics) {
  if (!topics.length) return "empty";
  const min = Math.min(...topics.map((topic) => Number(topic.confidence || 3)));
  if (min <= 2) return "low";
  if (min === 3) return "mid";
  return "high";
}

function averageConfidence(topics = state.topics) {
  if (!topics.length) return 0;
  return Math.round((topics.reduce((sum, topic) => sum + Number(topic.confidence || 3), 0) / (topics.length * 5)) * 100);
}

function lowTopics() {
  return state.topics
    .filter((topic) => Number(topic.confidence || 3) <= 3)
    .sort((a, b) => Number(a.confidence) - Number(b.confidence) || new Date(b.updatedAt) - new Date(a.updatedAt));
}

function addTopic({ title, details, confidence, date }) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;

  state.topics.unshift({
    id: `topic-${crypto.randomUUID()}`,
    title: cleanTitle,
    details: details.trim(),
    confidence: Number(confidence || 3),
    date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: []
  });
  selectedDateKey = date;
  visibleWeekStart = startOfWeek(date);
  saveState();
  render();
}

function updateTopic(id, updates) {
  const topic = state.topics.find((item) => item.id === id);
  if (!topic) return;
  Object.assign(topic, updates, { updatedAt: new Date().toISOString() });
  saveState();
  render();
}

function deleteTopic(id) {
  state.topics = state.topics.filter((topic) => topic.id !== id);
  saveState();
  render();
}

function render() {
  renderNavigation();
  renderStats();
  renderWeek();
  renderReview();
  renderTimeline();
  renderMarkdown();
  renderArchive();
}

function renderNavigation() {
  const active = location.hash || "#week";
  els.sections.forEach((section) => {
    section.classList.toggle("active-section", `#${section.id}` === active);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === active);
  });
}

function renderStats() {
  const todayTopics = topicsForDay(dateKey(new Date()));
  const weak = lowTopics()[0];
  const percent = averageConfidence();
  const low = lowTopics().length;
  const strong = state.topics.filter((topic) => Number(topic.confidence) >= 4).length;

  els.readinessScore.textContent = `${percent}%`;
  els.ringValue.textContent = `${percent}%`;
  els.signalRing.style.setProperty("--value", `${percent * 3.6}deg`);
  els.overviewCount.textContent = `${todayTopics.length} ${todayTopics.length === 1 ? "topic" : "topics"}`;
  els.overviewLow.textContent = String(todayTopics.filter((topic) => Number(topic.confidence) <= 3).length);
  els.overviewStrong.textContent = String(todayTopics.filter((topic) => Number(topic.confidence) >= 4).length);
  els.noteCount.textContent = `${todayTopics.length} ${todayTopics.length === 1 ? "topic" : "topics"}`;
  els.vaultCount.textContent = `${state.topics.length} total`;
  els.weakestArea.textContent = weak ? weak.title : "None yet";
  els.openQuestionCount.textContent = String(low);
  els.nextDrill.textContent = weak ? weak.title : "Add topic";
}

function renderWeek() {
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(visibleWeekStart, index));
  const weekTopics = topicsForWeek(visibleWeekStart);

  els.weekRange.textContent = weekLabel(visibleWeekStart);
  els.weekNoteCount.textContent = `${weekTopics.length} ${weekTopics.length === 1 ? "topic" : "topics"}`;
  els.weekCalendar.innerHTML = "";

  weekDays.forEach((day) => {
    const key = dateKey(day);
    const dayTopics = topicsForDay(key);
    const status = getStatus(dayTopics);
    const lowCount = dayTopics.filter((topic) => Number(topic.confidence) <= 3).length;
    const signals = [...new Set(dayTopics.flatMap((topic) => detectSignals(topic).map((signal) => signal.id)))]
      .map((id) => topicSignals.find((signal) => signal.id === id))
      .filter(Boolean);

    const button = document.createElement("button");
    button.className = `day-card status-${status}`;
    button.type = "button";
    button.classList.toggle("is-selected", key === selectedDateKey);
    button.classList.toggle("is-today", key === dateKey(new Date()));
    button.innerHTML = `
      <span>${new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day)}</span>
      <strong>${day.getDate()}</strong>
      <small>${dayTopics.length} ${dayTopics.length === 1 ? "topic" : "topics"}${lowCount ? ` · ${lowCount} review` : ""}</small>
      <div class="domain-dots">${signals.map((signal) => `<i style="background:${signal.color}; color:${signal.color}"></i>`).join("")}</div>
    `;
    button.addEventListener("click", () => {
      selectedDateKey = key;
      renderWeek();
    });
    els.weekCalendar.append(button);
  });

  renderSelectedDay();
}

function renderSelectedDay() {
  const selectedDate = dateFromKey(selectedDateKey);
  const dayTopics = topicsForDay(selectedDateKey);
  els.selectedDayTitle.textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(selectedDate);
  els.selectedDayCount.textContent = `${dayTopics.length} ${dayTopics.length === 1 ? "topic" : "topics"}`;
  els.dayReview.innerHTML = "";
  els.dayReview.classList.toggle("empty-state", !dayTopics.length);

  if (!dayTopics.length) {
    els.dayReview.textContent = "Add the topics covered this day. Keep it short enough that you will actually use it.";
    return;
  }

  dayTopics.forEach((topic) => {
    const signals = detectSignals(topic);
    const card = document.createElement("article");
    card.className = `topic-card status-${getStatus([topic])}`;
    card.innerHTML = `
      <details open>
        <summary>
          <span>${escapeHtml(topic.title)}</span>
          <strong>${topic.confidence}/5</strong>
        </summary>
        <label>
          Title
          <input data-topic-title="${topic.id}" type="text" value="${escapeHtml(topic.title)}">
        </label>
        <label>
          Notes
          <textarea data-topic-details="${topic.id}" rows="4">${escapeHtml(topic.details || "")}</textarea>
        </label>
        <label>
          Confidence
          <input data-topic-confidence="${topic.id}" type="range" min="1" max="5" value="${topic.confidence}">
        </label>
        <div class="topic-footer">
          <div class="topic-tags">${signals.map((signal) => `<span>${escapeHtml(signal.name)}</span>`).join("")}</div>
          <button class="button ghost danger" type="button" data-delete-topic="${topic.id}">Delete</button>
        </div>
      </details>
    `;
    els.dayReview.append(card);
  });
}

function renderReview() {
  const needsReview = lowTopics();
  const weekTopics = topicsForWeek(visibleWeekStart);
  const weekLow = weekTopics.filter((topic) => Number(topic.confidence) <= 3);
  const weekStrong = weekTopics.filter((topic) => Number(topic.confidence) >= 4);

  els.flashcards.innerHTML = "";
  els.flashcards.classList.toggle("empty-state", !needsReview.length);
  els.flashCount.textContent = `${needsReview.length} ${needsReview.length === 1 ? "topic" : "topics"}`;

  if (!needsReview.length) {
    els.flashcards.textContent = "Nothing below 4/5 right now. That is the state you want.";
  } else {
    needsReview.forEach((topic) => {
      const card = document.createElement("article");
      card.className = `review-topic status-${getStatus([topic])}`;
      card.innerHTML = `
        <div>
          <strong>${escapeHtml(topic.title)}</strong>
          <span>${formatShortDate(topic.date)} · ${topic.confidence}/5</span>
        </div>
        <p>${escapeHtml(topic.details || "No notes yet.")}</p>
        <label>
          Confidence
          <input data-topic-confidence="${topic.id}" type="range" min="1" max="5" value="${topic.confidence}">
        </label>
        <button class="button secondary" type="button" data-mark-confident="${topic.id}">Mark Confident</button>
      `;
      els.flashcards.append(card);
    });
  }

  els.gapCount.textContent = `${weekTopics.length} this week`;
  els.gapList.innerHTML = "";
  [
    `${weekLow.length} topic${weekLow.length === 1 ? "" : "s"} need review this week.`,
    `${weekStrong.length} topic${weekStrong.length === 1 ? "" : "s"} are at 4/5 or higher.`,
    needsReview[0] ? `Next best study target: ${needsReview[0].title}.` : "No low-confidence topics currently tracked."
  ].forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    els.gapList.append(li);
  });
}

function renderTimeline() {
  els.noteTimeline.innerHTML = "";
  els.noteTimeline.classList.toggle("empty-state", !state.topics.length);
  if (!state.topics.length) {
    els.noteTimeline.textContent = "No topics captured yet.";
    return;
  }

  state.topics.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach((topic) => {
    const card = document.createElement("article");
    card.className = `note-card status-${getStatus([topic])}`;
    card.innerHTML = `
      <strong>${escapeHtml(topic.title)}</strong>
      <p>${formatShortDate(topic.date)} · Confidence ${topic.confidence}/5</p>
      <p>${escapeHtml(topic.details || "")}</p>
    `;
    els.noteTimeline.append(card);
  });
}

function renderMarkdown() {
  els.markdownPreview.textContent = buildMarkdown();
}

function renderArchive() {
  const weeks = getArchiveWeeks();
  els.archiveCount.textContent = `${weeks.length} ${weeks.length === 1 ? "week" : "weeks"}`;
  els.backupStatus.textContent = state.lastBackupAt ? `Backed up ${formatShortDate(state.lastBackupAt)}` : "Browser vault";
  els.weeklyArchive.innerHTML = "";
  els.weeklyArchive.classList.toggle("empty-state", !weeks.length);

  if (!weeks.length) {
    els.weeklyArchive.textContent = "Captured weeks will appear here.";
    return;
  }

  weeks.forEach((weekStart) => {
    const topics = topicsForWeek(weekStart);
    const low = topics.filter((topic) => Number(topic.confidence) <= 3).length;
    const card = document.createElement("article");
    card.className = `archive-week status-${getStatus(topics)}`;
    card.innerHTML = `
      <div class="archive-week-top">
        <div>
          <strong>${escapeHtml(weekLabel(weekStart))}</strong>
          <span>${topics.length} ${topics.length === 1 ? "topic" : "topics"} · ${low} to review</span>
        </div>
      </div>
      <p>${topics.slice(0, 3).map((topic) => topic.title).join(" · ") || "No topics yet."}</p>
      <div class="archive-actions">
        <button class="button ghost" type="button" data-open-week="${dateKey(weekStart)}">Open</button>
        <button class="button secondary" type="button" data-export-week="${dateKey(weekStart)}">Export</button>
      </div>
    `;
    els.weeklyArchive.append(card);
  });
}

function buildMarkdown() {
  const lines = ["# Data Center Flight Deck", "", `Average confidence: ${averageConfidence()}%`, ""];
  lines.push("## Topics");
  if (!state.topics.length) lines.push("- No topics yet.");
  state.topics.forEach((topic) => {
    lines.push(`- **${topic.title}** (${formatShortDate(topic.date)}, ${topic.confidence}/5): ${topic.details || ""}`);
  });
  return lines.join("\n");
}

function buildWeekMarkdown(weekStart) {
  const topics = topicsForWeek(weekStart);
  const lines = [`# Study Week - ${weekLabel(weekStart)}`, ""];
  const low = topics.filter((topic) => Number(topic.confidence) <= 3);

  lines.push("## Needs Review");
  if (!low.length) lines.push("- No topics below 4/5.");
  low.forEach((topic) => lines.push(`- **${topic.title}** (${topic.confidence}/5): ${topic.details || ""}`));
  lines.push("");
  lines.push("## Daily Topics");

  Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).forEach((day) => {
    const dayTopics = topicsForDay(dateKey(day));
    if (!dayTopics.length) return;
    lines.push(`### ${new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(day)}`);
    dayTopics.forEach((topic) => lines.push(`- ${topic.title} (${topic.confidence}/5): ${topic.details || ""}`));
    lines.push("");
  });

  return lines.join("\n");
}

function buildVaultPayload() {
  return {
    app: "Data Center Flight Deck",
    version: 3,
    exportedAt: new Date().toISOString(),
    state
  };
}

function normalizeImportedState(imported) {
  const incoming = imported?.state || imported;
  if (!incoming || (!Array.isArray(incoming.topics) && !Array.isArray(incoming.notes))) {
    throw new Error("Backup file does not contain topics or legacy notes.");
  }

  const importedTopics = Array.isArray(incoming.topics) && incoming.topics.length
    ? incoming.topics.map(normalizeTopic)
    : migrateNotesToTopics(incoming.notes || [], incoming.confidence || {});

  return {
    topics: importedTopics,
    notes: Array.isArray(incoming.notes) ? incoming.notes : [],
    lastBackupAt: incoming.lastBackupAt || imported.exportedAt || null
  };
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadMarkdown() {
  downloadText(`data-center-flight-deck-${new Date().toISOString().slice(0, 10)}.md`, buildMarkdown(), "text/markdown");
}

function downloadWeekMarkdown(weekStart = visibleWeekStart) {
  downloadText(`study-week-${dateKey(weekStart)}.md`, buildWeekMarkdown(weekStart), "text/markdown");
}

function downloadVaultData() {
  state.lastBackupAt = new Date().toISOString();
  saveState();
  downloadText(`data-center-flight-deck-vault-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(buildVaultPayload(), null, 2), "application/json");
  renderArchive();
}

function importVaultData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const nextState = normalizeImportedState(JSON.parse(String(reader.result || "")));
      const ok = window.confirm(`Import ${nextState.topics.length} topics and replace this browser vault?`);
      if (!ok) return;
      state = nextState;
      const latest = state.topics[0]?.date || dateKey(new Date());
      selectedDateKey = latest;
      visibleWeekStart = startOfWeek(latest);
      saveState();
      render();
      location.hash = "#vault";
    } catch (error) {
      window.alert(`Import failed: ${error.message}`);
    } finally {
      els.importData.value = "";
    }
  };
  reader.readAsText(file);
}

function createTicket() {
  const weak = lowTopics()[0];
  const ticket = tickets[Math.floor(Math.random() * tickets.length)];
  currentTicket = { ...ticket, topic: weak, id: `DCT-${Math.floor(1000 + Math.random() * 9000)}` };

  els.ticketId.textContent = currentTicket.id;
  els.ticketDomain.textContent = weak ? weak.title : "Add topics";
  els.ticketTitle.textContent = weak ? `${ticket.title}: ${weak.title}` : "Generate a ticket from your current weak spot.";
  els.ticketBody.textContent = weak ? `${ticket.body} Topic notes: ${weak.details || "No notes yet."}` : "Add a few low-confidence topics first.";
  els.ticketTags.innerHTML = ticket.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  els.gradeOutput.className = "grade-output empty-state";
  els.gradeOutput.textContent = "Write your response, then grade it.";
}

function gradeResponse(text) {
  const lower = text.toLowerCase();
  const checks = [
    ["safety", "change", "verify", "label"],
    ["explain", "because", "risk", "impact"],
    ["check", "test", "confirm", "inspect"],
    ["document", "escalate", "ask", "lead"]
  ];
  const covered = checks.filter((group) => group.some((term) => lower.includes(term))).length;
  const score = Math.min(100, 30 + covered * 17 + Math.min(20, Math.floor(text.length / 40)));
  els.gradeOutput.className = "grade-output";
  els.gradeOutput.innerHTML = `<strong>Coach score: ${score}%</strong><p>${score >= 76 ? "Solid shape. Make sure the answer names evidence, risk, and next step." : "Good start. Add verification, risk, and escalation/documentation."}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function handleTopicEdits(event) {
  const title = event.target.closest("[data-topic-title]");
  const details = event.target.closest("[data-topic-details]");
  const confidence = event.target.closest("[data-topic-confidence]");
  if (title) updateTopic(title.dataset.topicTitle, { title: title.value });
  if (details) updateTopic(details.dataset.topicDetails, { details: details.value });
  if (confidence) updateTopic(confidence.dataset.topicConfidence, { confidence: Number(confidence.value) });
}

els.captureForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTopic({
    title: els.topicTitle.value,
    details: els.noteInput.value,
    confidence: els.topicConfidence.value,
    date: dateKey(new Date())
  });
  els.topicTitle.value = "";
  els.noteInput.value = "";
  els.topicConfidence.value = "3";
  location.hash = "#week";
});

els.dayTopicForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTopic({
    title: els.dayTopicTitle.value,
    details: els.dayTopicNotes.value,
    confidence: els.dayTopicConfidence.value,
    date: selectedDateKey
  });
  els.dayTopicTitle.value = "";
  els.dayTopicNotes.value = "";
  els.dayTopicConfidence.value = "3";
});

els.clearInput.addEventListener("click", () => {
  els.topicTitle.value = "";
  els.noteInput.value = "";
  els.topicConfidence.value = "3";
  els.topicTitle.focus();
});

document.querySelector("#seed-demo")?.addEventListener("click", () => {
  demoTopics.forEach((topic, index) => addTopic({ ...topic, date: dateKey(addDays(new Date(), -index)) }));
  location.hash = "#week";
});

els.prevWeek.addEventListener("click", () => {
  visibleWeekStart = addDays(visibleWeekStart, -7);
  selectedDateKey = dateKey(visibleWeekStart);
  render();
});

els.todayWeek.addEventListener("click", () => {
  selectedDateKey = dateKey(new Date());
  visibleWeekStart = startOfWeek(new Date());
  render();
});

els.nextWeek.addEventListener("click", () => {
  visibleWeekStart = addDays(visibleWeekStart, 7);
  selectedDateKey = dateKey(visibleWeekStart);
  render();
});

els.exportWeek.addEventListener("click", () => downloadWeekMarkdown(visibleWeekStart));
els.reviewThisWeek.addEventListener("click", () => {
  location.hash = "#week";
});

els.dayReview.addEventListener("change", handleTopicEdits);
els.dayReview.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-topic]");
  if (button && window.confirm("Delete this topic?")) deleteTopic(button.dataset.deleteTopic);
});

els.flashcards.addEventListener("change", handleTopicEdits);
els.flashcards.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mark-confident]");
  if (button) updateTopic(button.dataset.markConfident, { confidence: 5 });
});

els.newTicket.addEventListener("click", createTicket);
els.responseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentTicket) createTicket();
  if (els.ticketResponse.value.trim()) gradeResponse(els.ticketResponse.value.trim());
});
els.clearResponse.addEventListener("click", () => {
  els.ticketResponse.value = "";
  els.gradeOutput.className = "grade-output empty-state";
  els.gradeOutput.textContent = "Your coaching feedback will show here.";
});

els.exportMd.addEventListener("click", downloadMarkdown);
els.exportData.addEventListener("click", downloadVaultData);
els.importDataTrigger.addEventListener("click", () => els.importData.click());
els.importData.addEventListener("change", () => {
  const file = els.importData.files?.[0];
  if (file) importVaultData(file);
});

els.weeklyArchive.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-week]");
  const exportButton = event.target.closest("[data-export-week]");
  if (openButton) {
    visibleWeekStart = dateFromKey(openButton.dataset.openWeek);
    selectedDateKey = dateKey(visibleWeekStart);
    location.hash = "#week";
    render();
  }
  if (exportButton) downloadWeekMarkdown(dateFromKey(exportButton.dataset.exportWeek));
});

els.resetVault.addEventListener("click", () => {
  if (!window.confirm("Reset all local topics and backups?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  selectedDateKey = dateKey(new Date());
  visibleWeekStart = startOfWeek(new Date());
  render();
});

window.addEventListener("hashchange", renderNavigation);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

render();
