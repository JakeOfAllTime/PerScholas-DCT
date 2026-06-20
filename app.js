const STORAGE_KEY = "dc-flight-deck-v1";

const domains = [
  {
    id: "networking",
    name: "Networking",
    color: "#42d9c8",
    keywords: ["cisco", "switch", "router", "vlan", "trunk", "fiber", "ethernet", "console", "serial", "ip", "subnet", "dns", "dhcp", "patch", "cable", "sfp", "port", "rollover", "straight-through", "straight through", "rj45"]
  },
  {
    id: "power",
    name: "Power",
    color: "#ffbf69",
    keywords: ["pdu", "ups", "phase", "3-phase", "three-phase", "delta", "wye", "voltage", "amp", "breaker", "circuit", "load", "kva", "kw", "transformer", "ground"]
  },
  {
    id: "cooling",
    name: "Cooling",
    color: "#9ef06f",
    keywords: ["cooling", "airflow", "hot aisle", "cold aisle", "hvac", "crac", "humidity", "temperature", "chiller", "tile", "containment"]
  },
  {
    id: "hardware",
    name: "Server Hardware",
    color: "#d28cff",
    keywords: ["server", "rack", "rail", "cpu", "ram", "memory", "disk", "drive", "raid", "bios", "bmc", "idrac", "ilo", "mount", "chassis", "nvme"]
  },
  {
    id: "safety",
    name: "Safety + Tools",
    color: "#ff6b6b",
    keywords: ["safety", "esd", "lockout", "tagout", "ppe", "ladder", "label", "ticket", "change", "multimeter", "toner", "torque", "driver", "adapter", "procedure", "escalate"]
  }
];

const demoText = `Practiced Cisco console access today. We talked about rollover cable versus straight-through patch cables, and I had to use a USB serial adapter on my Mac. Still fuzzy on the pinout and when the console port is different from Ethernet.

Covered PDU basics, three-phase load balancing, Wye versus Delta, and why you do not just move power cords without checking labels and load. I can repeat the terms but I am not confident on the math yet.

In lab we looked at rack units, rails, labeling, and airflow. Hot aisle and cold aisle made sense, but I want more practice recognizing bad cable management and blocked exhaust.`;

const tickets = {
  networking: [
    {
      title: "Console works, uplink is dark",
      body: "After a scheduled migration, Rack B12 switch responds over console but the uplink to the aggregation switch is down. Link lights are off on Gi0/24. The ticket notes a new patch cable and an SFP swap.",
      tags: ["console", "link lights", "cabling", "SFP"]
    },
    {
      title: "Server moved, network unreachable",
      body: "A server was moved to another rack and now cannot reach the imaging network. The port is live, but DHCP is not assigning an address.",
      tags: ["DHCP", "VLAN", "patch panel", "change validation"]
    }
  ],
  power: [
    {
      title: "PDU load warning after install",
      body: "A new 2U server was installed and the rack PDU is warning near threshold on one phase. The change ticket only lists the server model, not the measured load.",
      tags: ["PDU", "phase balance", "load", "escalation"]
    },
    {
      title: "UPS branch shows uneven draw",
      body: "Monitoring shows one UPS branch running hotter than expected after equipment was shifted between racks. No outage yet, but the trend is worsening.",
      tags: ["UPS", "branch circuit", "trend", "safety"]
    }
  ],
  cooling: [
    {
      title: "Rack temperature climbs overnight",
      body: "Rack C07 has rising inlet temperature alarms after a cabling cleanup. Servers remain online, but fan speed is increasing.",
      tags: ["airflow", "hot aisle", "blanking", "obstruction"]
    }
  ],
  hardware: [
    {
      title: "Server will not complete POST",
      body: "A newly racked server powers on, fans spin up, but POST does not complete. The remote management controller is reachable.",
      tags: ["POST", "BMC", "memory", "seating"]
    }
  ],
  safety: [
    {
      title: "Urgent request to move power cords",
      body: "A requester asks you to quickly move two power cords to clear space before a vendor arrives. Labels are hard to read and the rack is live.",
      tags: ["safety", "change control", "labels", "escalation"]
    }
  ]
};

