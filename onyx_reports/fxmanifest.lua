fx_version 'cerulean'
game     'gta5'

name        'onyx_reports'
description 'Onyx Reports — Multi-Framework Report System (ESX / QBCore / Qbox)'
author      'Onyx Development'
version     '1.0.0'

lua54 'yes'

shared_scripts {
    'shared/config.lua',
}

client_scripts {
    'client/bridge.lua',
    'client/main.lua',
}

server_scripts {
    'server/bridge.lua',
    'server/main.lua',
}

ui_page 'web/index.html'

files {
    'web/index.html',
    'web/assets/css/style.css',
    'web/assets/js/app.js',
}
