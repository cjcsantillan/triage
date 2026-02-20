const SAMPLES = {
  "double-charge":
    "I was charged twice for my subscription this month and I need a refund for the extra charge as soon as possible.",
  "csv-export":
    "How do I export all of my data to a CSV file? I looked in settings but couldn't find it.",
  "reports-crash":
    "The app crashes to a white screen every time I open the Reports page. This started after today's update.",
};

const form = document.getElementById("triage-form");
const textarea = document.getElementById("ticket");
const triageBtn = document.getElementById("triage-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const ticketEcho = document.getElementById("ticket-echo");
const urgencyChip = document.getElementById("urgency-chip");
const categoryChip = document.getElementById("category-chip");
const replyValue = document.getElementById("reply-value");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history-list");

const triageHistory = [];

document.querySelectorAll(".sample").forEach((btn) => {
  btn.addEventListener("click", () => {
    textarea.value = SAMPLES[btn.dataset.sample];
    textarea.focus();
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ticket = textarea.value.trim();
  if (!ticket) {
    setStatus("Enter a ticket first.", true);
    return;
  }

  triageBtn.disabled = true;
  triageBtn.classList.add("loading");
  setStatus("Triaging…");
  resultEl.hidden = true;

  try {
    const res = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed.");

    renderResult(ticket, data);
    addToHistory(ticket, data);
    setStatus("");
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    triageBtn.disabled = false;
    triageBtn.classList.remove("loading");
  }
});

function renderResult(ticket, { urgency, category, reply }) {
  ticketEcho.textContent = `"${ticket}"`;
  urgencyChip.textContent = `Urgency: ${urgency}`;
  urgencyChip.className = `chip ${urgency.toLowerCase()}`;
  categoryChip.textContent = `Category: ${category}`;
  replyValue.textContent = reply;
  resultEl.hidden = false;
}

function addToHistory(ticket, { urgency, category }) {
  triageHistory.unshift({ ticket, urgency, category });
  if (triageHistory.length > 6) triageHistory.pop();

  historyList.innerHTML = "";
  triageHistory.forEach((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
      <span class="ticket-snippet"></span>
      <span class="chip ${item.urgency.toLowerCase()}"></span>`;
    row.querySelector(".ticket-snippet").textContent = item.ticket;
    row.querySelector(".chip").textContent = `${item.urgency} · ${item.category}`;
    historyList.appendChild(row);
  });
  historySection.hidden = false;
}

document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = document.getElementById(btn.dataset.target);
    const original = btn.textContent;
    try {
      await navigator.clipboard.writeText(target.textContent);
      btn.textContent = "copied ✓";
    } catch {
      btn.textContent = "copy failed";
    }
    setTimeout(() => (btn.textContent = original), 1500);
  });
});

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}