const coachingChecks = [
  { terms: ["safety", "ppe", "energized", "change", "ticket", "approval", "label"], label: "Safety and change control" },
  { terms: ["verify", "check", "confirm", "inspect", "identify", "document"], label: "Verification before action" },
  { terms: ["cable", "link", "light", "port", "sfp", "console", "vlan", "dhcp", "patch"], label: "Layered network checks" },
  { terms: ["pdu", "phase", "load", "amp", "breaker", "ups", "circuit"], label: "Power awareness" },
  { terms: ["airflow", "temperature", "hot aisle", "cold aisle", "blocked", "fan"], label: "Cooling awareness" },
  { terms: ["escalate", "senior", "facilities", "network team", "stop"], label: "Escalation judgment" }
];

let state = loadState();
let currentTicket = null;
let recognition = null;
let selectedDateKey = dateKey(new Date());
let visibleWeekStart = startOfWeek(new Date());

const els = {
  sections: document.querySelectorAll(".workspace-section"),
  navLinks: document.querySelectorAll(".nav-link"),
  captureForm: document.querySelector("#capture-form"),
  noteInput: document.querySelector("#note-input"),
  clearInput: document.querySelector("#clear-input"),
  voiceButton: document.querySelector("#voice-button"),
  voiceStatus: document.querySelector("#voice-status"),
  seedDemo: document.querySelector("#seed-demo"),
  weekRange: document.querySelector("#week-range"),
  weekNoteCount: document.querySelector("#week-note-count"),
  weekCalendar: document.querySelector("#week-calendar"),
  selectedDayTitle: document.querySelector("#selected-day-title"),
  selectedDayCount: document.querySelector("#selected-day-count"),
  dayReview: document.querySelector("#day-review"),
  dayConfidenceList: document.querySelector("#day-confidence-list"),
  prevWeek: document.querySelector("#prev-week"),
  todayWeek: document.querySelector("#today-week"),
  nextWeek: document.querySelector("#next-week"),
  exportWeek: document.querySelector("#export-week"),
  domainGrid: document.querySelector("#domain-grid"),
  noteCount: document.querySelector("#note-count"),
  vaultCount: document.querySelector("#vault-count"),
  storageStatus: document.querySelector("#storage-status"),
  weakestArea: document.querySelector("#weakest-area"),
  openQuestionCount: document.querySelector("#open-question-count"),
  nextDrill: document.querySelector("#next-drill"),
  readinessScore: document.querySelector("#readiness-score"),
  ringValue: document.querySelector("#ring-value"),
  signalRing: document.querySelector(".signal-ring"),
  gapList: document.querySelector("#gap-list"),
  flashcards: document.querySelector("#flashcards"),
  flashCount: document.querySelector("#flash-count"),
  generateFlashcards: document.querySelector("#generate-flashcards"),
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
  noteTimeline: document.querySelector("#note-timeline"),
  markdownPreview: document.querySelector("#markdown-preview"),
  exportMd: document.querySelector("#export-md"),
  exportData: document.querySelector("#export-data"),
  importDataTrigger: document.querySelector("#import-data-trigger"),
  importData: document.querySelector("#import-data"),
  backupStatus: document.querySelector("#backup-status"),
  weeklyArchive: document.querySelector("#weekly-archive"),
  archiveCount: document.querySelector("#archive-count"),
  resetVault: document.querySelector("#reset-vault")
};

function loadState() {
  const fallback = {
    notes: [],
    confidence: Object.fromEntries(domains.map((domain) => [domain.id, 3])),
    flashcards: [],
    lastBackupAt: null
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.notes)) return fallback;
    return {
      ...fallback,
      ...saved,
      confidence: { ...fallback.confidence, ...(saved.confidence || {}) }
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  els.storageStatus.textContent = "Saved locally";
  if (els.backupStatus) {
    els.backupStatus.textContent = state.lastBackupAt ? `Backed up ${formatShortDate(state.lastBackupAt)}` : "Browser vault";
  }
  window.setTimeout(() => {
    els.storageStatus.textContent = "Local vault ready";
  }, 1200);
}

