-- =============================================
--   ColorSnap для AnkuLua
--   Следит за цветом в точке и кликает
-- =============================================

-- ===== НАСТРОЙТЕ ЭТИ ПАРАМЕТРЫ =====

local WATCH_X = 500       -- X точки наблюдения за цветом
local WATCH_Y = 800       -- Y точки наблюдения за цветом

local CLICK_X = 500       -- X куда кликать при изменении
local CLICK_Y = 1200      -- Y куда кликать при изменении

local TOLERANCE = 25      -- Чувствительность: 10=очень высокая, 50=низкая
local INTERVAL  = 0.2     -- Частота проверки в секундах (0.1 = очень быстро)

-- =======================================

local function getR(c) return bit32.band(bit32.rshift(c, 16), 0xFF) end
local function getG(c) return bit32.band(bit32.rshift(c, 8),  0xFF) end
local function getB(c) return bit32.band(c, 0xFF) end

local function colorChanged(c1, c2)
    local dr = math.abs(getR(c1) - getR(c2))
    local dg = math.abs(getG(c1) - getG(c2))
    local db = math.abs(getB(c1) - getB(c2))
    return (dr + dg + db) > TOLERANCE
end

-- Старт
toast("ColorSnap запущен! Слежу за точкой " .. WATCH_X .. "," .. WATCH_Y)

local lastColor = getColor(WATCH_X, WATCH_Y)
local count = 0

while true do
    local currentColor = getColor(WATCH_X, WATCH_Y)

    if colorChanged(lastColor, currentColor) then
        tap(CLICK_X, CLICK_Y)
        count = count + 1
        toast("Срабатывание #" .. count)
        lastColor = currentColor
        sleep(0.1) -- небольшая пауза после клика
    end

    sleep(INTERVAL)
end
