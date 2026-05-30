Config = {}

-- ┌──────────────────────────────────────────────────────────┐
-- │                    FRAMEWORK                             │
-- │  Supported: 'auto' | 'esx' | 'qbcore' | 'qbox'         │
-- └──────────────────────────────────────────────────────────┘
Config.Framework = 'auto'

-- ┌──────────────────────────────────────────────────────────┐
-- │                   UI / THEME                             │
-- │  Color is a hex value — ALL accent colors derive from it │
-- │  No purple is hardcoded anywhere else in the UI          │
-- └──────────────────────────────────────────────────────────┘
Config.UI = {
    Color = '#5865f2',  -- change to any hex color you like
}

-- ┌──────────────────────────────────────────────────────────┐
-- │                  ADMIN PERMISSIONS                       │
-- │  UseAcePerms = false  → groups below are used           │
-- │  UseAcePerms = true   → ace permission node is used     │
-- └──────────────────────────────────────────────────────────┘
Config.UseAcePerms   = false
Config.AcePermission = 'reports.admin'

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
        icon            = 'user',
        description     = 'Report a player for breaking server rules',
        showPlayerField = true,
    },
    {
        id              = 'bug',
        label           = 'Bug Report',
        icon            = 'bug',
        description     = 'Report a bug, glitch or exploit',
        showPlayerField = false,
    },
    {
        id              = 'purchase',
        label           = 'Claim Purchase',
        icon            = 'card',
        description     = 'Claim a store purchase or donation reward',
        showPlayerField = false,
    },
    {
        id              = 'tos',
        label           = 'TOS Report',
        icon            = 'file',
        description     = 'Report a violation of the Terms of Service',
        showPlayerField = true,
    },
    {
        id              = 'cheating',
        label           = 'Cheating / Hacks',
        icon            = 'ban',
        description     = 'Report suspected cheating or exploiting',
        showPlayerField = true,
    },
    {
        id              = 'staff',
        label           = 'Staff Report',
        icon            = 'shield',
        description     = 'Report misconduct by a staff member',
        showPlayerField = true,
    },
    {
        id              = 'other',
        label           = 'Other',
        icon            = 'edit',
        description     = 'Any other issue not listed above',
        showPlayerField = false,
    },
}

-- ┌──────────────────────────────────────────────────────────┐
-- │               ESCALATION / PRIORITY LEVELS               │
-- │  Admins can escalate a report to notify higher staff     │
-- └──────────────────────────────────────────────────────────┘
Config.Priorities = {
    { id = 'normal',     label = 'Normal',            color = 'normal'     },
    { id = 'higher_up',  label = 'Need a Higher Up',  color = 'higher_up'  },
    { id = 'management', label = 'Need Management',   color = 'management' },
}

-- ┌──────────────────────────────────────────────────────────┐
-- │                     COMMANDS                             │
-- └──────────────────────────────────────────────────────────┘
Config.Commands = {
    user  = 'report',
    admin = 'reports',
}

-- ┌──────────────────────────────────────────────────────────┐
-- │                  GENERAL SETTINGS                        │
-- └──────────────────────────────────────────────────────────┘
Config.Cooldown       = 120
Config.DiscordWebhook = ''

-- ┌──────────────────────────────────────────────────────────┐
-- │                     LOCALE                               │
-- └──────────────────────────────────────────────────────────┘
Config.Locale = {
    report_submitted  = 'Your report has been submitted. A staff member will assist you shortly.',
    report_cooldown   = 'Please wait %ds before submitting another report.',
    not_authorized    = 'You are not authorised to use this command.',
    desc_too_short    = 'Please provide a description.',
    staff_message     = 'Staff message from %s: %s',
    report_closed_msg = 'Your report has been resolved. Reason: %s',
    report_handled    = 'A staff member has picked up your report.',
}