function normalize(text) {
  return text.toLowerCase();
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function dateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const offset = value.getDay();
  value.setDate(value.getDate() - offset);
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function weekKey(date) {
  return dateKey(startOfWeek(date));
}

function weekLabel(weekStart) {
  return `${formatShortDate(weekStart)} - ${formatShortDate(addDays(weekStart, 6))}`;
}

function detectDomains(text) {
  const lower = normalize(text);
  return domains.map((domain) => {
    const hits = domain.keywords.filter((keyword) => lower.includes(keyword));
    return { ...domain, hits };
  }).filter((domain) => domain.hits.length);
}

function extractQuestions(text) {
  const sentences = splitSentences(text);
  const uncertainty = ["confused", "fuzzy", "unsure", "not confident", "still learning", "want more practice", "need practice"];
  return sentences.filter((sentence) => {
    const lower = normalize(sentence);
    return sentence.includes("?") || uncertainty.some((term) => lower.includes(term));
  }).slice(0, 5);
}

function extractCommands(text) {
  const commandPatterns = [
    /\bshow\s+[\w\s/-]+/gi,
    /\bping\s+[\w.:-]+/gi,
    /\bipconfig\b[\w\s/-]*/gi,
    /\bifconfig\b[\w\s/-]*/gi,
    /\btraceroute\s+[\w.:-]+/gi,
    /\bssh\s+[\w@.:-]+/gi
  ];
  return [...new Set(commandPatterns.flatMap((pattern) => text.match(pattern) || []))]
    .map((command) => command.trim())
    .slice(0, 6);
}

function distillNote(text) {
  const sentences = splitSentences(text);
  const matchedDomains = detectDomains(text);
  const domainIds = matchedDomains.length ? matchedDomains.map((domain) => domain.id) : ["safety"];
  const tags = [...new Set(matchedDomains.flatMap((domain) => domain.hits))]
    .slice(0, 10)
    .map((tag) => tag.replace(/\b\w/g, (letter) => letter.toUpperCase()));
  const questions = extractQuestions(text);
  const commands = extractCommands(text);
  const concepts = matchedDomains.flatMap((domain) => domain.hits.slice(0, 3))
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 8);

  return {
    id: `note-${Date.now()}`,
    createdAt: new Date().toISOString(),
    raw: text.trim(),
    summary: sentences.slice(0, 2).join(" ") || text.trim(),
    domains: domainIds,
    tags,
    questions,
    commands,
    concepts
  };
}

function addNote(text) {
  const note = distillNote(text);
  state.notes.unshift(note);
  selectedDateKey = dateKey(note.createdAt);
  visibleWeekStart = startOfWeek(note.createdAt);

  note.domains.forEach((domainId) => {
    const uncertainty = note.questions.length > 0;
    state.confidence[domainId] = Math.max(1, Math.min(5, uncertainty ? state.confidence[domainId] - 1 : state.confidence[domainId]));
  });

  buildFlashcards();
  saveState();
  render();
}

function getDomainStats(domainId) {
  const notes = state.notes.filter((note) => note.domains.includes(domainId));
  const terms = [...new Set(notes.flatMap((note) => note.concepts.concat(note.tags)))]
    .filter(Boolean)
    .slice(0, 6);
  const questions = notes.flatMap((note) => note.questions);
  return { notes, terms, questions };
}

function getWeakestDomain() {
  return domains.reduce((weakest, domain) => {
    const score = state.confidence[domain.id] || 3;
    const weakestScore = state.confidence[weakest.id] || 3;
    return score < weakestScore ? domain : weakest;
  }, domains[0]);
}

function readiness() {
  const total = domains.reduce((sum, domain) => sum + Number(state.confidence[domain.id] || 3), 0);
  return Math.round((total / (domains.length * 5)) * 100);
}

