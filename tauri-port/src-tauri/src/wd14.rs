// WD14 Autotagger — ComfyUI bridge. Direct Rust port of the Electron
// version's main.ts handlers (see that file's own comment for why this has
// to live outside the webview: ComfyUI's server.py rejects cross-origin
// requests whose Origin doesn't match Host, and separately the browser
// enforces CORS on the response regardless — neither restriction applies to
// a plain HTTP client, which is exactly what this is).
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Wd14Settings {
    pub model: String,
    pub threshold: f64,
    pub character_threshold: f64,
    pub replace_underscore: bool,
    pub trailing_comma: bool,
    pub exclude_tags: String,
}

#[derive(Serialize)]
pub struct Wd14Result {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub models: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "tagsCsv")]
    pub tags_csv: Option<String>,
}

fn err(msg: impl Into<String>) -> Wd14Result {
    Wd14Result { ok: false, error: Some(msg.into()), models: None, tags_csv: None }
}

#[tauri::command]
pub async fn wd14_get_models(host: String) -> Wd14Result {
    let client = reqwest::Client::new();
    let url = match reqwest::Url::parse(&host).and_then(|u| u.join("/object_info/WD14Tagger%7Cpysssss")) {
        Ok(u) => u,
        Err(_) => return err("Invalid ComfyUI host URL."),
    };
    let resp = match client.get(url).timeout(Duration::from_secs(6)).send().await {
        Ok(r) => r,
        Err(e) => return err(format!("Could not reach ComfyUI at {} — is it running? ({})", host, e)),
    };
    if !resp.status().is_success() {
        return err(format!(
            "ComfyUI returned HTTP {} — is the WD14 Tagger (pysssss) custom node installed?",
            resp.status().as_u16()
        ));
    }
    let parsed: Value = match resp.json().await {
        Ok(v) => v,
        Err(e) => return err(format!("Could not parse ComfyUI's response: {}", e)),
    };
    let models = parsed
        .get("WD14Tagger|pysssss")
        .and_then(|n| n.get("input"))
        .and_then(|n| n.get("required"))
        .and_then(|n| n.get("model"))
        .and_then(|m| m.get(0))
        .and_then(|list| list.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect::<Vec<_>>()
        });
    match models {
        Some(models) => Wd14Result { ok: true, error: None, models: Some(models), tags_csv: None },
        None => err("Could not find the WD14 Tagger node on that ComfyUI instance."),
    }
}

