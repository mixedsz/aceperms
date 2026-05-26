-- ─────────────────────────────────────────────────────────────────────────────
-- In-memory report store
-- Reports persist for the lifetime of the server session.
-- ─────────────────────────────────────────────────────────────────────────────
local Reports   = {}
local Counter   = 0
local Cooldowns = {}

local function NewID()
    Counter = Counter + 1
    return ('RPT-%04d'):format(Counter)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- /report — open submission UI
-- ─────────────────────────────────────────────────────────────────────────────
RegisterCommand(Config.Commands.user, function(source)
    local src  = tonumber(source)
    local now  = os.time()
    local last = Cooldowns[src]

    if last and (now - last) < Config.Cooldown then
        local remaining = Config.Cooldown - (now - last)
        NotifyPlayer(src, Config.Locale.report_cooldown:format(remaining), 'error')
        return
    end

    TriggerClientEvent('onyx_reports:openUserUI', src)
end, false)

-- ─────────────────────────────────────────────────────────────────────────────
-- /reports — open admin panel
-- ─────────────────────────────────────────────────────────────────────────────
RegisterCommand(Config.Commands.admin, function(source)
    local src = tonumber(source)

    if not IsAdmin(src) then
        NotifyPlayer(src, Config.Locale.not_authorized, 'error')
        return
    end

    local list = {}
    for _, r in pairs(Reports) do list[#list + 1] = r end
    TriggerClientEvent('onyx_reports:openAdminUI', src, list)
end, false)

-- ─────────────────────────────────────────────────────────────────────────────
-- Create report
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:createReport', function(data)
    local src = tonumber(source)

    if not data or not data.category or not data.description then return end

    if #data.description < 10 then
        NotifyPlayer(src, Config.Locale.desc_too_short, 'error')
        return
    end

    Cooldowns[src] = os.time()

    local id     = NewID()
    local name   = GetDisplayName(src)
    local report = {
        id           = id,
        source       = src,
        playerName   = name,
        category     = data.category,
        categoryLabel= data.categoryLabel or data.category,
        description  = data.description,
        targetName   = data.targetName or nil,
        status       = 'open',
        handledBy    = nil,
        closedBy     = nil,
        closeReason  = nil,
        playerOnline = true,
        createdAt    = os.time(),
        messages     = {},
    }

    Reports[id] = report

    NotifyPlayer(src, Config.Locale.report_submitted, 'success')
    NotifyAdmins(('New report [%s] from %s — %s'):format(id, name, report.categoryLabel), 'inform')

    -- Push to all open admin UIs
    TriggerClientEvent('onyx_reports:reportCreated', -1, report)

    if Config.DiscordWebhook ~= '' then
        SendToDiscord(report)
    end
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Handle (claim) report
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:handleReport', function(reportId)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report or report.status ~= 'open' then return end

    report.status        = 'active'
    report.handledBy     = GetDisplayName(src)
    report.handledBySrc  = src

    TriggerClientEvent('onyx_reports:reportUpdated', -1, report)

    if report.source and NetworkIsPlayerActive(report.source) then
        NotifyPlayer(report.source, Config.Locale.report_handled, 'inform')
    end
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Close report
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:closeReport', function(reportId, reason)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report or report.status == 'closed' then return end

    report.status      = 'closed'
    report.closedBy    = GetDisplayName(src)
    report.closeReason = reason or 'No reason provided'
    report.closedAt    = os.time()

    TriggerClientEvent('onyx_reports:reportUpdated', -1, report)

    if report.source and NetworkIsPlayerActive(report.source) then
        NotifyPlayer(report.source, Config.Locale.report_closed_msg:format(report.closeReason), 'inform')
    end
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin → Player message
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:sendMessage', function(reportId, message)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report or report.status == 'closed' then return end
    if not message or #message < 1 then return end

    local msgData = {
        sender     = GetDisplayName(src),
        senderType = 'admin',
        message    = message,
        timestamp  = os.time(),
    }

    table.insert(report.messages, msgData)
    TriggerClientEvent('onyx_reports:reportUpdated', -1, report)

    if report.source and NetworkIsPlayerActive(report.source) then
        TriggerClientEvent('onyx_reports:receiveMessage', report.source, reportId, msgData)
    end
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Player disconnect
-- ─────────────────────────────────────────────────────────────────────────────
AddEventHandler('playerDropped', function()
    local src = tonumber(source)
    for _, report in pairs(Reports) do
        if report.source == src then
            report.playerOnline = false
        end
    end
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Discord webhook helper
-- ─────────────────────────────────────────────────────────────────────────────
function SendToDiscord(report)
    local body = json.encode({
        embeds = {{
            title       = ('[%s] New Report — %s'):format(report.id, report.categoryLabel),
            description = report.description,
            color       = 9109504, -- purple
            fields      = {
                { name = 'Reporter',  value = report.playerName,  inline = true  },
                { name = 'Category',  value = report.categoryLabel, inline = true },
                { name = 'Server ID', value = tostring(report.source), inline = true },
            },
            footer    = { text = 'Onyx Reports' },
            timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
        }},
    })

    PerformHttpRequest(Config.DiscordWebhook,
        function() end, 'POST', body, { ['Content-Type'] = 'application/json' })
end