function buildFlashcards() {
  const weak = getWeakestDomain();
  const weakStats = getDomainStats(weak.id);
  const cards = [];

  weakStats.terms.slice(0, 4).forEach((term) => {
    cards.push({
      q: `Explain ${term} like you are answering a technician interview question.`,
      a: `Use your notes to define it, name where it appears in the data center, and describe one mistake to avoid.`
    });
  });

  weakStats.questions.slice(0, 3).forEach((question) => {
    cards.push({
      q: question,
      a: "Answer from memory first, then verify against class material or lab notes."
    });
  });

  if (!cards.length) {
    cards.push(
      {
        q: "What should you verify before touching power or network cabling in a rack?",
        a: "Confirm the ticket, labels, device identity, impact, safety conditions, and escalation path."
      },
      {
        q: "What makes a troubleshooting response strong?",
        a: "Start with safety, gather evidence, test one layer at a time, document findings, and escalate at the right point."
      }
    );
  }

  state.flashcards = cards.slice(0, 6);
  saveState();
  renderFlashcards();
}

function render() {
  renderNavigation();
  renderStats();
  renderDomains();
  renderWeek();
  renderGaps();
  renderFlashcards();
  renderTimeline();
  renderMarkdown();
  renderArchive();
}

function renderNavigation() {
  const active = location.hash || "#capture";
  els.sections.forEach((section) => {
    section.classList.toggle("active-section", `#${section.id}` === active);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === active);
  });
}

function renderStats() {
  const percent = readiness();
  const weak = getWeakestDomain();
  const openQuestions = state.notes.flatMap((note) => note.questions).length;

  els.noteCount.textContent = `${state.notes.length} ${state.notes.length === 1 ? "note" : "notes"}`;
  els.vaultCount.textContent = `${state.notes.length} total`;
  els.weakestArea.textContent = state.notes.length ? weak.name : "None yet";
  els.openQuestionCount.textContent = String(openQuestions);
  els.nextDrill.textContent = state.notes.length ? `${weak.name} ticket` : "Add notes";
  els.readinessScore.textContent = `${percent}%`;
  els.ringValue.textContent = `${percent}%`;
  els.signalRing.style.setProperty("--value", `${percent * 3.6}deg`);
}

function renderDomains() {
  const template = document.querySelector("#domain-card-template");
  els.domainGrid.innerHTML = "";

  domains.forEach((domain) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const confidence = Number(state.confidence[domain.id] || 3);
    const stats = getDomainStats(domain.id);

    card.querySelector("h3").textContent = domain.name;
    card.querySelector(".domain-topline span").textContent = `${stats.notes.length} notes`;
    card.querySelector(".meter i").style.width = `${confidence * 20}%`;
    card.querySelector(".meter i").style.background = `linear-gradient(90deg, #ff6b6b, ${domain.color})`;
    card.style.borderColor = `${domain.color}44`;

    const range = card.querySelector("input");
    range.value = confidence;
    range.setAttribute("aria-label", `${domain.name} confidence`);
    range.addEventListener("input", () => {
      state.confidence[domain.id] = Number(range.value);
      saveState();
      render();
    });

    const list = card.querySelector("ul");
    const listItems = stats.terms.length ? stats.terms.slice(0, 3) : ["No captured terms yet"];
    listItems.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });

    els.domainGrid.append(card);
  });
}

