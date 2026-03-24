import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import AnalysisScreen from "./components/AnalysisScreen.jsx";
import BonusScreen from "./components/BonusScreen.jsx";
import HistoryDropdown from "./components/HistoryDropdown.jsx";
import LandingScreen from "./components/LandingScreen.jsx";
import ReportScreen from "./components/ReportScreen.jsx";
import ToastContainer from "./components/ToastContainer.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const DEFAULT_PROGRESS = {
  stage: "extracting",
  progress: 0,
  claims_total: 0,
  claims_done: 0,
};

const PRESETS = {
  "T20 Cricket": {
    mode: "TEXT",
    value:
      "India won the 2024 T20 World Cup. The final was played at Kensington Oval in Bridgetown, Barbados. Rohit Sharma captained India in the final. India defeated South Africa by seven runs in the final.",
  },
  "False Claims": {
    mode: "TEXT",
    value:
      "The Eiffel Tower is in Berlin. The Pacific Ocean is the smallest ocean on Earth. Australia is in Europe. Water boils at 0 degrees Celsius at sea level.",
  },
  Conflicting: {
    mode: "TEXT",
    value:
      "Tomatoes are vegetables. The Nile is the longest river in the world. Pluto is the ninth planet in the Solar System. Vitamin C cures the common cold.",
  },
  "Mixed Facts": {
    mode: "TEXT",
    value:
      "NASA was founded in 1958. Mount Everest is in Nepal. The Pacific Ocean is the smallest ocean on Earth. The current population of Tokyo is exactly 14 million. Drinking coffee always causes dehydration.",
  },
};

function createToast(message, tone = "error") {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    tone,
  };
}

function normalizeEventChunk(chunk) {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("");
}

function computeAccuracy(verdicts) {
  const values = Object.values(verdicts);
  if (!values.length) {
    return 0;
  }

  const weights = {
    True: 1,
    "Partially True": 0.65,
    Conflicting: 0.45,
    "Temporally Uncertain": 0.5,
    Unverifiable: 0.3,
    False: 0,
  };

  const total = values.reduce(
    (sum, item) => sum + (weights[item.verdict] ?? 0.25),
    0,
  );
  return Math.round((total / values.length) * 100);
}

function getPageFromHash() {
  return window.location.hash.startsWith("#bonus") ? "bonus" : "app";
}

function getBonusFeatureFromHash() {
  return window.location.hash === "#bonus-media" ? "media" : "ai";
}

function getBonusHash(feature) {
  return feature === "media" ? "#bonus-media" : "#bonus-ai";
}

