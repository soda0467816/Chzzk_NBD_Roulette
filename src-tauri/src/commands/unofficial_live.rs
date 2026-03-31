use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use tokio::task::JoinHandle;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;

const API_BASE: &str = "https://api.chzzk.naver.com";
const GAME_API_BASE: &str = "https://comm-api.game.naver.com/nng_main";
const DEFAULT_USER_AGENT: &str =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

const CHAT_CMD_PING: i64 = 0;
const CHAT_CMD_CONNECT: i64 = 100;
const CHAT_CMD_CONNECTED: i64 = 10100;
const CHAT_CMD_CHAT: i64 = 93101;
const CHAT_CMD_DONATION: i64 = 93102;
const CHAT_CMD_RECENT_CHAT: i64 = 15101;

const CHAT_TYPE_TEXT: i64 = 1;
const CHAT_TYPE_DONATION: i64 = 10;

#[derive(Default)]
pub struct UnofficialLiveController {
    task: Mutex<Option<JoinHandle<()>>>,
}

#[derive(Debug, Deserialize)]
pub struct StartUnofficialLivePayload {
    #[serde(alias = "channelId")]
    channel_id: String,
    mode: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct VerifyUnofficialLiveRequest {
    #[serde(alias = "channelId")]
    channel_id: String,
}

#[derive(Clone, Serialize)]
pub struct VerifyUnofficialLiveResult {
    status: String,
    open: bool,
    channel_id: String,
    chat_channel_id: String,
}

#[derive(Clone, Serialize)]
struct UnofficialLiveStatusPayload {
    running: bool,
    connected: bool,
    channel_id: String,
    mode: String,
    last_error: Option<String>,
}

#[derive(Clone, Serialize)]
struct UnofficialLiveMessagePayload {
    channel_id: String,
    chat_channel_id: String,
    nickname: String,
    message: String,
    pay_amount: Option<i64>,
    donation_type: Option<String>,
    pay_type: Option<String>,
    is_anonymous: Option<bool>,
    hidden: bool,
    time: i64,
    member_count: i64,
    message_type_code: i64,
    user_id_hash: Option<String>,
    user_role_code: Option<String>,
    extras: Value,
    raw: Value,
}

fn emit_status(app: &AppHandle, status: UnofficialLiveStatusPayload) {
    let _ = app.emit("unofficial-live-status", status);
}

fn emit_error(app: &AppHandle, message: impl Into<String>) {
    let _ = app.emit("unofficial-live-error", json!({ "message": message.into() }));
}

fn cookie_header() -> Option<String> {
    None
}

async fn fetch_live_status(channel_id: &str) -> Result<Value, String> {
    let response = reqwest::Client::new()
        .get(format!("{API_BASE}/polling/v2/channels/{channel_id}/live-status"))
        .header("User-Agent", DEFAULT_USER_AGENT)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    response.json::<Value>().await.map_err(|error| error.to_string())
}

async fn fetch_chat_access_token(chat_channel_id: &str) -> Result<String, String> {
    let mut request = reqwest::Client::new()
        .get(format!(
            "{GAME_API_BASE}/v1/chats/access-token?channelId={chat_channel_id}&chatType=STREAMING"
        ))
        .header("User-Agent", DEFAULT_USER_AGENT);

    if let Some(cookie) = cookie_header() {
        request = request.header("Cookie", cookie);
    }

    let response = request.send().await.map_err(|error| error.to_string())?;
    let value = response.json::<Value>().await.map_err(|error| error.to_string())?;

    if value.get("code").and_then(Value::as_i64) == Some(42601) {
        return Err("Broadcast is age-restricted and requires logged-in cookies.".to_string());
    }

    value
        .get("content")
        .and_then(|content| content.get("accessToken"))
        .and_then(Value::as_str)
        .map(|value| value.to_string())
        .ok_or("Chat access token could not be resolved.".to_string())
}

fn parse_live_status(value: &Value) -> Option<(String, String)> {
    let content = value.get("content")?;
    let status = content.get("status").and_then(Value::as_str).unwrap_or("").to_string();

    let chat_channel_id = content
        .get("chatChannelId")
        .and_then(Value::as_str)
        .map(|value| value.to_string())
        .or_else(|| {
            content
                .get("livePollingStatusJson")
                .and_then(Value::as_str)
                .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
                .and_then(|parsed| parsed.get("chatChannelId").and_then(Value::as_str).map(|value| value.to_string()))
        })?;

    Some((status, chat_channel_id))
}

fn parse_string_field(message: &Value, key_a: &str, key_b: &str) -> String {
    message
        .get(key_a)
        .or_else(|| message.get(key_b))
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string()
}

fn parse_i64_field(message: &Value, key_a: &str, key_b: &str) -> i64 {
    message
        .get(key_a)
        .or_else(|| message.get(key_b))
        .and_then(Value::as_i64)
        .unwrap_or(0)
}

fn parse_bool_hidden(message: &Value) -> bool {
    parse_string_field(message, "msgStatusType", "messageStatusType") == "HIDDEN"
}

fn parse_profile_nickname(message: &Value) -> String {
    parse_profile_value(message)
        .and_then(|profile| profile.get("nickname").and_then(Value::as_str).map(|value| value.to_string()))
        .unwrap_or_default()
}

fn parse_profile_value(message: &Value) -> Option<Value> {
    message
        .get("profile")
        .and_then(Value::as_str)
        .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
}

fn parse_profile_field(message: &Value, key: &str) -> Option<String> {
    parse_profile_value(message)
        .and_then(|profile| profile.get(key).and_then(Value::as_str).map(|value| value.to_string()))
}

fn parse_extras(message: &Value) -> Value {
    message
        .get("extras")
        .and_then(Value::as_str)
        .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
        .unwrap_or_else(|| json!({}))
}

fn derive_server_id(chat_channel_id: &str) -> u32 {
    let total: i32 = chat_channel_id.chars().map(|char| char as i32).sum();
    (total.unsigned_abs() % 9) + 1
}

#[tauri::command]
pub async fn verify_unofficial_live(payload: VerifyUnofficialLiveRequest) -> Result<VerifyUnofficialLiveResult, String> {
    let channel_id = payload.channel_id;
    let live_status = fetch_live_status(&channel_id).await?;
    let (status, chat_channel_id) =
        parse_live_status(&live_status).ok_or("Live chat channel could not be resolved.".to_string())?;

    Ok(VerifyUnofficialLiveResult {
        channel_id,
        open: status == "OPEN",
        status,
        chat_channel_id,
    })
}

#[tauri::command]
pub async fn start_unofficial_live_collector(
    app: AppHandle,
    state: State<'_, UnofficialLiveController>,
    payload: StartUnofficialLivePayload,
) -> Result<(), String> {
    stop_unofficial_live_collector(app.clone(), state.clone()).await.ok();

    let live_status = fetch_live_status(&payload.channel_id).await?;
    let (status, chat_channel_id) =
        parse_live_status(&live_status).ok_or("Live chat channel could not be resolved.".to_string())?;
    if status != "OPEN" {
      return Err("The live does not appear to be open right now.".to_string());
    }

    let access_token = fetch_chat_access_token(&chat_channel_id).await?;
    let mode = payload.mode.unwrap_or_else(|| "donation".to_string());

    emit_status(
        &app,
        UnofficialLiveStatusPayload {
            running: true,
            connected: false,
            channel_id: payload.channel_id.clone(),
            mode: mode.clone(),
            last_error: None,
        },
    );

    let app_handle = app.clone();
    let channel_id = payload.channel_id.clone();
    let chat_channel_id_for_task = chat_channel_id.clone();
    let handle = tokio::spawn(async move {
        let server_id = derive_server_id(&chat_channel_id_for_task);
        let socket_url = format!("wss://kr-ss{server_id}.chat.naver.com/chat");

        match connect_async(&socket_url).await {
            Ok((mut socket, _)) => {
                let connect_payload = json!({
                    "ver": "2",
                    "cid": chat_channel_id_for_task,
                    "svcid": "game",
                    "cmd": CHAT_CMD_CONNECT,
                    "tid": 1,
                    "bdy": {
                        "accTkn": access_token,
                        "auth": "READ",
                        "devType": 2001,
                        "uid": Value::Null
                    }
                });

                if socket.send(Message::Text(connect_payload.to_string())).await.is_err() {
                    emit_error(&app_handle, "Failed to send websocket connect payload.");
                    return;
                }

                while let Some(next_message) = socket.next().await {
                    match next_message {
                        Ok(Message::Text(text)) => {
                            if let Ok(packet) = serde_json::from_str::<Value>(&text) {
                                let cmd = packet.get("cmd").and_then(Value::as_i64).unwrap_or_default();
                                let body = packet.get("bdy").cloned().unwrap_or_else(|| json!({}));

                                if cmd == CHAT_CMD_CONNECTED {
                                    emit_status(
                                        &app_handle,
                                        UnofficialLiveStatusPayload {
                                            running: true,
                                            connected: true,
                                            channel_id: channel_id.clone(),
                                            mode: mode.clone(),
                                            last_error: None,
                                        },
                                    );
                                    continue;
                                }

                                if cmd == CHAT_CMD_PING {
                                    let _ = socket.send(Message::Text(json!({ "cmd": 10000, "ver": "2" }).to_string())).await;
                                    continue;
                                }

                                if cmd != CHAT_CMD_CHAT && cmd != CHAT_CMD_DONATION && cmd != CHAT_CMD_RECENT_CHAT {
                                    continue;
                                }

                                let messages = body
                                    .get("messageList")
                                    .and_then(Value::as_array)
                                    .cloned()
                                    .or_else(|| body.as_array().cloned())
                                    .unwrap_or_default();

                                for message in messages {
                                    let message_type = message
                                        .get("msgTypeCode")
                                        .or_else(|| message.get("messageTypeCode"))
                                        .and_then(Value::as_i64)
                                        .unwrap_or_default();

                                    let payload = UnofficialLiveMessagePayload {
                                        channel_id: channel_id.clone(),
                                        chat_channel_id: chat_channel_id_for_task.clone(),
                                        nickname: parse_profile_nickname(&message),
                                        message: parse_string_field(&message, "msg", "content"),
                                        pay_amount: None,
                                        donation_type: None,
                                        pay_type: None,
                                        is_anonymous: None,
                                        hidden: parse_bool_hidden(&message),
                                        time: parse_i64_field(&message, "msgTime", "messageTime"),
                                        member_count: parse_i64_field(&message, "mbrCnt", "memberCount"),
                                        message_type_code: message_type,
                                        user_id_hash: parse_profile_field(&message, "userIdHash"),
                                        user_role_code: parse_profile_field(&message, "userRoleCode"),
                                        extras: parse_extras(&message),
                                        raw: message.clone(),
                                    };

                                    if message_type == CHAT_TYPE_TEXT {
                                        let _ = app_handle.emit("unofficial-live-chat", &payload);
                                        continue;
                                    }

                                    if message_type == CHAT_TYPE_DONATION {
                                        let extras = parse_extras(&message);
                                        let donation_payload = UnofficialLiveMessagePayload {
                                            pay_amount: extras.get("payAmount").and_then(Value::as_i64),
                                            donation_type: extras
                                                .get("donationType")
                                                .and_then(Value::as_str)
                                                .map(|value| value.to_string()),
                                            pay_type: extras
                                                .get("payType")
                                                .and_then(Value::as_str)
                                                .map(|value| value.to_string()),
                                            is_anonymous: extras.get("isAnonymous").and_then(Value::as_bool),
                                            extras,
                                            ..payload
                                        };
                                        let _ = app_handle.emit("unofficial-live-donation", &donation_payload);
                                    }
                                }
                            }
                        }
                        Ok(Message::Close(_)) => break,
                        Ok(_) => {}
                        Err(error) => {
                            emit_error(&app_handle, error.to_string());
                            break;
                        }
                    }
                }
            }
            Err(error) => {
                emit_error(&app_handle, error.to_string());
            }
        }

        emit_status(
            &app_handle,
            UnofficialLiveStatusPayload {
                running: false,
                connected: false,
                channel_id,
                mode,
                last_error: None,
            },
        );
    });

    *state.task.lock().map_err(|_| "Collector state lock failed.".to_string())? = Some(handle);
    Ok(())
}

#[tauri::command]
pub async fn stop_unofficial_live_collector(
    app: AppHandle,
    state: State<'_, UnofficialLiveController>,
) -> Result<(), String> {
    if let Some(handle) = state.task.lock().map_err(|_| "Collector state lock failed.".to_string())?.take() {
        handle.abort();
    }

    emit_status(
        &app,
        UnofficialLiveStatusPayload {
            running: false,
            connected: false,
            channel_id: String::new(),
            mode: "donation".to_string(),
            last_error: None,
        },
    );

    Ok(())
}