function renderWeek() {
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(visibleWeekStart, index));
  const weekEnd = addDays(visibleWeekStart, 6);
  const weekNotes = state.notes.filter((note) => {
    const key = dateKey(note.createdAt);
    return weekDays.some((day) => dateKey(day) === key);
  });

  els.weekRange.textContent = weekLabel(visibleWeekStart);
  els.weekNoteCount.textContent = `${weekNotes.length} ${weekNotes.length === 1 ? "note" : "notes"}`;
  els.weekCalendar.innerHTML = "";

  weekDays.forEach((day) => {
    const key = dateKey(day);
    const dayNotes = notesForDay(key);
    const domainIds = [...new Set(dayNotes.flatMap((note) => note.domains))];
    const button = document.createElement("button");
    button.className = "day-card";
    button.type = "button";
    button.classList.toggle("is-selected", key === selectedDateKey);
    button.classList.toggle("is-today", key === dateKey(new Date()));
    button.setAttribute("aria-pressed", key === selectedDateKey ? "true" : "false");
    button.innerHTML = `
      <span>${new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day)}</span>
      <strong>${day.getDate()}</strong>
      <small>${dayNotes.length} ${dayNotes.length === 1 ? "note" : "notes"}</small>
      <div class="domain-dots">${domainIds.map((id) => {
        const domain = domains.find((item) => item.id === id);
        return `<i style="background:${domain?.color || "#42d9c8"}; color:${domain?.color || "#42d9c8"}"></i>`;
      }).join("")}</div>
    `;
    button.addEventListener("click", () => {
      selectedDateKey = key;
      renderWeek();
    });
    els.weekCalendar.append(button);
  });

  renderSelectedDay();
}

function notesForDay(key) {
  return state.notes.filter((note) => dateKey(note.createdAt) === key);
}

function notesForWeek(weekStart) {
  const startKey = dateKey(weekStart);
  const weekDays = Array.from({ length: 7 }, (_, index) => dateKey(addDays(weekStart, index)));
  return state.notes.filter((note) => weekDays.includes(dateKey(note.createdAt)) || weekKey(note.createdAt) === startKey);
}

function getArchiveWeeks() {
  return [...new Set(state.notes.map((note) => weekKey(note.createdAt)))]
    .map(dateFromKey)
    .sort((a, b) => b - a);
}

function renderSelectedDay() {
  const selectedDate = dateFromKey(selectedDateKey);
  const dayNotes = notesForDay(selectedDateKey);
  const dayDomains = new Set(dayNotes.flatMap((note) => note.domains));

  els.selectedDayTitle.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(selectedDate);
  els.selectedDayCount.textContent = `${dayNotes.length} ${dayNotes.length === 1 ? "note" : "notes"}`;

  els.dayReview.innerHTML = "";
  els.dayReview.classList.toggle("empty-state", !dayNotes.length);

  if (!dayNotes.length) {
    els.dayReview.textContent = "No captures for this day yet.";
  } else {
    dayNotes.forEach((note) => {
      const card = document.createElement("article");
      card.className = "day-note";
      const questions = note.questions.length
        ? `<ul>${note.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>`
        : "";
      card.innerHTML = `
        <strong>${escapeHtml(note.domains.map((id) => domains.find((domain) => domain.id === id)?.name || id).join(", "))}</strong>
        <p>${escapeHtml(note.summary)}</p>
        ${questions}
      `;
      els.dayReview.append(card);
    });
  }

  els.dayConfidenceList.innerHTML = "";
  domains.forEach((domain) => {
    const row = document.createElement("label");
    row.className = "confidence-row";
    row.style.borderColor = `${domain.color}44`;
    row.innerHTML = `
      <strong>${domain.name}</strong>
      <input type="range" min="1" max="5" value="${state.confidence[domain.id] || 3}" aria-label="${domain.name} confidence">
      <span>${state.confidence[domain.id] || 3}/5</span>
    `;
    if (dayNotes.length && !dayDomains.has(domain.id)) {
      row.style.opacity = "0.56";
    }
    const input = row.querySelector("input");
    const value = row.querySelector("span");
    input.addEventListener("input", () => {
      state.confidence[domain.id] = Number(input.value);
      value.textContent = `${input.value}/5`;
      saveState();
      renderStats();
      renderDomains();
      renderMarkdown();
    });
    els.dayConfidenceList.append(row);
  });
}

function renderGaps() {
  const questions = state.notes.flatMap((note) => note.questions.map((question) => ({ question, domains: note.domains })));
  els.gapList.innerHTML = "";

  if (!questions.length) {
    const li = document.createElement("li");
    li.textContent = "No gaps logged yet. Add confusion plainly when you capture notes.";
    els.gapList.append(li);
    return;
  }

  questions.slice(0, 6).forEach((item) => {
    const li = document.createElement("li");
    const domainNames = item.domains.map((id) => domains.find((domain) => domain.id === id)?.name).filter(Boolean).join(", ");
    li.textContent = `${item.question} (${domainNames})`;
    els.gapList.append(li);
  });
}

function renderFlashcards() {
  els.flashcards.innerHTML = "";
  els.flashcards.classList.toggle("empty-state", !state.flashcards.length);
  els.flashCount.textContent = `${state.flashcards.length} cards`;

  if (!state.flashcards.length) {
    els.flashcards.textContent = "Add a note or load the demo to generate active-recall cards.";
    return;
  }

  state.flashcards.forEach((card, index) => {
    const node = document.createElement("article");
    node.className = "flash-card";
    node.innerHTML = `<strong>${index + 1}. ${escapeHtml(card.q)}</strong><p>${escapeHtml(card.a)}</p>`;
    els.flashcards.append(node);
  });
}

function renderTimeline() {
  els.noteTimeline.innerHTML = "";
  els.noteTimeline.classList.toggle("empty-state", !state.notes.length);

  if (!state.notes.length) {
    els.noteTimeline.textContent = "No notes captured yet.";
    return;
  }

  state.notes.forEach((note) => {
    const date = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(note.createdAt));
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <strong>${escapeHtml(date)}</strong>
      <p>${escapeHtml(note.summary)}</p>
      <div class="tags">${note.tags.slice(0, 8).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
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
    const notes = notesForWeek(weekStart);
    const questions = notes.flatMap((note) => note.questions);
    const domainCounts = domains
      .map((domain) => ({
        domain,
        count: notes.filter((note) => note.domains.includes(domain.id)).length
      }))
      .filter((item) => item.count)
      .sort((a, b) => b.count - a.count);

    const card = document.createElement("article");
    card.className = "archive-week";
    card.innerHTML = `
      <div class="archive-week-top">
        <div>
          <strong>${escapeHtml(weekLabel(weekStart))}</strong>
          <span>${notes.length} ${notes.length === 1 ? "note" : "notes"} · ${questions.length} open ${questions.length === 1 ? "question" : "questions"}</span>
        </div>
        <div class="domain-dots">${domainCounts.map(({ domain }) => `<i style="background:${domain.color}; color:${domain.color}"></i>`).join("")}</div>
      </div>
      <p>${domainCounts.length ? domainCounts.map(({ domain, count }) => `${domain.name}: ${count}`).join(" · ") : "No domain signals yet."}</p>
      <div class="archive-actions">
        <button class="button ghost" type="button" data-open-week="${dateKey(weekStart)}">Open</button>
        <button class="button secondary" type="button" data-export-week="${dateKey(weekStart)}">Export</button>
      </div>
    `;
    els.weeklyArchive.append(card);
  });
}

function buildMarkdown() {
  const lines = ["# Data Center Flight Deck", "", `Readiness: ${readiness()}%`, ""];

  lines.push("## Confidence");
  domains.forEach((domain) => {
    lines.push(`- ${domain.name}: ${state.confidence[domain.id] || 3}/5`);
  });
  lines.push("");

  lines.push("## Notes");
  if (!state.notes.length) lines.push("- No notes yet.");

  state.notes.forEach((note) => {
    const date = new Date(note.createdAt).toLocaleString();
    lines.push(`### ${date}`);
    lines.push("");
    lines.push(`**Summary:** ${note.summary}`);
    lines.push("");
    lines.push(`**Domains:** ${note.domains.map((id) => domains.find((domain) => domain.id === id)?.name || id).join(", ")}`);
    if (note.tags.length) lines.push(`**Tags:** ${note.tags.join(", ")}`);
    if (note.commands.length) {
      lines.push("");
      lines.push("**Commands:**");
      note.commands.forEach((command) => lines.push(`- \`${command}\``));
    }
    if (note.questions.length) {
      lines.push("");
      lines.push("**Open Questions:**");
      note.questions.forEach((question) => lines.push(`- ${question}`));
    }
    lines.push("");
    lines.push("**Raw Capture:**");
    lines.push(note.raw);
    lines.push("");
  });

  return lines.join("\n");
}

