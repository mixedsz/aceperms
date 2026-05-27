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

local function IsPlayerConnected(src)
    return GetPlayerPing(tonumber(src)) >= 0
end

-- ─────────────────────────────────────────────────────────────────────────────
-- Character name — tries framework first, then oxmysql, then FiveM name
-- ─────────────────────────────────────────────────────────────────────────────
local function GetCharacterName(source, callback)
    local src      = tonumber(source)
    local fallback = GetPlayerName(src) or 'Unknown'

    local function trimmed(s)
        return s and s:gsub('^%s*(.-)%s*$', '%1') or ''
    end

    -- ESX — direct property access (per ESX docs: xPlayer.firstName / xPlayer.lastName)
    if FrameworkName == 'esx' and Framework then
        local xPlayer = Framework.GetPlayerFromId(src)
        if xPlayer then
            -- 1. Direct properties (ESX standard, documented)
            local fn = xPlayer.firstName
            local ln = xPlayer.lastName or ''
            if fn and fn ~= '' then
                callback(trimmed(fn .. ' ' .. ln))
                return
            end
            -- 2. variables table (set via xPlayer.set on server)
            if xPlayer.variables then
                local fn2 = xPlayer.variables.firstName
                local ln2 = xPlayer.variables.lastName or ''
                if fn2 and fn2 ~= '' then
                    callback(trimmed(fn2 .. ' ' .. ln2))
                    return
                end
            end
            -- 3. get() accessor fallback
            if xPlayer.get then
                local fn3 = xPlayer.get('firstName')
                local ln3 = xPlayer.get('lastName') or ''
                if fn3 and fn3 ~= '' then
                    callback(trimmed(fn3 .. ' ' .. ln3))
                    return
                end
            end
        end
    end

    -- QBCore
    if FrameworkName == 'qbcore' and Framework then
        local player = Framework.Functions.GetPlayer(src)
        if player and player.PlayerData.charinfo then
            local ci   = player.PlayerData.charinfo
            local name = trimmed((ci.firstname or '') .. ' ' .. (ci.lastname or ''))
            if #name > 1 then callback(name) return end
        end
    end

    -- Qbox
    if FrameworkName == 'qbox' then
        local ok, player = pcall(function() return exports.qbx_core:GetPlayer(src) end)
        if ok and player and player.PlayerData.charinfo then
            local ci   = player.PlayerData.charinfo
            local name = trimmed((ci.firstname or '') .. ' ' .. (ci.lastname or ''))
            if #name > 1 then callback(name) return end
        end
    end

    -- oxmysql fallback (optional — works when no framework returns a name)
    if GetResourceState('oxmysql') == 'started' then
        local license = nil
        for _, id in ipairs(GetPlayerIdentifiers(src)) do
            if id:sub(1, 8) == 'license:' then license = id break end
        end

        if license then
            exports.oxmysql:single(
                "SELECT CONCAT(COALESCE(firstname,''), ' ', COALESCE(lastname,'')) AS charname FROM users WHERE identifier = ? LIMIT 1",
                { license },
                function(result)
                    if result and result.charname and result.charname:match('%S') then
                        callback(trimmed(result.charname))
                    else
                        callback(fallback)
                    end
                end
            )
            return
        end
    end

    callback(fallback)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- Notify all online admins — fires a beautiful NUI toast (no focus taken)
-- ─────────────────────────────────────────────────────────────────────────────
local function NotifyAdminsNUI(reportId, playerName, category)
    for _, src in ipairs(GetPlayers()) do
        local pid = tonumber(src)
        if IsAdmin(pid) then
            TriggerClientEvent('onyx_reports:adminNotification', pid, {
                reportId   = reportId,
                playerName = playerName,
                category   = category,
            })
        end
    end
end

-- ─────────────────────────────────────────────────────────────────────────────
-- /report  — open panel (My Reports tab)
-- ─────────────────────────────────────────────────────────────────────────────
RegisterCommand(Config.Commands.user, function(source)
    local src = tonumber(source)
    local now = os.time()

    if Cooldowns[src] and (now - Cooldowns[src]) < Config.Cooldown then
        local rem = Config.Cooldown - (now - Cooldowns[src])
        NotifyPlayer(src, Config.Locale.report_cooldown:format(rem), 'error')
        return
    end

    local mine = {}
    for _, r in pairs(Reports) do
        if r.source == src then mine[#mine + 1] = r end
    end

    TriggerClientEvent('onyx_reports:openPanel', src, {
        isAdmin    = IsAdmin(src),
        defaultTab = 'my-reports',
        categories = Config.Categories,
        priorities = Config.Priorities,
        uiColor    = Config.UI.Color,
        myReports  = mine,
        reports    = IsAdmin(src) and ReportList() or nil,
    })
end, false)

-- ─────────────────────────────────────────────────────────────────────────────
-- /reports — open panel (Admin Panel tab)
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
        priorities = Config.Priorities,
        uiColor    = Config.UI.Color,
        reports    = ReportList(),
    })