#[tauri::command(rename_all = "camelCase")]
pub async fn wd14_tag_image(
    host: String,
    filename: String,
    image_bytes: Vec<u8>,
    settings: Wd14Settings,
) -> Wd14Result {
    let client = reqwest::Client::new();

    // Upload the image into ComfyUI's own input/ folder, overwriting by name
    // — this app doesn't need ComfyUI to remember it afterward.
    let upload_url = format!("{}/upload/image", host.trim_end_matches('/'));
    let part = match reqwest::multipart::Part::bytes(image_bytes).file_name(filename.clone()).mime_str("application/octet-stream") {
        Ok(p) => p,
        Err(e) => return err(format!("Could not build the upload request: {}", e)),
    };
    let form = reqwest::multipart::Form::new()
        .text("type", "input")
        .text("overwrite", "true")
        .part("image", part);
    let upload_resp = match client.post(&upload_url).multipart(form).timeout(Duration::from_secs(20)).send().await {
        Ok(r) => r,
        Err(e) => return err(format!("Could not reach ComfyUI at {} — is it running? ({})", host, e)),
    };
    if !upload_resp.status().is_success() {
        return err(format!("Image upload to ComfyUI failed (HTTP {}).", upload_resp.status().as_u16()));
    }
    let uploaded: Value = match upload_resp.json().await {
        Ok(v) => v,
        Err(e) => return err(format!("Could not parse ComfyUI's upload response: {}", e)),
    };
    let name = uploaded.get("name").and_then(|v| v.as_str()).unwrap_or(&filename).to_string();
    let subfolder = uploaded.get("subfolder").and_then(|v| v.as_str()).unwrap_or("");
    let image_ref = if subfolder.is_empty() { name } else { format!("{}/{}", subfolder, name) };

    let client_id = format!(
        "dts-{:x}-{:x}",
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis(),
        rand_u32()
    );
    let prompt = serde_json::json!({
        "1": { "class_type": "LoadImage", "inputs": { "image": image_ref, "upload": "image" } },
        "2": {
            "class_type": "WD14Tagger|pysssss",
            "inputs": {
                "image": ["1", 0],
                "model": settings.model,
                "threshold": settings.threshold,
                "character_threshold": settings.character_threshold,
                "replace_underscore": settings.replace_underscore,
                "trailing_comma": settings.trailing_comma,
                "exclude_tags": settings.exclude_tags
            }
        }
    });
    let queue_body = serde_json::json!({ "prompt": prompt, "client_id": client_id });
    let queue_url = format!("{}/prompt", host.trim_end_matches('/'));
    let queue_resp = match client.post(&queue_url).json(&queue_body).timeout(Duration::from_secs(10)).send().await {
        Ok(r) => r,
        Err(e) => return err(format!("Could not reach ComfyUI at {} — is it running? ({})", host, e)),
    };
    let status = queue_resp.status();
    let queue_parsed: Value = queue_resp.json().await.unwrap_or(Value::Null);
    if !status.is_success() {
        let msg = queue_parsed.get("error").and_then(|e| e.get("message")).and_then(|m| m.as_str());
        return err(match msg {
            Some(m) => format!("ComfyUI rejected the request: {}", m),
            None => format!("ComfyUI returned HTTP {} queuing the tag request.", status.as_u16()),
        });
    }
    if let Some(node_errors) = queue_parsed.get("node_errors").and_then(|v| v.as_object()) {
        if !node_errors.is_empty() {
            return err(format!("ComfyUI rejected the workflow: {}", Value::Object(node_errors.clone())));
        }
    }
    let prompt_id = match queue_parsed.get("prompt_id").and_then(|v| v.as_str()) {
        Some(id) => id.to_string(),
        None => return err("ComfyUI did not return a prompt id."),
    };

    let deadline = std::time::Instant::now() + Duration::from_secs(120);
    let history_url = format!("{}/history/{}", host.trim_end_matches('/'), prompt_id);
    while std::time::Instant::now() < deadline {
        tokio::time::sleep(Duration::from_millis(700)).await;
        let hist_resp = match client.get(&history_url).timeout(Duration::from_secs(8)).send().await {
            Ok(r) => r,
            Err(_) => continue,
        };
        if !hist_resp.status().is_success() {
            continue;
        }
        let hist: Value = match hist_resp.json().await {
            Ok(v) => v,
            Err(_) => continue,
        };
        let record = match hist.get(&prompt_id) {
            Some(r) => r,
            None => continue,
        };
        if let Some(tags) = record.get("outputs").and_then(|o| o.get("2")).and_then(|n| n.get("tags")) {
            let tags_csv = if let Some(arr) = tags.as_array() {
                arr.get(0).and_then(|v| v.as_str()).unwrap_or("").to_string()
            } else {
                tags.as_str().unwrap_or("").to_string()
            };
            return Wd14Result { ok: true, error: None, models: None, tags_csv: Some(tags_csv) };
        }
        if record.get("status").and_then(|s| s.get("status_str")).and_then(|s| s.as_str()) == Some("error") {
            return err("ComfyUI reported an error while tagging this image — check its console for details.");
        }
    }
    err("Timed out waiting for ComfyUI to finish tagging this image.")
}

fn rand_u32() -> u32 {
    // No need for a real RNG dependency just to make a client_id unique
    // enough to tell concurrent tag requests apart in ComfyUI's own queue.
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().subsec_nanos();
    nanos ^ (nanos.rotate_left(13))
}
