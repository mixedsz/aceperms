-----------------------------------
--- Discord ACE Perms by Badger ---
---      server.lua (main)       ---
-----------------------------------

--- Utility: check if a value exists in a table
local function has_value(tab, val)
    for _, value in ipairs(tab) do
        if value == val then
            return true
        end
    end
    return false
end

--- Split a string by separator
function stringsplit(inputstr, sep)
    if sep == nil then sep = "%s" end
    local t = {}
    local i = 1
    for str in string.gmatch(inputstr, "([^" .. sep .. "]+)") do
        t[i] = str
        i = i + 1
    end
    return t
end

--- Extract all identifiers from a player source into a table
function ExtractIdentifiers(src)
    local identifiers = {
        steam   = "",
        ip      = "",
        discord = "",
        license = "",
        xbl     = "",
        live    = ""
    }
    for i = 0, GetNumPlayerIdentifiers(src) - 1 do
        local id = GetPlayerIdentifier(src, i)
        if string.find(id, "steam")   then identifiers.steam   = id
        elseif string.find(id, "ip")  then identifiers.ip      = id
        elseif string.find(id, "discord") then identifiers.discord = id
        elseif string.find(id, "license") then identifiers.license = id
        elseif string.find(id, "xbl") then identifiers.xbl     = id
        elseif string.find(id, "live") then identifiers.live   = id
        end
    end
    return identifiers
end

-- State tables
DiscordDetector  = {}
InDiscordDetector = {}
PermTracker      = {}
ROLE_CACHE       = {}
permThrottle     = {}

roleList         = Config.roleList
debugScript      = Config.DebugScript

-- Chat message helper
local prefix = '^9[^5lmx_discordAPI^9] ^3'
function sendMsg(src, msg)
    TriggerClientEvent('chatMessage', src, prefix .. msg)
end

-- Debug print helper
function sendDbug(msg, eventLocation)
    if debugScript then
        print("[lmx_discordAPI DEBUG] (" .. eventLocation .. ") " .. msg)
    end
end

--- Convert a flat list of role IDs into a lookup map for O(1) checks
function convertRolesToMap(roleIds)
    local roleMap = {}
    for i = 1, #roleIds do
        roleMap[tostring(roleIds[i])] = true
    end
    return roleMap
end

