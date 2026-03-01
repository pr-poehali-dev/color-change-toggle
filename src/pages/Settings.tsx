import Icon from "@/components/ui/icon";

interface Props {
  sensitivity: number;
  speed: number;
  onSensitivity: (v: number) => void;
  onSpeed: (v: number) => void;
  onBack: () => void;
}

const SENSITIVITY_LEVELS = [
  { value: 10, label: "Очень высокая", desc: "Реагирует на малейшие изменения" },
  { value: 30, label: "Высокая", desc: "Оптимально для большинства задач" },
  { value: 60, label: "Средняя", desc: "Только заметные изменения" },
  { value: 100, label: "Низкая", desc: "Только резкие изменения" },
];

const SPEED_PRESETS = [
  { value: 50, label: "50мс", desc: "Молниеносно" },
  { value: 200, label: "200мс", desc: "Быстро" },
  { value: 500, label: "500мс", desc: "Нормально" },
  { value: 1000, label: "1сек", desc: "Медленно" },
];

export default function Settings({ sensitivity, speed, onSensitivity, onSpeed, onBack }: Props) {
  const getSensLabel = () => {
    const found = SENSITIVITY_LEVELS.find((l) => l.value === sensitivity);
    return found?.label ?? "Пользовательская";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col select-none">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-5 pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <Icon name="ArrowLeft" size={18} className="text-foreground" />
        </button>
        <div>
          <h1 className="font-bold text-lg text-foreground leading-tight">Настройки</h1>
          <p className="text-xs text-muted-foreground">Датчик цвета</p>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-8">

        {/* Sensitivity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(var(--neon) / 0.15)" }}
              >
                <Icon name="Gauge" size={14} className="text-[hsl(var(--neon))]" />
              </div>
              <span className="font-semibold text-sm text-foreground">Чувствительность</span>
            </div>
            <span
              className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: "hsl(var(--neon) / 0.15)", color: "hsl(var(--neon))" }}
            >
              {getSensLabel()}
            </span>
          </div>

          {/* Slider */}
          <div className="mb-4 px-1">
            <input
              type="range"
              min={5}
              max={150}
              value={sensitivity}
              onChange={(e) => onSensitivity(Number(e.target.value))}
              className="slider-neon"
              style={{
                background: `linear-gradient(to right, hsl(var(--neon)) ${((sensitivity - 5) / 145) * 100}%, hsl(var(--border)) ${((sensitivity - 5) / 145) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Высокая</span>
              <span className="text-xs font-mono text-muted-foreground">{sensitivity}</span>
              <span className="text-xs text-muted-foreground">Низкая</span>
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 gap-2">
            {SENSITIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => onSensitivity(level.value)}
                className="text-left px-3 py-3 rounded-xl transition-all"
                style={
                  sensitivity === level.value
                    ? {
                        background: "hsl(var(--neon) / 0.12)",
                        border: "1.5px solid hsl(var(--neon) / 0.5)",
                        color: "hsl(var(--foreground))",
                      }
                    : {
                        background: "hsl(var(--card))",
                        border: "1.5px solid hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                      }
                }
              >
                <div className="font-semibold text-sm">{level.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{level.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <div style={{ height: "1px", background: "hsl(var(--border))" }} />

        {/* Speed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(160 80% 50% / 0.15)" }}
              >
                <Icon name="Timer" size={14} className="text-[hsl(var(--neon))]" />
              </div>
              <span className="font-semibold text-sm text-foreground">Скорость срабатывания</span>
            </div>
            <span
              className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: "hsl(var(--neon) / 0.15)", color: "hsl(var(--neon))" }}
            >
              {speed}мс
            </span>
          </div>

          {/* Slider */}
          <div className="mb-4 px-1">
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={speed}
              onChange={(e) => onSpeed(Number(e.target.value))}
              className="slider-neon"
              style={{
                background: `linear-gradient(to right, hsl(var(--neon)) ${((speed - 50) / 1950) * 100}%, hsl(var(--border)) ${((speed - 50) / 1950) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">Быстрее</span>
              <span className="text-xs font-mono text-muted-foreground">{speed}мс</span>
              <span className="text-xs text-muted-foreground">Медленнее</span>
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-2">
            {SPEED_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => onSpeed(preset.value)}
                className="text-center px-2 py-3 rounded-xl transition-all"
                style={
                  speed === preset.value
                    ? {
                        background: "hsl(var(--neon) / 0.12)",
                        border: "1.5px solid hsl(var(--neon) / 0.5)",
                      }
                    : {
                        background: "hsl(var(--card))",
                        border: "1.5px solid hsl(var(--border))",
                      }
                }
              >
                <div className="font-bold text-sm text-foreground">{preset.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{preset.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <div style={{ height: "1px", background: "hsl(var(--border))" }} />

        {/* Info card */}
        <div
          className="rounded-xl p-4 flex gap-3"
          style={{ background: "hsl(var(--neon) / 0.06)", border: "1px solid hsl(var(--neon) / 0.2)" }}
        >
          <Icon name="Info" size={16} className="text-[hsl(var(--neon))] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Как это работает</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Датчик сравнивает цвет в выбранной зоне каждые {speed}мс. Если изменение больше {sensitivity} единиц — срабатывает триггер. Передвигайте и изменяйте размер зоны прямо на главном экране.
            </p>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: "hsl(var(--neon))",
            color: "#0a1a12",
            boxShadow: "0 4px 20px rgba(var(--neon-rgb), 0.35)",
          }}
        >
          Сохранить и вернуться
        </button>
      </div>
    </div>
  );
}
