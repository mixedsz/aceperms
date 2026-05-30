-- Server-side framework bridge
-- Provides IsAdmin(), NotifyPlayer(), NotifyAdmins()

-- Must be globals so server/main.lua (GetCharacterName) can read them
Framework     = nil
FrameworkName = nil

local function DetectFramework()
    if Config.Framework ~= 'auto' then
        FrameworkName = Config.Framework
        return
    end
    if GetResourceState('qbx_core') == 'started' then
        FrameworkName = 'qbox'
    elseif GetResourceState('qb-core') == 'started' then
        FrameworkName = 'qbcore'
    elseif GetResourceState('es_extended') == 'started' then
        FrameworkName = 'esx'
    end
end

-- Run immediately and also on restart
DetectFramework()
if FrameworkName == 'esx' then
    Framework = exports['es_extended']:getSharedObject()
elseif FrameworkName == 'qbcore' then
    Framework = exports['qb-core']:GetCoreObject()
end

AddEventHandler('onResourceStart', function(res)
    if res ~= GetCurrentResourceName() then return end
    DetectFramework()
    if FrameworkName == 'esx' then
        Framework = exports['es_extended']:getSharedObject()
    elseif FrameworkName == 'qbcore' then
        Framework = exports['qb-core']:GetCoreObject()
    end
end)

---@param source number
---@return boolean
function IsAdmin(source)
    local src = tostring(source)

    -- Optional ace permission check
    if Config.UseAcePerms then
        return IsPlayerAceAllowed(src, Config.AcePermission)
    end

    -- Group / job-based check
    local groups = Config.AdminGroups

    if FrameworkName == 'esx' and Framework then
        local xPlayer = Framework.GetPlayerFromId(tonumber(source))
        if not xPlayer then return false end
        local group = xPlayer.getGroup()
        for _, g in ipairs(groups.esx) do
            if group == g then return true end
        end

    elseif FrameworkName == 'qbcore' and Framework then
        local player = Framework.Functions.GetPlayer(tonumber(source))
        if not player then return false end
        local job = player.PlayerData.job.name
        for _, g in ipairs(groups.qbcore) do
            if job == g then return true end
        end

    elseif FrameworkName == 'qbox' then
        local player = exports.qbx_core:GetPlayer(tonumber(source))
        if not player then return false end
        local job = player.PlayerData.job.name
        for _, g in ipairs(groups.qbox) do
            if job == g then return true end
        end
    end

    return false
end

---@param source number
---@return string
function GetDisplayName(source)
    return GetPlayerName(tonumber(source)) or 'Unknown'
end

---@param source  number
---@param message string
---@param nType   string
function NotifyPlayer(source, message, nType)
    TriggerClientEvent('onyx_reports:notify', tonumber(source), message, nType or 'inform')
end

function NotifyAdmins(message, nType)
    for _, src in ipairs(GetPlayers()) do
        if IsAdmin(tonumber(src)) then
            TriggerClientEvent('onyx_reports:notify', tonumber(src), message, nType or 'inform')
        end
    end
end