--- Core permission registration.
--- Queries lmx_discordAPI for the player's Discord roles, then maps those
--- roles against Config.roleList and grants the corresponding ACE groups.
function RegisterPermissions(src, eventLocation)
    local ids     = ExtractIdentifiers(src)
    local license = ids.license
    local discordRaw = ids.discord

    -- Guard: player must have a Discord identifier linked
    if not discordRaw or discordRaw == "" then
        sendDbug("No discord identifier for " .. tostring(GetPlayerName(src)), eventLocation)
        return false
    end

    local discord = discordRaw:gsub("discord:", "")

    sendDbug("Processing permissions for " .. GetPlayerName(src) .. " (discord:" .. discord .. ")", eventLocation)

    -- Clear any previously cached role data so we get a fresh fetch
    exports['lmx_discordAPI']:ClearCache(discord)

    -- Remove any permissions already tracked for this player (re-grant cleanly)
    if PermTracker[discord] ~= nil then
        local oldList = PermTracker[discord]
        for i = 1, #oldList do
            ExecuteCommand('remove_principal identifier.discord:' .. discord .. " " .. oldList[i])
            if Config.Print_Perm_Grants_And_Removals then
                print("[lmx_discordAPI] (" .. eventLocation .. ") Cleaned old perm " .. oldList[i] .. " for " .. GetPlayerName(src))
            end
        end
        PermTracker[discord] = nil
    end

    -- Fetch the player's current Discord role IDs via the API resource
    local roleIDs = exports.lmx_discordAPI:GetDiscordRoles(src)
    if not roleIDs then
        sendDbug(GetPlayerName(src) .. " – could not retrieve Discord roles.", eventLocation)
        return false
    end

    local ROLE_MAP  = convertRolesToMap(roleIDs)
    local permAdd   = "add_principal identifier.discord:" .. discord .. " "
    local granted   = {}

    sendDbug("Role count for " .. GetPlayerName(src) .. ": " .. tostring(#roleIDs), eventLocation)

    for i = 1, #roleList do
        local roleName   = roleList[i][1]   -- Discord role ID (number or string in config)
        local aceGroup   = roleList[i][2]   -- ACE group string e.g. "group.admin"

        -- Resolve the Discord numeric role ID (cached after first lookup)
        local discordRoleId
        if ROLE_CACHE[roleName] ~= nil then
            discordRoleId = ROLE_CACHE[roleName]
        else
            discordRoleId = exports.lmx_discordAPI:FetchRoleID(roleName)
            if discordRoleId ~= nil then
                ROLE_CACHE[roleName] = discordRoleId
            end
        end

        sendDbug(
            "Checking role " .. tostring(roleName) ..
            " (resolved: " .. tostring(discordRoleId) ..
            ") => " .. aceGroup ..
            " | Player: " .. GetPlayerName(src),
            eventLocation
        )

        if discordRoleId ~= nil and ROLE_MAP[tostring(discordRoleId)] ~= nil then
            -- Only grant each unique group once per player per session
            if not has_value(granted, aceGroup) then
                ExecuteCommand(permAdd .. aceGroup)
                table.insert(granted, aceGroup)

                if Config.Print_Perm_Grants_And_Removals then
                    print("[lmx_discordAPI] (" .. eventLocation .. ") Granted " ..
                        GetPlayerName(src) .. " => " .. aceGroup)
                end
            end
        end
    end

    -- Persist the granted list so we can clean up on disconnect
    PermTracker[discord] = granted

    sendDbug("Finished permission registration for " .. GetPlayerName(src), eventLocation)
    return true
end

--- playerConnecting – run permission check during connection handshake
AddEventHandler('playerConnecting', function(name, setKickReason, deferrals)
    local src     = source
    local ids     = ExtractIdentifiers(src)
    local license = ids.license
    local discord = ids.discord

    if discord and discord ~= "" then
        if not RegisterPermissions(src, 'playerConnecting') then
            if InDiscordDetector[license] == nil then
                InDiscordDetector[license] = true
                print("[lmx_discordAPI] " .. name .. " is not in the Discord or has no matching roles.")
            end
        else
            TriggerEvent('vMenu:RequestPermissions', src)
        end
    else
        if DiscordDetector[license] == nil then
            DiscordDetector[license] = true
            print('[lmx_discordAPI] Discord not linked for player ' .. name ..
                '. Ask them to open Discord before launching FiveM.')
        end
    end
end)

--- playerDropped – clean up all ACE principals for the leaving player
AddEventHandler('playerDropped', function(reason)
    local src     = source
    local ids     = ExtractIdentifiers(src)
    local license = ids.license
    local discord = (ids.discord ~= "") and ids.discord:gsub("discord:", "") or nil

    if discord and PermTracker[discord] ~= nil then
        local list = PermTracker[discord]
        for i = 1, #list do
            ExecuteCommand('remove_principal identifier.discord:' .. discord .. " " .. list[i])
            if Config.Print_Perm_Grants_And_Removals then
                print("[lmx_discordAPI] (playerDropped) Removed " ..
                    GetPlayerName(src) .. " from " .. list[i])
            end
        end
        PermTracker[discord] = nil
    end

    -- Clear state lookups
    DiscordDetector[license]   = nil
    InDiscordDetector[license] = nil
end)

--- /refreshPerms command – lets a player re-sync their roles without reconnecting
if Config.Allow_Refresh_Command then
    RegisterCommand('refreshPerms', function(src, args, rawCommand)
        if src == 0 then
            -- Console usage
            print("[lmx_discordAPI] refreshPerms cannot be run from the server console.")
            return
        end

        local discord = ExtractIdentifiers(src).discord
        if not discord or discord == "" then
            sendMsg(src, "^1ERR: Your Discord identifier was not found. Make sure Discord is open and restart FiveM.")
            return
        end

        local discordId = discord:gsub("discord:", "")

        if permThrottle[discordId] then
            sendMsg(src, "^1ERR: Cooldown active. You can refresh in ^3" .. permThrottle[discordId] .. "^1 seconds.")
            return
        end

        permThrottle[discordId] = Config.Refresh_Throttle
        sendMsg(src, "Refreshing your permissions... ^2Done!^3")
        RegisterPermissions(src, 'refreshPerms')
        TriggerEvent('vMenu:RequestPermissions', src)
    end, false)
end

--- Throttle ticker – decrements per-player cooldown counters every second
Citizen.CreateThread(function()
    while true do
        for discord, count in pairs(permThrottle) do
            permThrottle[discord] = count - 1
            if permThrottle[discord] <= 0 then
                permThrottle[discord] = nil
            end
        end
        Wait(1000)
    end
end)

--- Net event: client can request a permission refresh (e.g. from vMenu)
RegisterNetEvent('lmx_discordAPI:requestRefresh')
AddEventHandler('lmx_discordAPI:requestRefresh', function()
    local src = source
    RegisterPermissions(src, 'netEvent:requestRefresh')
    TriggerEvent('vMenu:RequestPermissions', src)
end)

print("[lmx_discordAPI] Server script loaded successfully.")
