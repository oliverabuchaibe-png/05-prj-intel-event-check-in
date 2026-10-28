// ===== Intel Sustainability Summit Check-In =====

// ----- Settings -----
const GOAL = 50; // attendance goal
const STORAGE_KEY = "intelSummitCheckIn";

// Team info: the key matches the <option> values in the dropdown
const TEAMS = {
  water: { name: "Team Water Wise", emoji: "🌊" },
  zero: { name: "Team Net Zero", emoji: "🌿" },
  power: { name: "Team Renewables", emoji: "⚡" },
};

// ----- Grab elements from the page -----
const form = document.getElementById("checkInForm");
const nameInput = document.getElementById("attendeeName");
const teamSelect = document.getElementById("teamSelect");
const greeting = document.getElementById("greeting");
const attendeeCountEl = document.getElementById("attendeeCount");
const progressBar = document.getElementById("progressBar");
const teamCountEls = {
  water: document.getElementById("waterCount"),
  zero: document.getElementById("zeroCount"),
  power: document.getElementById("powerCount"),
};

// ----- Data (everything we save lives in this one object) -----
let state = {
  count: 0,
  teams: { water: 0, zero: 0, power: 0 },
  attendees: [], // { name, team }
  celebrated: false,
};

// ----- LevelUp: Save Your Progress (localStorage) -----
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save progress:", err);
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.count === "number" && saved.teams) {
      state = {
        count: saved.count,
        teams: {
          water: saved.teams.water || 0,
          zero: saved.teams.zero || 0,
          power: saved.teams.power || 0,
        },
        attendees: Array.isArray(saved.attendees) ? saved.attendees : [],
        celebrated: Boolean(saved.celebrated),
      };
    }
  } catch (err) {
    // If the saved data is broken, just start fresh
    console.warn("Could not read saved progress:", err);
  }
}

// ----- LevelUp: Attendee List (built with JS under the team counters) -----
const listSection = document.createElement("div");
listSection.className = "attendee-list-section";
listSection.innerHTML =
  '<h3>Attendee List</h3><ul id="attendeeList" class="attendee-list" aria-live="polite"></ul>';
document.querySelector(".team-stats").after(listSection);
const attendeeList = document.getElementById("attendeeList");

// ----- LevelUp: Celebration message -----
const celebration = document.createElement("div");
celebration.id = "celebration";
celebration.className = "celebration";
celebration.setAttribute("role", "status");
celebration.hidden = true;
document.querySelector(".team-stats").before(celebration);

// Works out which team has the most check-ins (handles ties)
function getWinners() {
  const most = Math.max(...Object.values(state.teams));
  return Object.keys(state.teams).filter((key) => state.teams[key] === most);
}

function showCelebration() {
  const winners = getWinners().map((key) => `${TEAMS[key].emoji} ${TEAMS[key].name}`);
  const winnerText =
    winners.length === 1
      ? `${winners[0]} is leading with ${state.teams[getWinners()[0]]} check-ins!`
      : `It's a tie between ${winners.join(" and ")}!`;
  celebration.innerHTML = `<strong>🎉 Goal reached! All ${GOAL} attendees have checked in.</strong><br />${winnerText}`;
  celebration.hidden = false;
}

// ----- Update everything on the page from `state` -----
function render() {
  // Total count + progress bar
  attendeeCountEl.textContent = state.count;
  const percent = Math.min((state.count / GOAL) * 100, 100);
  progressBar.style.width = percent + "%";

  // Team counts
  for (const key in TEAMS) {
    teamCountEls[key].textContent = state.teams[key];
  }

  // Attendee list (newest first)
  attendeeList.innerHTML = "";
  if (state.attendees.length === 0) {
    const empty = document.createElement("li");
    empty.className = "attendee-empty";
    empty.textContent = "No one has checked in yet.";
    attendeeList.appendChild(empty);
  }
  [...state.attendees].reverse().forEach((person) => {
    const li = document.createElement("li");
    li.className = "attendee-item " + person.team;

    const nameSpan = document.createElement("span");
    nameSpan.className = "attendee-name";
    nameSpan.textContent = person.name; // textContent keeps typed names safe

    const teamSpan = document.createElement("span");
    teamSpan.className = "attendee-team";
    teamSpan.textContent = `${TEAMS[person.team].emoji} ${TEAMS[person.team].name}`;

    li.append(nameSpan, teamSpan);
    attendeeList.appendChild(li);
  });

  // Celebration
  if (state.count >= GOAL) {
    showCelebration();
  } else {
    celebration.hidden = true;
  }
}

// ----- Check-in -----
form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading

  const name = nameInput.value.trim();
  const team = teamSelect.value;

  if (name === "" || !TEAMS[team]) {
    greeting.textContent = "Please enter a name and choose a team.";
    greeting.className = "";
    greeting.style.display = "block";
    return;
  }

  // Update the data
  state.count++;
  state.teams[team]++;
  state.attendees.push({ name: name, team: team });
  saveState();

  // Personalized greeting
  greeting.textContent = `Welcome, ${name}! You're checked in with ${TEAMS[team].name}. 🎉`;
  greeting.className = "success";
  greeting.style.display = "block";

  // Show the new numbers, then reset the form
  render();
  form.reset();
  nameInput.focus();
});

// ----- Start up: load saved data and draw the page -----
loadState();
render();
