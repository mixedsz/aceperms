local UIOpen = false

-- ─────────────────────────────────────────────────────────────────────────────
-- Apply theme color as soon as resource starts (notifications need it too)
-- ─────────────────────────────────────────────────────────────────────────────
AddEventHandler('onClientResourceStart', function(res)
    if res ~= GetCurrentResourceName() then return end
    SendNUIMessage({ action = 'setThemeColor', color = Config.UI.Color })
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Open main panel
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:openPanel', function(data)
    UIOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action     = 'openPanel',
        isAdmin    = data.isAdmin,
        defaultTab = data.defaultTab,
        categories = data.categories,
        priorities = data.priorities,
        uiColor    = data.uiColor,
        reports    = data.reports,
        myReports  = data.myReports,
    })
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Real-time report updates
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:reportCreated', function(report)
    if not UIOpen then return end
    SendNUIMessage({ action = 'reportCreated', report = report })
end)

RegisterNetEvent('onyx_reports:yourReportCreated', function(report)
    if not UIOpen then return end
    SendNUIMessage({ action = 'yourReportCreated', report = report })
end)

RegisterNetEvent('onyx_reports:reportUpdated', function(report)
    if not UIOpen then return end
    SendNUIMessage({ action = 'reportUpdated', report = report })
end)

RegisterNetEvent('onyx_reports:reportDeleted', function(reportId)
    if not UIOpen then return end
    SendNUIMessage({ action = 'reportDeleted', reportId = reportId })
end)

RegisterNetEvent('onyx_reports:receiveMessage', function(reportId, msgData)
    if not UIOpen then
        -- Only notify when the player doesn't have /report open.
        -- When it is open the message appears live in the Chat tab via reportUpdated.
        Notify(Config.Locale.staff_message:format(msgData.sender, msgData.message), 'inform')
    end
end)

RegisterNetEvent('onyx_reports:notify', function(msg, nType)
    Notify(msg, nType)
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin notification toast — no NUI focus, appears over game world
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:adminNotification', function(data)
    SendNUIMessage({ action = 'adminNotification', data = data })
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- NUI Callbacks
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNUICallback('closeUI', function(_, cb)
    UIOpen = false
    SetNuiFocus(false, false)
    cb({ ok = true })
end)

RegisterNUICallback('submitReport', function(data, cb)
    TriggerServerEvent('onyx_reports:createReport', data)
    cb({ ok = true })
end)

RegisterNUICallback('claimReport', function(data, cb)
    TriggerServerEvent('onyx_reports:handleReport', data.reportId, data.action)
    cb({ ok = true })
end)

RegisterNetEvent('onyx_reports:teleport', function(x, y, z)
    SetEntityCoords(PlayerPedId(), x, y, z, false, false, false, false)
end)

RegisterNUICallback('closeReport', function(data, cb)
    TriggerServerEvent('onyx_reports:closeReport', data.reportId, data.reason)
    cb({ ok = true })
end)

RegisterNUICallback('sendMessage', function(data, cb)
    TriggerServerEvent('onyx_reports:sendMessage', data.reportId, data.message)
    cb({ ok = true })
end)

RegisterNUICallback('addAdminNote', function(data, cb)
    TriggerServerEvent('onyx_reports:addAdminNote', data.reportId, data.note)
    cb({ ok = true })
end)

RegisterNUICallback('setPriority', function(data, cb)
    TriggerServerEvent('onyx_reports:setPriority', data.reportId, data.priority)
    cb({ ok = true })
end)

RegisterNUICallback('deleteReport', function(data, cb)
    TriggerServerEvent('onyx_reports:deleteReport', data.reportId)
    cb({ ok = true })
end)

RegisterNUICallback('replyMessage', function(data, cb)
    TriggerServerEvent('onyx_reports:replyMessage', data.reportId, data.message)
    cb({ ok = true })
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- ESC to close panel
-- ─────────────────────────────────────────────────────────────────────────────
CreateThread(function()
    while true do
        Wait(0)
        if UIOpen and IsControlJustReleased(0, 200) then
            UIOpen = false
            SetNuiFocus(false, false)
            SendNUIMessage({ action = 'closeUI' })
        end
    end
end)
