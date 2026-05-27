-- Client-side framework bridge
-- Provides Notify() and GetFrameworkPlayerName()

local Framework     = nil
local FrameworkName = nil

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

CreateThread(function()
    DetectFramework()
    if FrameworkName == 'esx' then
        Framework = exports['es_extended']:getSharedObject()
    elseif FrameworkName == 'qbcore' then
        Framework = exports['qb-core']:GetCoreObject()
    end
end)

---@param message  string
---@param nType    string  'success'|'error'|'inform'|'warning'
function Notify(message, nType)
    nType = nType or 'inform'

    -- ox_lib (works with all frameworks when installed)
    if GetResourceState('ox_lib') == 'started' then
        exports.ox_lib:notify({ title = 'Reports', description = message, type = nType })
        return
    end

    if FrameworkName == 'esx' and Framework then
        Framework.ShowNotification(message)
    elseif FrameworkName == 'qbcore' and Framework then
        Framework.Functions.Notify(message, nType, 4500)
    elseif FrameworkName == 'qbox' then
        exports.qbx_core:Notify(message, nType)
    else
        TriggerEvent('chat:addMessage', {
            args  = { '[Reports]', message },
            color = { 138, 92, 246 },
        })
    end
end