export default function App() {
  const [page, setPage] = useState(getPageFromHash);
  const [bonusFeature, setBonusFeature] = useState(getBonusFeatureFromHash);
  const [screen, setScreen] = useState("landing");
  const [mode, setMode] = useState("TEXT");
  const [textValue, setTextValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [claims, setClaims] = useState([]);
  const [verdicts, setVerdicts] = useState({});
  const [aiScore, setAiScore] = useState(null);
  const [deepfakes, setDeepfakes] = useState([]);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [toasts, setToasts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [isVerifying, setIsVerifying] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const abortRef = useRef(null);
  const activeRunRef = useRef(0);
  const toastTimersRef = useRef(new Map());
  const verdictsRef = useRef({});
  const eventHistoryRef = useRef([]);

  useEffect(() => {
    verdictsRef.current = verdicts;
  }, [verdicts]);

  const activeInput = mode === "TEXT" ? textValue : urlValue;
  const orderedClaims = useMemo(
    () =>
      [...claims].sort((left, right) => {
        if (left.char_start !== right.char_start) {
          return left.char_start - right.char_start;
        }
        return left.char_end - right.char_end;
      }),
    [claims],
  );

  const verifiedClaims = useMemo(
    () => orderedClaims.filter((claim) => verdicts[claim.id]),
    [orderedClaims, verdicts],
  );

  const filteredClaims = useMemo(() => {
    if (filter === "All") {
      return verifiedClaims;
    }
    return verifiedClaims.filter((claim) => verdicts[claim.id]?.verdict === filter);
  }, [filter, verifiedClaims, verdicts]);

  const verdictSummary = useMemo(() => {
    const summary = {
      True: 0,
      False: 0,
      "Partially True": 0,
      Conflicting: 0,
      Unverifiable: 0,
      "Temporally Uncertain": 0,
    };

    Object.values(verdicts).forEach((item) => {
      if (summary[item.verdict] !== undefined) {
        summary[item.verdict] += 1;
      }
    });

    return summary;
  }, [verdicts]);

  const accuracy = useMemo(() => computeAccuracy(verdicts), [verdicts]);
  const durationSeconds = useMemo(() => {
    if (!startedAt || !completedAt) {
      return 0;
    }
    return Math.max(0, (completedAt - startedAt) / 1000);
  }, [completedAt, startedAt]);

  useEffect(() => {
    const onHashChange = () => {
      setPage(getPageFromHash());
      setBonusFeature(getBonusFeatureFromHash());
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`${API_BASE}/history?limit=12`);
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setHistoryItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (error) {
      // Ignore history fetch failures to avoid blocking the main flow.
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  useEffect(() => {
    window.__VERITAI_STATE__ = {
      page,
      screen,
      mode,
      textValue,
      urlValue,
      sourceText,
      claims,
      verdicts,
      aiScore,
      deepfakes,
      progress,
      toasts,
      filter,
      isVerifying,
      accuracy,
      durationSeconds,
    };
  }, [
    accuracy,
    aiScore,
    claims,
    deepfakes,
    durationSeconds,
    filter,
    isVerifying,
    mode,
    page,
    progress,
    screen,
    sourceText,
    textValue,
    toasts,
    urlValue,
    verdicts,
  ]);

  const addToast = (message, tone = "error") => {
    const toast = createToast(message, tone);
    setToasts((current) => [...current, toast]);

    const timerId = window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
      toastTimersRef.current.delete(toast.id);
    }, 4000);

    toastTimersRef.current.set(toast.id, timerId);
  };

  const dismissToast = (toastId) => {
    const timerId = toastTimersRef.current.get(toastId);
    if (timerId) {
      window.clearTimeout(timerId);
      toastTimersRef.current.delete(toastId);
    }
    setToasts((current) => current.filter((item) => item.id !== toastId));
  };

  const resetAnalysisState = () => {
    eventHistoryRef.current = [];
    window.__VERITAI_EVENTS__ = [];
    setClaims([]);
    setVerdicts({});
    setAiScore(null);
    setDeepfakes([]);
    setProgress(DEFAULT_PROGRESS);
    setFilter("All");
    setStartedAt(null);
    setCompletedAt(null);
    setSourceText("");
  };

  const resetToLanding = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    activeRunRef.current += 1;
    setIsVerifying(false);
    resetAnalysisState();
    setScreen("landing");
  };

  const openBonusFeature = (feature) => {
    const nextFeature = feature === "media" ? "media" : "ai";
    setBonusFeature(nextFeature);
    window.location.hash = getBonusHash(nextFeature);
  };

  const leaveBonusPage = () => {
    window.location.hash = "";
    setPage("app");
  };

  const goHomePage = () => {
    window.location.hash = "";
    setPage("app");
    setScreen("landing");
  };

  const restoreHistoryEntry = (entry) => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    activeRunRef.current += 1;
    setIsVerifying(false);

    const nextMode = entry.mode === "URL" ? "URL" : "TEXT";
    const savedClaims = Array.isArray(entry.claims) ? entry.claims : [];
    const savedVerdicts =
      entry.verdicts && typeof entry.verdicts === "object" ? entry.verdicts : {};
    const durationMs = Math.max(0, Number(entry.duration_seconds || 0) * 1000);

    setMode(nextMode);
    setTextValue(nextMode === "TEXT" ? entry.input_value || "" : "");
    setUrlValue(nextMode === "URL" ? entry.input_value || "" : "");
    setSourceText(entry.source_text || entry.input_value || "");
    setClaims(savedClaims);
    setVerdicts(savedVerdicts);
    setAiScore(entry.ai_score || null);
    setDeepfakes(Array.isArray(entry.deepfakes) ? entry.deepfakes : []);
    setProgress({
      stage: entry.status === "complete" ? "complete" : "history",
      progress: entry.status === "complete" ? 1 : 0.95,
      claims_total: savedClaims.length,
      claims_done: Object.keys(savedVerdicts).length,
    });
    setFilter("All");
    setStartedAt(durationMs > 0 ? 1 : null);
    setCompletedAt(durationMs > 0 ? 1 + durationMs : null);
    setBonusFeature("ai");
    window.location.hash = "";
    setPage("app");
    setScreen("report");
  };

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (screen === "landing" && event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        void handleVerify();
      }

      if (screen === "report" && !event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        resetToLanding();
      }

      if (screen === "report" && !event.ctrlKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        window.print();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen, mode, textValue, urlValue]);

  const handleEvent = (event, runId) => {
    if (runId !== activeRunRef.current) {
      return;
    }

    eventHistoryRef.current = [...eventHistoryRef.current, event].slice(-200);
    window.__VERITAI_EVENTS__ = eventHistoryRef.current;

    if (event.event === "ai_score") {
      setAiScore(event.data);
      return;
    }

    if (event.event === "deepfake") {
      setDeepfakes((current) => {
        const exists = current.some((item) => item.image_url === event.data.image_url);
        return exists ? current : [...current, event.data];
      });
      return;
    }

    if (event.event === "claim") {
      setClaims((current) => {
        const exists = current.some((item) => item.id === event.data.id);
        return exists ? current : [...current, event.data];
      });
      return;
    }

    if (event.event === "verdict") {
      setVerdicts((current) => ({
        ...current,
        [event.data.claim_id]: event.data,
      }));
      return;
    }

    if (event.event === "status") {
      setProgress(event.data);
      if (event.data.stage === "complete") {
        setCompletedAt(performance.now());
        setIsVerifying(false);
        setScreen("report");
      }
      return;
    }

    if (event.event === "error") {
      addToast(event.data?.message || "Verification failed.", "error");
      setIsVerifying(false);
      setScreen("landing");
    }
  };

  const handlePreset = (label) => {
    const preset = PRESETS[label];
    if (!preset) {
      return;
    }

    setMode(preset.mode);
    setTextValue(preset.value);
    setUrlValue("");
  };

  const handleClaimSelect = (claimId) => {
    const target = document.getElementById(`claim-card-${claimId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleVerify = async () => {
    const trimmedText = textValue.trim();
    const trimmedUrl = urlValue.trim();
    const payload = {
      text: mode === "TEXT" ? trimmedText : "",
      url: mode === "URL" ? trimmedUrl : null,
    };

    if (!payload.text && !payload.url) {
      addToast("Enter text or a URL before starting verification.", "warning");
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    const controller = new AbortController();
    abortRef.current = controller;

    resetAnalysisState();
    setIsVerifying(true);
    setScreen("analysis");
    setStartedAt(performance.now());

    let displayText = payload.text;
    if (payload.url) {
      displayText = payload.url;
      try {
        const scrapeResponse = await fetch(
          `${API_BASE}/scrape?url=${encodeURIComponent(payload.url)}`,
          { signal: controller.signal },
        );
        if (scrapeResponse.ok) {
          const scraped = await scrapeResponse.json();
          if (scraped.text) {
            displayText = scraped.text;
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          addToast("URL preview unavailable. Continuing with live verification.", "warning");
        }
      }
    }
    setSourceText(displayText);

    let sawComplete = false;
    let sawError = false;

    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Verification request failed with status ${response.status}.`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const payloadText = normalizeEventChunk(chunk);
          if (!payloadText) {
            continue;
          }

          try {
            const event = JSON.parse(payloadText);
            if (event.event === "status" && event.data?.stage === "complete") {
              sawComplete = true;
            }
            if (event.event === "error") {
              sawError = true;
            }
            handleEvent(event, runId);
          } catch (error) {
            addToast("A streamed event could not be parsed.", "warning");
          }
        }
      }

      if (buffer.trim()) {
        const payloadText = normalizeEventChunk(buffer);
        if (payloadText) {
          const event = JSON.parse(payloadText);
          if (event.event === "status" && event.data?.stage === "complete") {
            sawComplete = true;
          }
          if (event.event === "error") {
            sawError = true;
          }
          handleEvent(event, runId);
        }
      }

      if (!controller.signal.aborted && !sawComplete && !sawError) {
        const hasVerdicts = Object.keys(verdictsRef.current).length > 0;
        if (hasVerdicts) {
          setScreen("report");
          setIsVerifying(false);
        } else {
          addToast("Verification ended before a complete event arrived.", "error");
          setScreen("landing");
          setIsVerifying(false);
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      addToast(error.message || "Verification failed.", "error");
      setIsVerifying(false);
      setScreen("landing");
    } finally {
      if (!controller.signal.aborted) {
        await fetchHistory();
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-main)]">
      <div className="pointer-events-none fixed inset-0 noise-overlay opacity-30" />
      <div className="scanlines pointer-events-none fixed inset-0 opacity-20" />
      <HistoryDropdown
        historyItems={historyItems}
        isLoading={historyLoading}
        onSelect={restoreHistoryEntry}
      />

      <AnimatePresence mode="wait">
        {page === "bonus" && (
          <motion.div
            key="bonus"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35 }}
          >
            <BonusScreen
              aiScore={aiScore}
              deepfakes={deepfakes}
              mode={mode}
              onBack={leaveBonusPage}
              onGoHome={goHomePage}
              onSelectFeature={openBonusFeature}
              selectedFeature={bonusFeature}
            />
          </motion.div>
        )}

        {page === "app" && screen === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35 }}
          >
            <LandingScreen
              activeValue={activeInput}
              isVerifying={isVerifying}
              mode={mode}
              presets={Object.keys(PRESETS)}
              textValue={textValue}
              urlValue={urlValue}
              onModeChange={setMode}
              onOpenBonusPage={openBonusFeature}
              onPresetSelect={handlePreset}
              onSubmit={handleVerify}
              onTextChange={setTextValue}
              onUrlChange={setUrlValue}
            />
          </motion.div>
        )}

        {page === "app" && screen === "analysis" && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35 }}
          >
            <AnalysisScreen
              aiScore={aiScore}
              claims={orderedClaims}
              deepfakes={deepfakes}
              mode={mode}
              progress={progress}
              sourceText={sourceText}
              verdicts={verdicts}
              onClaimSelect={handleClaimSelect}
            />
          </motion.div>
        )}

        {page === "app" && screen === "report" && (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35 }}
          >
            <ReportScreen
              accuracy={accuracy}
              aiScore={aiScore}
              claims={orderedClaims}
              deepfakes={deepfakes}
              durationSeconds={durationSeconds}
              filter={filter}
              filteredClaims={filteredClaims}
              progress={progress}
              sourceText={sourceText}
              verdictSummary={verdictSummary}
              verdicts={verdicts}
              onClaimSelect={handleClaimSelect}
              onExport={() => window.print()}
              onFilterChange={setFilter}
              onNewAnalysis={resetToLanding}
              onOpenBonusPage={openBonusFeature}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