function buildWeekMarkdown(weekStart) {
  const notes = notesForWeek(weekStart);
  const lines = [`# Data Center Flight Deck - ${weekLabel(weekStart)}`, "", `Readiness: ${readiness()}%`, ""];
  const weekQuestions = notes.flatMap((note) => note.questions);

  lines.push("## Confidence");
  domains.forEach((domain) => {
    const count = notes.filter((note) => note.domains.includes(domain.id)).length;
    lines.push(`- ${domain.name}: ${state.confidence[domain.id] || 3}/5 (${count} notes this week)`);
  });
  lines.push("");

  lines.push("## Study Priorities");
  if (!weekQuestions.length) {
    lines.push("- No open questions captured this week.");
  } else {
    weekQuestions.forEach((question) => lines.push(`- ${question}`));
  }
  lines.push("");

  lines.push("## Daily Notes");
  if (!notes.length) lines.push("- No notes captured this week.");

  Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).forEach((day) => {
    const dayNotes = notesForDay(dateKey(day));
    if (!dayNotes.length) return;
    lines.push(`### ${new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(day)}`);
    lines.push("");
    dayNotes.forEach((note) => {
      lines.push(`- **${note.domains.map((id) => domains.find((domain) => domain.id === id)?.name || id).join(", ")}:** ${note.summary}`);
      if (note.questions.length) {
        note.questions.forEach((question) => lines.push(`  - Question: ${question}`));
      }
    });
    lines.push("");
  });

  return lines.join("\n");
}

