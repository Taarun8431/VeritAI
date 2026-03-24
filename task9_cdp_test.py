import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
from pathlib import Path

import requests
import websocket


FRONTEND_URL = os.getenv("VERITAI_FRONTEND_URL", "http://127.0.0.1:5173")

BROWSER_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

TESTS = [
    {"name": "T20 Cricket", "preset": "T20 Cricket"},
    {"name": "False Claims", "preset": "False Claims"},
    {"name": "Conflicting", "preset": "Conflicting"},
    {"name": "Mixed Facts", "preset": "Mixed Facts"},
]


def find_browser():
    for candidate in BROWSER_CANDIDATES:
        if os.path.exists(candidate):
            return candidate
    raise FileNotFoundError("No supported browser found for Task 9.")


def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class CDPClient:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, timeout=10, suppress_origin=True)
        self.next_id = 1
        self.events = []

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass

    def _record_event(self, message):
        method = message.get("method")
        if method in {"Runtime.consoleAPICalled", "Runtime.exceptionThrown", "Log.entryAdded"}:
            self.events.append(message)

    def send(self, method: str, params=None):
        message_id = self.next_id
        self.next_id += 1
        self.ws.send(json.dumps({"id": message_id, "method": method, "params": params or {}}))

        while True:
            payload = json.loads(self.ws.recv())
            if payload.get("id") == message_id:
                if "error" in payload:
                    raise RuntimeError(f"{method} failed: {payload['error']}")
                return payload.get("result", {})
            self._record_event(payload)

    def evaluate(self, expression: str):
        result = self.send(
            "Runtime.evaluate",
            {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": True,
            },
        )
        if result.get("exceptionDetails"):
            raise RuntimeError(result["exceptionDetails"])
        return result.get("result", {}).get("value")

    def wait_for(self, expression: str, timeout: float, label: str):
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                if self.evaluate(expression):
                    return
            except Exception:
                pass
            time.sleep(0.25)
        raise TimeoutError(f"Timed out waiting for {label}")


def launch_browser():
    browser_path = find_browser()
    user_data_dir = tempfile.mkdtemp(prefix="veritai-cdp-")
    debug_port = get_free_port()
    args = [
        browser_path,
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-dev-shm-usage",
        "--no-proxy-server",
        "--proxy-bypass-list=*",
        "--remote-allow-origins=*",
        f"--remote-debugging-port={debug_port}",
        f"--user-data-dir={user_data_dir}",
        FRONTEND_URL,
    ]
    process = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for _ in range(80):
        try:
            pages = requests.get(f"http://127.0.0.1:{debug_port}/json/list", timeout=1).json()
            target = next(
                (page for page in pages if page.get("type") == "page" and page.get("url", "").startswith(FRONTEND_URL)),
                None,
            )
            if target:
                return process, user_data_dir, target["webSocketDebuggerUrl"]
        except Exception:
            time.sleep(0.25)

    process.terminate()
    shutil.rmtree(user_data_dir, ignore_errors=True)
    raise RuntimeError("Failed to start browser CDP session.")


def install_error_hooks(client: CDPClient):
    client.send("Page.enable")
    client.send("Runtime.enable")
    client.send("Log.enable")
    client.evaluate(
        """
        (() => {
          window.__veritaiErrors = [];
          const push = (kind, value) => {
            window.__veritaiErrors.push({ kind, value: String(value) });
          };
          const originalError = console.error.bind(console);
          console.error = (...args) => {
            push("console.error", args.join(" "));
            originalError(...args);
          };
          window.addEventListener("error", (event) => push("error", event.message));
          window.addEventListener("unhandledrejection", (event) => {
            const reason = event.reason && event.reason.message ? event.reason.message : event.reason;
            push("rejection", reason);
          });
          return true;
        })()
        """
    )


def click_by_text(client: CDPClient, text: str):
    return client.evaluate(
        f"""
        (() => {{
          const needle = {json.dumps(text)}.toLowerCase();
          const target = [...document.querySelectorAll("button, [role='button'], a")]
            .find((node) => node.textContent && node.textContent.toLowerCase().includes(needle));
          if (!target) return false;
          target.click();
          return true;
        }})()
        """
    )


def get_state(client: CDPClient):
    return client.evaluate("window.__VERITAI_STATE__ || {}")


def get_app_events(client: CDPClient):
    return client.evaluate("window.__VERITAI_EVENTS__ || []")


def get_console_errors(client: CDPClient):
    return client.evaluate("window.__veritaiErrors || []")


def wait_for_screen(client: CDPClient, screen: str, timeout: float):
    client.wait_for(f"(window.__VERITAI_STATE__ || {{}}).screen === {json.dumps(screen)}", timeout, screen)


