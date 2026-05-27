-- Client-side bridge
-- All notifications use the custom NUI toast system — no framework or ox_lib dependency

---@param message  string
---@param nType    string  'success'|'error'|'inform'|'warning'
function Notify(message, nType)
    SendNUIMessage({ action = 'notify', message = message, nType = nType or 'inform' })
end
