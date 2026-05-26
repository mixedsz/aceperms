Config = {}

-- ┌──────────────────────────────────────────────────────────┐
-- │                    FRAMEWORK                             │
-- │  Supported: 'auto' | 'esx' | 'qbcore' | 'qbox'         │
-- │  'auto' detects the running framework automatically      │
-- └──────────────────────────────────────────────────────────┘
Config.Framework = 'auto'

-- ┌──────────────────────────────────────────────────────────┐
-- │                  ADMIN PERMISSIONS                       │
-- │                                                          │
-- │  UseAcePerms = false  → groups below are used           │
-- │  UseAcePerms = true   → ace permission node is used     │
-- │    add_principal identifier.steam:XXXXXX group.admin     │
-- │    add_ace group.admin reports.admin allow               │
-- └──────────────────────────────────────────────────────────┘
Config.UseAcePerms   = false
Config.AcePermission = 'reports.admin'

-- Groups that can access /reports (used when UseAcePerms = false)
-- Add or remove group names to match your server setup
Config.AdminGroups = {
    esx    = { 'admin', 'owner', 'support' },
    qbcore = { 'admin', 'owner', 'support' },
    qbox   = { 'admin', 'owner', 'support' },
}

-- ┌──────────────────────────────────────────────────────────┐
-- │                  REPORT CATEGORIES                       │
-- └──────────────────────────────────────────────────────────┘
Config.Categories = {
    {
        id              = 'player',
        label           = 'Player Report',
        icon            = '👤',
        description     = 'Report a player for breaking server rules',
        showPlayerField = true,
    },
    {
        id              = 'bug',
        label           = 'Bug Report',
        icon            = '🐛',
        description     = 'Report a bug, glitch or exploit',
        showPlayerField = false,
    },
    {
        id              = 'purchase',
        label           = 'Claim Purchase',
        icon            = '💳',
        description     = 'Claim a store purchase or donation reward',
        showPlayerField = false,
    },
    {
        id              = 'harassment',
        label           = 'Harassment',
        icon            = '⚠️',
        description     = 'Report harassment or toxic behaviour',
        showPlayerField = true,
    },
    {
        id              = 'cheating',
        label           = 'Cheating / Hacks',
        icon            = '🚫',
        description     = 'Report suspected cheating or exploiting',
        showPlayerField = true,
    },
    {
        id              = 'staff',
        label           = 'Staff Report',
        icon            = '🛡️',
        description     = 'Report misconduct by a staff member',
        showPlayerField = true,
    },
    {
        id              = 'other',
        label           = 'Other',
        icon            = '📝',
        description     = 'Any other issue not listed above',
        showPlayerField = false,
    },
}

-- ┌──────────────────────────────────────────────────────────┐
-- │                     COMMANDS                             │
-- └──────────────────────────────────────────────────────────┘
Config.Commands = {
    user  = 'report',   -- /report  — opens report submission UI
    admin = 'reports',  -- /reports — opens admin management panel
}

-- ┌──────────────────────────────────────────────────────────┐
-- │                  GENERAL SETTINGS                        │
-- └──────────────────────────────────────────────────────────┘

-- Seconds a player must wait between report submissions
Config.Cooldown = 120

-- Discord webhook URL for new-report pings (leave empty to disable)
Config.DiscordWebhook = ''

-- ┌──────────────────────────────────────────────────────────┐
-- │                     LOCALE                               │
-- └──────────────────────────────────────────────────────────┘
Config.Locale = {
    report_submitted  = 'Your report has been submitted. A staff member will assist you shortly.',
    report_cooldown   = 'Please wait %ds before submitting another report.',
    not_authorized    = 'You are not authorised to use this command.',
    desc_too_short    = 'Please provide more detail (minimum 10 characters).',
    staff_message     = 'Staff message from %s: %s',
    report_closed_msg = 'Your report has been closed. Reason: %s',
    report_handled    = 'A staff member has picked up your report.',
}