def visible_claim_cards(client: CDPClient):
    return client.evaluate("document.querySelectorAll(\"[id^='claim-card-']\").length")


def run_single_test(client: CDPClient, test_name: str, preset: str, first: bool):
    if not first:
        if not click_by_text(client, "New Analysis"):
            raise RuntimeError("Could not click New Analysis.")
        wait_for_screen(client, "landing", 10)
        client.wait_for(
            f"document.body.innerText.includes({json.dumps(preset)}) && document.body.innerText.includes('INITIATE VERIFICATION')",
            10,
            "landing dom",
        )
    else:
        client.wait_for(
            f"document.body.innerText.includes({json.dumps(preset)}) && document.body.innerText.includes('INITIATE VERIFICATION')",
            10,
            "landing dom",
        )

    if not click_by_text(client, preset):
        raise RuntimeError(f"Could not click preset {preset}.")

    if not click_by_text(client, "Initiate Verification"):
        raise RuntimeError("Could not click Initiate Verification.")

    started = time.time()
    wait_for_screen(client, "analysis", 8)
    analysis_seen = True
    wait_for_screen(client, "report", 75)
    client.wait_for(
        "document.body.innerText.includes('VERIFICATION SCORE') && document.body.innerText.includes('CLAIM VERDICTS')",
        10,
        "report dom",
    )
    elapsed = time.time() - started

    state = get_state(client)
    events = get_app_events(client)
    errors = get_console_errors(client)

    verdicts = list((state.get("verdicts") or {}).values())
    true_hits = [item for item in verdicts if item.get("verdict") == "True" and float(item.get("confidence", 0)) > 0.6]
    false_hits = [item for item in verdicts if item.get("verdict") == "False"]
    mixed_verdicts = {item.get("verdict") for item in verdicts}
    stages = [event.get("data", {}).get("stage") for event in events if event.get("event") == "status"]

    checks = {
        "analysis_seen": analysis_seen,
        "stages_complete": all(stage in stages for stage in ["extracting", "searching", "verifying", "complete"]),
        "claims_count": len(state.get("claims") or []),
        "verdict_count": len(verdicts),
        "time_seconds": round(elapsed, 2),
        "console_errors": errors,
    }

    if test_name == "T20 Cricket":
        checks["min_claims"] = checks["claims_count"] >= 3
        checks["true_hits"] = len(true_hits) >= 2
        checks["source_links"] = client.evaluate("document.querySelectorAll(\"#claim-card-claim-1 a[target='_blank'], [id^='claim-card-'] a[target='_blank']\").length") > 0
        checks["green_highlights"] = client.evaluate(
            "Array.from(document.querySelectorAll(\"[data-highlight-id]\"))"
            ".some((node) => getComputedStyle(node).backgroundColor.includes('52, 211, 153'))"
        )
        checks["accuracy_positive"] = float(state.get("accuracy") or 0) > 0
    elif test_name == "False Claims":
        checks["false_hits"] = len(false_hits) >= 2
        checks["reasoning_names_sources"] = any(
            any(source.get("title", "").split(" - ")[0] in item.get("reasoning", "") for source in item.get("sources", []))
            for item in false_hits
        )
        click_by_text(client, "False")
        client.wait_for("(window.__VERITAI_STATE__ || {}).filter === 'False'", 5, "false filter")
        checks["filter_matches_false_count"] = visible_claim_cards(client) == len(false_hits)
    elif test_name == "Conflicting":
        checks["has_conflict_or_partial"] = any(
            item.get("verdict") in {"Conflicting", "Partially True"} for item in verdicts
        )
    elif test_name == "Mixed Facts":
        checks["three_colors"] = len(mixed_verdicts) >= 3
        checks["report_sections"] = client.evaluate(
            "document.body.innerText.includes('VERIFICATION SCORE') && document.body.innerText.includes('ANNOTATED SOURCE') && document.body.innerText.includes('CLAIM VERDICTS')"
        )

    return checks


def main():
    process, user_data_dir, ws_url = launch_browser()
    client = CDPClient(ws_url)
    results = []

    try:
      client.wait_for("document.readyState === 'complete'", 20, "page load")
      install_error_hooks(client)
      wait_for_screen(client, "landing", 10)

      for index, test in enumerate(TESTS):
          results.append(run_single_test(client, test["name"], test["preset"], first=index == 0))

      print(json.dumps(results, indent=2))
    finally:
      client.close()
      process.terminate()
      try:
          process.wait(timeout=5)
      except Exception:
          process.kill()
      shutil.rmtree(user_data_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