end, false)

-- ─────────────────────────────────────────────────────────────────────────────
-- Create report
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:createReport', function(data)
    local src = tonumber(source)

    if not data or not data.category or not data.description then return end
    if #(data.description or '') < 1 then
        NotifyPlayer(src, Config.Locale.desc_too_short, 'error')
        return
    end

    Cooldowns[src] = os.time()
    local id = NewID()

    GetCharacterName(src, function(charName)
        local report = {
            id            = id,
            source        = src,
            playerName    = charName,
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

        -- NUI toast on all admin screens (no focus)
        NotifyAdminsNUI(id, charName, report.categoryLabel)

        -- Real-time list update (all clients get it for admin panels)
        TriggerClientEvent('onyx_reports:reportCreated', -1, report)
        -- Only the reporter gets it for their My Reports tab
        TriggerClientEvent('onyx_reports:yourReportCreated', src, report)

        if Config.DiscordWebhook ~= '' then
            SendToDiscord(report)
        end
    end)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Handle (claim) report  — action: 'goto' | 'bring'
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:handleReport', function(reportId, action)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report or report.status ~= 'open' then return end

    GetCharacterName(src, function(adminName)
        report.status       = 'active'
        report.handledBy    = adminName
        report.handledBySrc = src

        TriggerClientEvent('onyx_reports:reportUpdated', -1, report)

        if report.source and IsPlayerConnected(report.source) then
            NotifyPlayer(report.source, Config.Locale.report_handled, 'inform')
        end

        -- Teleportation
        if action == 'goto' then
            local ped = GetPlayerPed(report.source)
            if ped and ped ~= 0 then
                local c = GetEntityCoords(ped)
                TriggerClientEvent('onyx_reports:teleport', src, c.x, c.y, c.z)
            end
        elseif action == 'bring' then
            local ped = GetPlayerPed(src)
            if ped and ped ~= 0 then
                local c = GetEntityCoords(ped)
                if report.source and IsPlayerConnected(report.source) then
                    TriggerClientEvent('onyx_reports:teleport', report.source, c.x, c.y, c.z)
                end
            end
        end
    end)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Close / resolve report
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:closeReport', function(reportId, reason)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report or report.status == 'closed' then return end

    GetCharacterName(src, function(adminName)
        report.status      = 'closed'
        report.closedBy    = adminName
        report.closeReason = reason or 'No reason provided'
        report.closedAt    = os.time()

        TriggerClientEvent('onyx_reports:reportUpdated', -1, report)

        if report.source and IsPlayerConnected(report.source) then
            NotifyPlayer(report.source, Config.Locale.report_closed_msg:format(report.closeReason), 'inform')
        end
    end)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Send message to reporter
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:sendMessage', function(reportId, message)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report or report.status == 'closed' then return end
    if not message or #message < 1 then return end

    GetCharacterName(src, function(adminName)
        local msgData = {
            sender     = adminName,
            senderType = 'admin',
            message    = message,
            timestamp  = os.time(),
        }

        table.insert(report.messages, msgData)
        TriggerClientEvent('onyx_reports:reportUpdated', -1, report)

        if report.source and IsPlayerConnected(report.source) then
            TriggerClientEvent('onyx_reports:receiveMessage', report.source, reportId, msgData)
        end
    end)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin Note (internal only)
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:addAdminNote', function(reportId, note)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local report = Reports[reportId]
    if not report or not note or #note < 1 then return end

    GetCharacterName(src, function(adminName)
        table.insert(report.adminNotes, {
            sender    = adminName,
            message   = note,
            timestamp = os.time(),
        })
        TriggerClientEvent('onyx_reports:reportUpdated', -1, report)
    end)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Set priority / escalation level
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:setPriority', function(reportId, priority)
    local src    = tonumber(source)
    if not IsAdmin(src) then return end

    local valid = { normal = true, higher_up = true, management = true }
    if not valid[priority] then return end

    local report = Reports[reportId]
    if not report then return end

    report.priority = priority
    TriggerClientEvent('onyx_reports:reportUpdated', -1, report)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Delete report — removes from memory, fires reportDeleted to all clients
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:deleteReport', function(reportId)
    local src = tonumber(source)
    if not IsAdmin(src) then return end

    if not Reports[reportId] then return end
    Reports[reportId] = nil
    TriggerClientEvent('onyx_reports:reportDeleted', -1, reportId)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Player disconnect
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
                color       = 5793266,
                fields      = {
                    { name = 'Category',  value = report.categoryLabel,    inline = true },
                    { name = 'Reporter',  value = report.playerName,       inline = true },
                    { name = 'Server ID', value = tostring(report.source), inline = true },
                },
                footer    = { text = 'Onyx Reports' },
                timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
            }},
        }),
        { ['Content-Type'] = 'application/json' }
    )
end
