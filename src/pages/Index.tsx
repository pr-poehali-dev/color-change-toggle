import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import SettingsPage from "./Settings";

interface ColorSample {
  r: number;
  g: number;
  b: number;
  hex: string;
  time: number;
}

const rgbToHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

const colorDistance = (a: ColorSample, b: ColorSample) =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);

const getLuminance = (r: number, g: number, b: number) =>
  (0.299 * r + 0.587 * g + 0.114 * b) / 255;

export default function Index() {
  const [page, setPage] = useState<"home" | "settings">("home");
  const [enabled, setEnabled] = useState(false);
  const [currentColor, setCurrentColor] = useState<ColorSample | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);
  const [sensitivity, setSensitivity] = useState(30);
  const [speed, setSpeed] = useState(200);
  const [zone, setZone] = useState({ x: 30, y: 30, w: 40, h: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [log, setLog] = useState<{ color: string; time: string }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevColorRef = useRef<ColorSample | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      console.warn("Камера недоступна, симуляция цвета");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const sampleColor = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    let r = 0, g = 0, b = 0;

    if (video && video.readyState >= 2 && canvas) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const x = Math.floor((zone.x / 100) * canvas.width);
      const y = Math.floor((zone.y / 100) * canvas.height);
      const w = Math.floor((zone.w / 100) * canvas.width);
      const h = Math.floor((zone.h / 100) * canvas.height);
      const data = ctx.getImageData(x, y, Math.max(w, 1), Math.max(h, 1)).data;

      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; total++;
      }
      if (total > 0) { r = Math.round(r / total); g = Math.round(g / total); b = Math.round(b / total); }
    } else {
      const t = Date.now() / 3000;
      r = Math.round(127 + 100 * Math.sin(t));
      g = Math.round(127 + 100 * Math.sin(t + 2));
      b = Math.round(127 + 100 * Math.sin(t + 4));
    }

    const sample: ColorSample = { r, g, b, hex: rgbToHex(r, g, b), time: Date.now() };
    const prev = prevColorRef.current;

    if (prev) {
      const dist = colorDistance(prev, sample);
      if (dist > sensitivity) {
        setTriggered(true);
        setTriggerCount((c) => c + 1);
        setLog((l) => [
          { color: sample.hex, time: new Date().toLocaleTimeString() },
          ...l.slice(0, 9),
        ]);
        if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current);
        triggerTimeoutRef.current = setTimeout(() => setTriggered(false), 800);
      }
    }
    prevColorRef.current = sample;
    setCurrentColor(sample);
  }, [zone, sensitivity]);

  useEffect(() => {
    if (enabled) {
      startCamera();
      intervalRef.current = setInterval(sampleColor, speed);
    } else {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
      prevColorRef.current = null;
      setCurrentColor(null);
      setTriggered(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(sampleColor, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [speed, sampleColor]);

  const handleZoneMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const parent = e.currentTarget.parentElement;
    if (!parent) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (zone.x / 100) * parent.clientWidth,
      y: e.clientY - (zone.y / 100) * parent.clientHeight,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, w: zone.w, h: zone.h });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (isDragging) {
      const nx = ((e.clientX - dragStart.x) / rect.width) * 100;
      const ny = ((e.clientY - dragStart.y) / rect.height) * 100;
      setZone((z) => ({
        ...z,
        x: Math.max(0, Math.min(100 - z.w, nx)),
        y: Math.max(0, Math.min(100 - z.h, ny)),
      }));
    }
    if (isResizing) {
      const dx = ((e.clientX - resizeStart.x) / rect.width) * 100;
      const dy = ((e.clientY - resizeStart.y) / rect.height) * 100;
      setZone((z) => ({
        ...z,
        w: Math.max(5, Math.min(90, resizeStart.w + dx)),
        h: Math.max(5, Math.min(90, resizeStart.h + dy)),
      }));
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const lum = currentColor ? getLuminance(currentColor.r, currentColor.g, currentColor.b) : 0.5;
  const textOnColor = lum > 0.5 ? "#0a0f14" : "#f0f4f8";

  if (page === "settings") {
    return (
      <SettingsPage
        sensitivity={sensitivity}
        speed={speed}
        onSensitivity={setSensitivity}
        onSpeed={setSpeed}
        onBack={() => setPage("home")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col select-none overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--neon) / 0.15)", border: "1px solid hsl(var(--neon) / 0.3)" }}
          >
            <Icon name="Scan" size={16} className="text-[hsl(var(--neon))]" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">ColorSnap</span>
        </div>
        <button
          onClick={() => setPage("settings")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <Icon name="Settings2" size={18} className="text-muted-foreground" />
        </button>
      </header>

      {/* Main zone */}
      <div
        ref={containerRef}
        className="relative mx-4 rounded-2xl overflow-hidden flex-1 min-h-[300px] max-h-[420px]"
        style={{
          background: currentColor && enabled
            ? `rgb(${currentColor.r},${currentColor.g},${currentColor.b})`
            : "hsl(var(--card))",
          border: triggered
            ? "2px solid hsl(var(--neon))"
            : "2px solid hsl(var(--border))",
          transition: enabled ? `background ${speed}ms ease, border-color 0.3s` : "none",
          boxShadow: triggered
            ? "0 0 32px rgba(var(--neon-rgb), 0.4), inset 0 0 20px rgba(var(--neon-rgb), 0.08)"
            : "none",
        }}
      >
        {/* Scan line */}
        {enabled && (
          <div
            className="absolute left-0 right-0 h-px pointer-events-none animate-scan z-10"
            style={{ background: "hsl(var(--neon) / 0.4)" }}
          />
        )}

        {/* Center info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none z-20">
          {!enabled && (
            <div className="text-center animate-fade-up">
              <div className="text-5xl mb-3">🎨</div>
              <p className="text-muted-foreground text-sm font-medium">Нажмите кнопку для запуска</p>
            </div>
          )}
          {enabled && currentColor && (
            <div className="text-center animate-fade-up">
              <div
                className="text-3xl font-bold tracking-widest mb-1 font-mono px-4 py-2 rounded-xl"
                style={{
                  color: textOnColor,
                  background: "rgba(0,0,0,0.25)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {currentColor.hex}
              </div>
              <div
                className="text-xs font-medium opacity-80 mt-1"
                style={{ color: textOnColor }}
              >
                RGB ({currentColor.r}, {currentColor.g}, {currentColor.b})
              </div>
            </div>
          )}
          {enabled && !currentColor && (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: "hsl(var(--neon))", borderTopColor: "transparent" }}
              />
              <p className="text-muted-foreground text-sm">Инициализация...</p>
            </div>
          )}
        </div>

        {/* Draggable selection zone */}
        <div
          className={`absolute selection-zone rounded-xl z-30 ${enabled ? "active" : ""}`}
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.w}%`,
            height: `${zone.h}%`,
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleZoneMouseDown}
        >
          <div
            className="absolute top-1 left-2 text-xs font-semibold px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(0,0,0,0.7)", color: "hsl(var(--neon))", fontSize: "9px", letterSpacing: "0.1em" }}
          >
            ЗОНА
          </div>
          <div
            className="absolute bottom-0.5 right-0.5 w-5 h-5 flex items-center justify-center cursor-se-resize rounded-md"
            style={{ background: "hsl(var(--neon) / 0.2)" }}
            onMouseDown={handleResizeMouseDown}
          >
            <Icon name="Maximize2" size={10} className="text-[hsl(var(--neon))]" />
          </div>
          {([[0, 0], [1, 0], [0, 1], [1, 1]] as [number, number][]).map(([cx, cy], i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: cx === 0 ? "-5px" : "calc(100% - 5px)",
                top: cy === 0 ? "-5px" : "calc(100% - 5px)",
                background: "hsl(var(--neon))",
                boxShadow: "0 0 6px rgba(var(--neon-rgb),0.8)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mx-4 mt-3">
        {[
          { label: "Срабатываний", value: triggerCount, accent: false },
          { label: "Чувствит.", value: sensitivity, accent: true },
          { label: "Скорость", value: `${speed}мс`, accent: false },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className="flex-1 rounded-xl px-4 py-3"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div className="text-xs text-muted-foreground mb-0.5 truncate">{label}</div>
            <div
              className="text-xl font-bold"
              style={{ color: accent ? "hsl(var(--neon))" : "hsl(var(--foreground))" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div
          className="mx-4 mt-3 rounded-xl overflow-hidden"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div
            className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            История изменений
          </div>
          {log.slice(0, 4).map((entry, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: entry.color }} />
              <span className="text-sm font-mono text-foreground">{entry.color}</span>
              <span className="text-xs text-muted-foreground ml-auto">{entry.time}</span>
            </div>
          ))}
        </div>
      )}

      <div className="h-32" />

      {/* FAB */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setEnabled((e) => !e)}
          className={`fab-btn flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 ${enabled ? "animate-glow" : ""}`}
          style={
            enabled
              ? {
                  background: "hsl(var(--neon))",
                  color: "#0a1a12",
                  border: "2px solid hsl(var(--neon))",
                  boxShadow: "0 8px 32px rgba(var(--neon-rgb), 0.45)",
                }
              : {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  border: "2px solid hsl(var(--border))",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                }
          }
        >
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: enabled ? "#0a1a12" : "hsl(var(--muted-foreground))",
              boxShadow: enabled ? "0 0 8px rgba(0,0,0,0.5)" : "none",
              animation: enabled ? "pulse-ring 1.5s ease-in-out infinite" : "none",
            }}
          />
          {enabled ? "Остановить" : "Запустить"}
          <Icon
            name={enabled ? "Square" : "Play"}
            size={16}
            style={{ color: enabled ? "#0a1a12" : "hsl(var(--muted-foreground))" }}
          />
        </button>
      </div>
    </div>
  );
}