function buildVaultPayload() {
  return {
    app: "Data Center Flight Deck",
    version: 2,
    exportedAt: new Date().toISOString(),
    storageKey: STORAGE_KEY,
    domains: domains.map(({ id, name, color }) => ({ id, name, color })),
    state
  };
}

function normalizeImportedState(imported) {
  const incoming = imported?.state || imported;
  if (!incoming || !Array.isArray(incoming.notes)) {
    throw new Error("Backup file does not contain a valid notes array.");
  }

  return {
    notes: incoming.notes.filter((note) => note && note.createdAt && note.raw),
    confidence: {
      ...Object.fromEntries(domains.map((domain) => [domain.id, 3])),
      ...(incoming.confidence || {})
    },
    flashcards: Array.isArray(incoming.flashcards) ? incoming.flashcards : [],
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

function createTicket() {
  const weak = getWeakestDomain();
  const options = tickets[weak.id] || tickets.safety;
  const ticket = options[Math.floor(Math.random() * options.length)];
  currentTicket = {
    ...ticket,
    domain: weak,
    id: `DCT-${Math.floor(1000 + Math.random() * 9000)}`
  };
  els.ticketId.textContent = currentTicket.id;
  els.ticketDomain.textContent = weak.name;
  els.ticketTitle.textContent = currentTicket.title;
  els.ticketBody.textContent = currentTicket.body;
  els.ticketTags.innerHTML = currentTicket.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  els.gradeOutput.className = "grade-output empty-state";
  els.gradeOutput.textContent = "Write your response, then grade it.";
}

function gradeResponse(text) {
  const lower = normalize(text);
  const matched = coachingChecks.filter((check) => check.terms.some((term) => lower.includes(term)));
  const score = Math.min(100, Math.max(20, matched.length * 16 + Math.min(20, Math.floor(text.length / 30))));
  const missing = coachingChecks.filter((check) => !matched.includes(check)).slice(0, 3);

  const strengths = matched.length
    ? matched.map((check) => check.label).slice(0, 4)
    : ["You started the response. Add concrete checks and safety steps."];

  els.gradeOutput.className = "grade-output";
  els.gradeOutput.innerHTML = `
    <strong>Coach score: ${score}%</strong>
    <p>${score >= 76 ? "Strong troubleshooting shape. Tighten it by making each verification explicit." : "Good start. Make the sequence safer and more evidence-driven."}</p>
    <ul>
      ${strengths.map((item) => `<li>Covered: ${escapeHtml(item)}</li>`).join("")}
      ${missing.map((item) => `<li>Add: ${escapeHtml(item.label)}</li>`).join("")}
    </ul>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setupVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.voiceButton.disabled = true;
    els.voiceStatus.textContent = "Voice capture is not supported in this browser.";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let baseText = "";

  recognition.onstart = () => {
    baseText = els.noteInput.value.trim();
    els.voiceButton.textContent = "Stop";
    els.voiceStatus.textContent = "Listening. Speak your lab notes naturally.";
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result) => result[0].transcript)
      .join(" ");
    els.noteInput.value = [baseText, transcript].filter(Boolean).join(" ");
  };

  recognition.onend = () => {
    els.voiceButton.textContent = "Voice";
    els.voiceStatus.textContent = "Voice capture paused.";
  };

  recognition.onerror = () => {
    els.voiceStatus.textContent = "Voice capture stopped. You can keep typing.";
  };
}

function downloadMarkdown() {
  downloadText(`data-center-flight-deck-${new Date().toISOString().slice(0, 10)}.md`, buildMarkdown(), "text/markdown");
}

function downloadWeekMarkdown(weekStart = visibleWeekStart) {
  downloadText(`data-center-flight-deck-week-${dateKey(weekStart)}.md`, buildWeekMarkdown(weekStart), "text/markdown");
}

function downloadVaultData() {
  state.lastBackupAt = new Date().toISOString();
  saveState();
  downloadText(
    `data-center-flight-deck-vault-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(buildVaultPayload(), null, 2),
    "application/json"
  );
  renderArchive();
}

function importVaultData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result || ""));
      const nextState = normalizeImportedState(imported);
      const ok = window.confirm(`Import ${nextState.notes.length} notes and replace this browser vault?`);
      if (!ok) return;
      state = nextState;
      const latest = state.notes[0]?.createdAt ? new Date(state.notes[0].createdAt) : new Date();
      selectedDateKey = dateKey(latest);
      visibleWeekStart = startOfWeek(latest);
      saveState();
      buildFlashcards();
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

