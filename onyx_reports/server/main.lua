-- ─────────────────────────────────────────────────────────────────────────────
-- In-memory report store
-- ─────────────────────────────────────────────────────────────────────────────
local Reports   = {}
local Counter   = 0
local Cooldowns = {}

local function NewID()
    Counter = Counter + 1
    return ('RPT-%04d'):format(Counter)
end

local function ReportList()
    local t = {}
    for _, r in pairs(Reports) do t[#t + 1] = r end
    return t
end

-- ─────────────────────────────────────────────────────────────────────────────
-- /report  — opens the panel for a player (My Reports tab)
-- ─────────────────────────────────────────────────────────────────────────────
RegisterCommand(Config.Commands.user, function(source)
    local src = tonumber(source)
    local now = os.time()

    if Cooldowns[src] and (now - Cooldowns[src]) < Config.Cooldown then
        local rem = Config.Cooldown - (now - Cooldowns[src])
        NotifyPlayer(src, Config.Locale.report_cooldown:format(rem), 'error')
        return
    end

    -- Collect this player's own reports
    local mine = {}
    for _, r in pairs(Reports) do
        if r.source == src then mine[#mine + 1] = r end
    end

    TriggerClientEvent('onyx_reports:openPanel', src, {
        isAdmin    = IsAdmin(src),
        defaultTab = 'my-reports',
        categories = Config.Categories,
        myReports  = mine,
        reports    = IsAdmin(src) and ReportList() or nil,
    })
end, false)

-- ─────────────────────────────────────────────────────────────────────────────
-- /reports — opens the panel for admins (Admin Panel tab)
-- ─────────────────────────────────────────────────────────────────────────────
RegisterCommand(Config.Commands.admin, function(source)
    local src = tonumber(source)

    if not IsAdmin(src) then
        NotifyPlayer(src, Config.Locale.not_authorized, 'error')
        return
    end

    TriggerClientEvent('onyx_reports:openPanel', src, {
        isAdmin    = true,
        defaultTab = 'admin',
        categories = Config.Categories,
        reports    = ReportList(),
    })
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
        id            = id,
        source        = src,
        playerName    = name,
        category      = data.category,
        categoryLabel = data.categoryLabel or data.category,
        description   = data.description,
        targetName    = data.targetName or nil,
        priority      = 'normal',
        status        = 'open',
        handledBy     = nil,
        closedBy      = nil,
        closeReason   = nil,
        closedAt      = nil,
        playerOnline  = true,
        createdAt     = os.time(),
        messages      = {},
        adminNotes    = {},
    }

    Reports[id] = report

    NotifyPlayer(src, Config.Locale.report_submitted, 'success')
    NotifyAdmins(('New %s report [%s] from %s'):format(report.categoryLabel, id, name), 'inform')

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

    report.status       = 'active'
    report.handledBy    = GetDisplayName(src)
    report.handledBySrc = src

    TriggerClientEvent('onyx_reports:reportUpdated', -1, report)

    if report.source and NetworkIsPlayerActive(report.source) then
        NotifyPlayer(report.source, Config.Locale.report_handled, 'inform')
    end
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Close / resolve report
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
-- Admin → Player chat message
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
-- Admin Note (internal only, never shown to reporter)
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:addAdminNote', function(reportId, note)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report then return end
    if not note or #note < 1 then return end

    local noteData = {
        sender    = GetDisplayName(src),
        message   = note,
        timestamp = os.time(),
    }

    table.insert(report.adminNotes, noteData)
    TriggerClientEvent('onyx_reports:reportUpdated', -1, report)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Set priority
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:setPriority', function(reportId, priority)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local valid = { low = true, normal = true, high = true, urgent = true }
    if not valid[priority] then return end

    local report = Reports[reportId]
    if not report then return end

    report.priority = priority
    TriggerClientEvent('onyx_reports:reportUpdated', -1, report)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Player disconnect — mark reports as offline
-- ─────────────────────────────────────────────────────────────────────────────
AddEventHandler('playerDropped', function()
    local src = tonumber(source)
    for _, report in pairs(Reports) do
        if report.source == src then report.playerOnline = false end
    end
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Discord webhook
-- ─────────────────────────────────────────────────────────────────────────────
function SendToDiscord(report)
    PerformHttpRequest(Config.DiscordWebhook, function() end, 'POST',
        json.encode({
            embeds = {{
                title       = ('[%s] %s — %s'):format(report.id, report.categoryLabel, report.playerName),
                description = report.description,
                color       = 9109504,
                fields      = {
                    { name = 'Category',  value = report.categoryLabel,     inline = true },
                    { name = 'Reporter',  value = report.playerName,        inline = true },
                    { name = 'Server ID', value = tostring(report.source),  inline = true },
                },
                footer    = { text = 'Onyx Reports' },
                timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
            }},
        }),
        { ['Content-Type'] = 'application/json' }
    )
end
