local UIOpen = false

-- ─────────────────────────────────────────────────────────────────────────────
-- Server → Client : open the main panel
-- ─────────────────────────────────────────────────────────────────────────────
RegisterNetEvent('onyx_reports:openPanel', function(data)
    UIOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action     = 'openPanel',
        isAdmin    = data.isAdmin,
        defaultTab = data.defaultTab,
        categories = data.categories,
        reports    = data.reports,
        myReports  = data.myReports,
    })
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- Real-time pushes from server
-- ─────────────────────────────────────────────────────────────────────────────
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

RegisterNUICallback('addAdminNote', function(data, cb)
    TriggerServerEvent('onyx_reports:addAdminNote', data.reportId, data.note)
    cb({ ok = true })
end)

RegisterNUICallback('setPriority', function(data, cb)
    TriggerServerEvent('onyx_reports:setPriority', data.reportId, data.priority)
    cb({ ok = true })
end)

-- ─────────────────────────────────────────────────────────────────────────────
-- ESC to close
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