els.captureForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = els.noteInput.value.trim();
  if (!text) return;
  addNote(text);
  els.noteInput.value = "";
  location.hash = "#review";
});

els.clearInput.addEventListener("click", () => {
  els.noteInput.value = "";
  els.noteInput.focus();
});

els.voiceButton.addEventListener("click", () => {
  if (!recognition) return;
  if (els.voiceButton.textContent === "Stop") {
    recognition.stop();
  } else {
    recognition.start();
  }
});

els.seedDemo.addEventListener("click", () => {
  els.noteInput.value = demoText;
  location.hash = "#capture";
  els.noteInput.focus();
});

els.prevWeek.addEventListener("click", () => {
  visibleWeekStart = addDays(visibleWeekStart, -7);
  selectedDateKey = dateKey(visibleWeekStart);
  renderWeek();
});

els.todayWeek.addEventListener("click", () => {
  const today = new Date();
  selectedDateKey = dateKey(today);
  visibleWeekStart = startOfWeek(today);
  renderWeek();
});

els.nextWeek.addEventListener("click", () => {
  visibleWeekStart = addDays(visibleWeekStart, 7);
  selectedDateKey = dateKey(visibleWeekStart);
  renderWeek();
});

els.exportWeek.addEventListener("click", () => {
  downloadWeekMarkdown(visibleWeekStart);
});

els.generateFlashcards.addEventListener("click", buildFlashcards);
els.newTicket.addEventListener("click", createTicket);

els.responseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = els.ticketResponse.value.trim();
  if (!currentTicket) createTicket();
  if (text) gradeResponse(text);
});

els.clearResponse.addEventListener("click", () => {
  els.ticketResponse.value = "";
  els.gradeOutput.className = "grade-output empty-state";
  els.gradeOutput.textContent = "Your coaching feedback will show here.";
});

els.exportMd.addEventListener("click", downloadMarkdown);
els.exportData.addEventListener("click", downloadVaultData);

els.importDataTrigger.addEventListener("click", () => {
  els.importData.click();
});

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

  if (exportButton) {
    downloadWeekMarkdown(dateFromKey(exportButton.dataset.exportWeek));
  }
});

els.resetVault.addEventListener("click", () => {
  const ok = window.confirm("Reset all local notes, ratings, and drills?");
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  currentTicket = null;
  render();
});

window.addEventListener("hashchange", renderNavigation);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

setupVoice();
render();
