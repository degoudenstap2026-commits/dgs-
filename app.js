
async function loadSupabaseSdk() {
  if (window.supabase?.createClient) return true;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Supabase SDK kon niet worden geladen."));
    document.head.appendChild(script);
  });

  if (!window.supabase?.createClient) {
    throw new Error("Supabase SDK is niet beschikbaar.");
  }

  return true;
}

function getSupabaseUrl() {
  const value = window.SUPABASE_URL?.trim();
  if (!value || value.includes("VUL_HIER")) return null;

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      throw new Error("De Supabase-URL moet HTTPS gebruiken.");
    }

    // Gebruik de basis-URL, niet /rest/v1/.
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "");
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";

    return url.origin + url.pathname;
  } catch (error) {
    console.error("Ongeldige Supabase-URL:", error);
    throw new Error("Controleer de URL in supabase-config.js.");
  }
}

function isSupabaseConfigured() {
  return !!(
    getSupabaseUrl() &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_ANON_KEY.includes("VUL_HIER")
  );
}

async function getSupabaseClient() {
  const url = getSupabaseUrl();

  if (!url || !window.SUPABASE_ANON_KEY) return null;

  await loadSupabaseSdk();

  if (!window.__goudenSupabase) {
    window.__goudenSupabase =
      window.supabase.createClient(
        url,
        window.SUPABASE_ANON_KEY
      );
  }

  return window.__goudenSupabase;
}

async function loadData() {
  const client = await getSupabaseClient().catch(error => {
    console.error("Supabase verbinden mislukt:", error);
    return null;
  });

  if (client) {
    const { data, error } = await client
      .from("site_content")
      .select("content")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data?.content &&
        Object.keys(data.content).length) {
      return data.content;
    }

    if (error) {
      console.warn("Online inhoud niet geladen:", error.message);
    }
  }

  const saved = localStorage.getItem("goudenstap-data");
  if (saved) return JSON.parse(saved);

  const response = await fetch("data.json");

  if (!response.ok) {
    throw new Error("data.json kon niet worden geladen.");
  }

  return response.json();
}

async function saveData(d) {
  localStorage.setItem("goudenstap-data", JSON.stringify(d));

  const client = await getSupabaseClient().catch(error => {
    console.error("Supabase verbinden mislukt:", error);
    return null;
  });

  if (!client) return { cloud: false };

  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();

  if (sessionError) throw sessionError;

  if (!sessionData?.session) {
    return { cloud: false, loginRequired: true };
  }

  const { error } = await client
    .from("site_content")
    .upsert(
      { id: 1, content: d },
      { onConflict: "id" }
    );

  if (error) throw error;

  return { cloud: true };
}

function resetData() {
  if (confirm("Standaardgegevens opnieuw laden? Dit verwijdert de lokale kopie.")) {
    localStorage.removeItem("goudenstap-data");
    location.reload();
  }
}

function applySite(d) {
  document.querySelectorAll("[data-site-name]")
    .forEach(e => e.textContent = d.site.name);

  document.querySelectorAll("[data-tagline]")
    .forEach(e => e.textContent = d.site.tagline);

  document.documentElement.style.setProperty("--primary", d.site.primary);
  document.documentElement.style.setProperty("--dark", d.site.dark);
  document.documentElement.style.setProperty("--cream", d.site.cream);
  document.documentElement.style.setProperty("--text", d.site.text);

  document.querySelectorAll("[data-footer]")
    .forEach(e => e.textContent = d.site.footer);
}
