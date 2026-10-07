use std::sync::Mutex;

use serde::Serialize;
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "settings.json";
const DEFAULT_UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

/// Resolved once per run so a refresh doesn't re-fetch the organization list.
static ORG_CACHE: Mutex<Option<String>> = Mutex::new(None);

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Meter {
    pub label: String,
    pub pct: f64,
    pub resets_at: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeUsage {
    /// "ready" | "unconfigured" | "error"
    pub status: String,
    pub message: Option<String>,
    pub meters: Vec<Meter>,
    pub fetched_at: u64,
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn state(status: &str, message: Option<String>, meters: Vec<Meter>) -> ClaudeUsage {
    ClaudeUsage { status: status.into(), message, meters, fetched_at: now_ms() }
}

/// Reads a string field out of the persisted settings object.
fn setting(app: &AppHandle, key: &str) -> Option<String> {
    app.store(STORE_FILE)
        .ok()
        .and_then(|store| store.get("settings"))
        .and_then(|s| s.get(key).and_then(|v| v.as_str()).map(str::to_string))
        .filter(|v| !v.trim().is_empty())
}

async fn get_json(client: &reqwest::Client, url: &str, cookie: &str, ua: &str) -> Result<Value, String> {
    let res = client
        .get(url)
        .header("Cookie", cookie)
        .header("User-Agent", ua)
        .header("Accept", "*/*")
        .header("Accept-Language", "en-US,en;q=0.9")
        .header("Referer", "https://claude.ai/")
        .header("Origin", "https://claude.ai")
        .header("Sec-Fetch-Site", "same-origin")
        .header("Sec-Fetch-Mode", "cors")
        .header("Sec-Fetch-Dest", "empty")
        .send()
        .await
        .map_err(|_| "Couldn't reach claude.ai".to_string())?;

    let status = res.status();
    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
        return Err("Session expired: update cookie in Settings".to_string());
    }
    if !status.is_success() {
        return Err(format!("claude.ai returned {status}"));
    }
    res.json::<Value>().await.map_err(|_| "Unexpected response from claude.ai".to_string())
}

/// Picks `utilization` and `resets_at` out of one usage window object.
fn read_window(usage: &Value, key: &str, label: &str) -> Option<Meter> {
    let w = usage.get(key)?;
    Some(Meter {
        label: label.to_string(),
        pct: w.get("utilization")?.as_f64()?,
        resets_at: w.get("resets_at").and_then(|v| v.as_str()).map(str::to_string),
    })
}

async fn fetch(app: &AppHandle) -> Result<Vec<Meter>, String> {
    let cookie = setting(app, "claudeCookie")
        .or_else(|| setting(app, "claudeSessionKey").map(|k| format!("sessionKey={k}")))
        .ok_or("unconfigured")?;
    let ua = DEFAULT_UA;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|_| "Couldn't start a network client".to_string())?;

    let cached = ORG_CACHE.lock().ok().and_then(|c| c.clone());
    let org = match cached {
        Some(o) => o,
        None => {
            let orgs = get_json(&client, "https://claude.ai/api/organizations", &cookie, ua).await?;
            let o = orgs
                .get(0)
                .and_then(|o| o.get("uuid"))
                .and_then(|u| u.as_str())
                .ok_or("No organization found for this session")?
                .to_string();
            if let Ok(mut c) = ORG_CACHE.lock() {
                *c = Some(o.clone());
            }
            o
        }
    };

    let usage = get_json(&client, &format!("https://claude.ai/api/organizations/{org}/usage"), &cookie, ua).await?;
    let meters: Vec<Meter> = [
        read_window(&usage, "five_hour", "Current session"),
        read_window(&usage, "seven_day", "Weekly"),
    ]
    .into_iter()
    .flatten()
    .collect();

    if meters.is_empty() {
        // A changed response shape shouldn't leave a stale organization cached.
        if let Ok(mut c) = ORG_CACHE.lock() {
            *c = None;
        }
        return Err("Usage data had an unexpected shape".to_string());
    }
    Ok(meters)
}

#[tauri::command]
pub async fn claude_usage(app: AppHandle) -> ClaudeUsage {
    match fetch(&app).await {
        Ok(meters) => state("ready", None, meters),
        Err(e) if e == "unconfigured" => state("unconfigured", None, vec![]),
        Err(e) => state("error", Some(e), vec![]),
    }
}
