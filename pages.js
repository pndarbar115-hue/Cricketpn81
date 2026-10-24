document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector("main");
  if (!main) return;

  const originalContent = main.innerHTML;

  const pages = [
    { id: "home", label: "🏠 Home", title: "PN DARBAR Dashboard" },
    { id: "toss", label: "📨 Telegram Toss", title: "Telegram Toss Messages" },
    { id: "live", label: "🏏 Live", title: "Live Cricket" },
    { id: "upcoming", label: "📅 Upcoming", title: "Upcoming Matches" },
    { id: "player", label: "👤 Player", title: "Player Analysis" },
    { id: "pitch", label: "🏟️ Pitch", title: "Pitch Analysis" },
    { id: "results", label: "🏆 Results", title: "Match Results" }
  ];

  const home = document.createElement("section");
  home.id = "page-home";
  home.className = "page active";

  while (main.firstChild) {
    home.appendChild(main.firstChild);
  }

  main.appendChild(home);

  const descriptions = {
    toss: `
      <section class="panel">
        <h2>📨 Telegram Toss Messages</h2>
        <p>Telegram चैनलों से प्राप्त Toss Prediction संदेश यहाँ देखे जा सकते हैं।</p>
        <p class="small">टॉस एक अनिश्चित घटना है। टीम की ताकत से टॉस विजेता निश्चित नहीं होता।</p>
        <h3>टॉस संदेश</h3>
        <div id="toss-page-messages">Telegram संदेश Home पेज पर उपलब्ध हैं।</div>
      </section>`,
    live: `
      <section class="panel">
        <h2>🏏 Live Cricket</h2>
        <p id="live-page-status" class="small">लाइव मैच लोड हो रहे हैं…</p>
        <div id="live-page-list"></div>
        <button type="button" id="live-refresh">🔄 Refresh Live Matches</button>
      </section>`,
    upcoming: `
      <section class="panel">
        <h2>📅 Upcoming Matches</h2>
        <p id="upcoming-page-status" class="small">मैच लोड करने की तैयारी…</p>
        <div id="upcoming-page-list"></div>
      </section>`,
    player: `
      <section class="panel">
        <h2>👤 Player Analysis</h2>
        <label>खिलाड़ी का नाम</label>
        <input id="player-name" placeholder="जैसे Virat Kohli">
        <button id="player-search">खिलाड़ी खोजें</button>
        <p id="player-status" class="small">खिलाड़ी के वास्तविक आँकड़ों का स्रोत जोड़ना बाकी है।</p>
      </section>`,
    pitch: `
      <section class="panel">
        <h2>🏟️ Pitch Analysis</h2>
        <label>मैदान का नाम</label>
        <input id="pitch-name" placeholder="मैदान का नाम लिखें">
        <label>पिच का प्रकार</label>
        <select id="pitch-type">
          <option value="">पिच चुनें</option>
          <option>Batting Friendly</option>
          <option>Fast & Bounce</option>
          <option>Spin Friendly</option>
          <option>Balanced</option>
        </select>
        <p class="small">पिच रिपोर्ट और ऐतिहासिक आँकड़े उपलब्ध होने पर विश्लेषण दिखाया जाएगा।</p>
      </section>`,
    results: `
      <section class="panel">
        <h2>🏆 Match Results</h2>
        <p>मैच के परिणाम दिखाने के लिए वास्तविक परिणाम API जोड़ना बाकी है।</p>
      </section>`
  };

  for (const page of pages) {
    if (page.id === "home") continue;
    const section = document.createElement("section");
    section.id = "page-" + page.id;
    section.className = "page";
    section.innerHTML = `<h2>${page.title}</h2>${descriptions[page.id]}`;
    main.appendChild(section);
  }

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "मुख्य मेनू");

  for (const page of pages) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = page.label;
    button.dataset.page = page.id;
    if (page.id === "home") button.classList.add("active");

    button.addEventListener("click", () => {
      document.querySelectorAll("main > .page").forEach(section => {
        section.classList.toggle("active", section.id === "page-" + page.id);
      });
      nav.querySelectorAll("button").forEach(item => {
        item.classList.toggle("active", item.dataset.page === page.id);
      });

      if (page.id === "upcoming") loadUpcomingPage();
      if (page.id === "live") loadLivePage();
      if (page.id === "toss") loadTossPage();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    nav.appendChild(button);
  }

  document.body.appendChild(nav);


  async function loadLivePage() {
    const list = document.getElementById("live-page-list");
    const status = document.getElementById("live-page-status");
    if (!list || !status) return;

    status.textContent = "लाइव मैच लोड हो रहे हैं…";
    list.replaceChildren();

    try {
      const response = await fetch("https://tg-parser-1-y99t.onrender.com/api/cricket/live");
      if (!response.ok) throw new Error("HTTP " + response.status);

      const data = await response.json();
      const matches = [];

      function collect(value) {
        if (Array.isArray(value)) {
          value.forEach(collect);
        } else if (value && typeof value === "object") {
          if (value.matchInfo) {
            matches.push(value);
          } else {
            Object.values(value).forEach(collect);
          }
        }
      }

      collect(data);

      if (!matches.length) {
        status.textContent = "अभी कोई लाइव मैच नहीं मिला।";
        return;
      }

      matches.forEach(match => {
        const info = match.matchInfo || match;
        const team1 = typeof info.team1 === "string" ? info.team1 : (info.team1?.teamName || info.team1Name || "टीम 1");
        const team2 = typeof info.team2 === "string" ? info.team2 : (info.team2?.teamName || info.team2Name || "टीम 2");
        const card = document.createElement("article");
        card.className = "entry";

        const heading = document.createElement("strong");
        heading.textContent = team1 + " vs " + team2;

        const detail = document.createElement("p");
        detail.textContent = [
          info.matchDesc || info.matchType || "",
          info.status || match.status || ""
        ].filter(Boolean).join("\\n");

        card.append(heading, detail);
        list.appendChild(card);
      });

      status.textContent = "लाइव मैच: " + matches.length;
    } catch (error) {
      status.textContent = "मैच लोड नहीं हुए। API सर्वर और कनेक्शन जाँचें।";
    }
  }

  document.addEventListener("click", event => {
    if (event.target?.id === "live-refresh") loadLivePage();
  });

  async function loadUpcomingPage() {
    const list = document.getElementById("upcoming-page-list");
    const status = document.getElementById("upcoming-page-status");
    status.textContent = "मैच लोड हो रहे हैं…";

    try {
      const response = await fetch("https://tg-parser-1-y99t.onrender.com/api/cricket/upcoming");
      if (!response.ok) throw new Error("API HTTP " + response.status);
      const data = await response.json();

      // PN DARBAR: fetch saved toss counts
      let tossMatches = [];
      try {
        const tossResponse = await fetch(
          "https://tg-parser-1-y99t.onrender.com/api/instances/1/toss-counts"
        );
        if (tossResponse.ok) {
          const tossData = await tossResponse.json();
          tossMatches = Array.isArray(tossData) ? tossData : [];
        }
      } catch (e) {
        console.warn("Toss counts unavailable:", e);
      }

      // ICC API returns matches directly in data.matches
      const matches = Array.isArray(data)
        ? data
        : (Array.isArray(data.matches) ? data.matches
        : Array.isArray(data.data) ? data.data : []);

      if (!matches.length) {
        status.textContent = "ICC API se match nahi mile.";
        return;
      }

      list.innerHTML = "";
      matches.forEach(match => {
        const info = match.matchInfo || match;
        const team1 = info.team1?.teamName || info.team1 || info.team1Name || "टीम 1";
        const team2 = info.team2?.teamName || info.team2 || info.team2Name || "टीम 2";
        const venue = info.venueInfo?.ground || info.venue || "";

        // Match saved counters using both team names
        const tracked = tossMatches.find(m =>
          [m.team1, m.team2].some(t =>
            String(t || "").toLowerCase() === String(team1).toLowerCase()
          ) &&
          [m.team1, m.team2].some(t =>
            String(t || "").toLowerCase() === String(team2).toLowerCase()
          )
        );

        const count1 = tracked
          ? (String(tracked.team1).toLowerCase() === String(team1).toLowerCase()
              ? tracked.team1_count : tracked.team2_count)
          : 0;
        const count2 = tracked
          ? (String(tracked.team1).toLowerCase() === String(team2).toLowerCase()
              ? tracked.team1_count : tracked.team2_count)
          : 0;

        const card = document.createElement("div");
        card.className = "entry";
        const title = document.createElement("strong");
        title.textContent = team1 + " vs " + team2;
        const detail = document.createElement("p");
        detail.textContent = [
          info.series || "",
          info.match_type || info.matchType || info.matchDesc || "",
          "📅 तारीख: " + (info.date || "उपलब्ध नहीं"),
          "🕒 समय: " + (info.time || "उपलब्ध नहीं") + (info.timezone ? " " + info.timezone : ""),
          "🏟️ मैदान: " + (venue || "उपलब्ध नहीं"),
          info.status || ""
        ].filter(Boolean).join("\n");
        const tossCount = document.createElement("p");
        tossCount.textContent =
          "📨 Toss SMS गिनती: " + team1 + " " + count1 +
          " | " + team2 + " " + count2;

        card.append(title, detail, tossCount);
        list.appendChild(card);
      });
      status.textContent = "मैच: " + matches.length;
    } catch (error) {
      status.textContent = "मैच लोड नहीं हुए। TG Parser API चल रही है या नहीं जाँचें।";
    }
  }

  async function loadTossPage() {
    const target = document.getElementById("toss-page-messages");
    if (!target) return;

    target.textContent = "Telegram संदेश लोड हो रहे हैं…";

    try {
      const response = await fetch("https://tg-parser-1-y99t.onrender.com/api/instances/1/events");
      if (!response.ok) throw new Error("HTTP " + response.status);

      const data = await response.json();
      const messages = Array.isArray(data) ? data : (data.events || data.items || []);

      target.innerHTML = "";

      if (!messages.length) {
        target.textContent = "अभी कोई Telegram संदेश उपलब्ध नहीं है।";
        return;
      }

      messages.forEach(message => {
        const card = document.createElement("article");
        card.className = "entry";

        const heading = document.createElement("strong");
        heading.textContent = "📨 Toss SMS";

        const body = document.createElement("p");
        body.style.whiteSpace = "pre-wrap";
        body.textContent = message.message_text || "(खाली संदेश)";

        card.append(heading, body);

        if (message.matched_at) {
          const time = document.createElement("small");
          time.textContent = "प्राप्त समय: " +
            new Date(message.matched_at).toLocaleString("hi-IN");
          card.appendChild(time);
        }

        if (message.message_link && /^https:\/\/t\.me\//i.test(message.message_link)) {
          const link = document.createElement("a");
          link.href = message.message_link;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "मूल Telegram संदेश खोलें";
          link.style.display = "block";
          link.style.marginTop = "8px";
          card.appendChild(link);
        }

        target.appendChild(card);
      });
    } catch (error) {
      target.textContent = "Telegram संदेश लोड नहीं हुए। TG Parser API और कनेक्शन जाँचें।";
      console.error("Telegram Toss API error:", error);
    }
  }

  loadTossPage();
  setInterval(loadTossPage, 30000);

  document.getElementById("player-search")?.addEventListener("click", () => {
    const name = document.getElementById("player-name").value.trim();
    document.getElementById("player-status").textContent = name
      ? "“" + name + "” के वास्तविक आँकड़े दिखाने के लिए खिलाड़ी डेटा API जोड़ना बाकी है।"
      : "पहले खिलाड़ी का नाम लिखें।";
  });
});
