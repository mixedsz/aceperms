local UIOpen = false

-- ─────────────────────────────────────────────────────────────────────────────
-- Server → Client events
-- ─────────────────────────────────────────────────────────────────────────────

RegisterNetEvent('onyx_reports:openUserUI', function()
    UIOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action     = 'openUserReport',
        categories = Config.Categories,
    })
end)

RegisterNetEvent('onyx_reports:openAdminUI', function(reports)
    UIOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action  = 'openAdminPanel',
        reports = reports,
    })
end)

RegisterNetEvent('onyx_reports:reportCreated', function(report)
    if not UIOpen then return end
    SendNUIMessage({ action = 'reportCreated', report = report })
end)

RegisterNetEvent('onyx_reports:reportUpdated', function(report)
    if not UIOpen then return end
    SendNUIMessage({ action = 'reportUpdated', report = report })
end)

RegisterNetEvent('onyx_reports:receiveMessage', function(reportId, msgData)
    if UIOpen then
        SendNUIMessage({ action = 'receiveMessage', reportId = reportId, message = msgData })
    end
    Notify(Config.Locale.staff_message:format(msgData.sender, msgData.message), 'inform')
end)

RegisterNetEvent('onyx_reports:notify', function(msg, nType)
    Notify(msg, nType)
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
    UIOpen = false
    SetNuiFocus(false, false)
    cb({ ok = true })
end)

RegisterNUICallback('handleReport', function(data, cb)
    TriggerServerEvent('onyx_reports:handleReport', data.reportId)
    cb({ ok = true })
end)

RegisterNUICallback('closeReport', function(data, cb)
    TriggerServerEvent('onyx_reports:closeReport', data.reportId, data.reason)
    cb({ ok = true })
end)

RegisterNUICallback('sendMessage', function(data, cb)
    TriggerServerEvent('onyx_reports:sendMessage', data.reportId, data.message)
    cb({ ok = true })
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- ESC key closes UI
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
