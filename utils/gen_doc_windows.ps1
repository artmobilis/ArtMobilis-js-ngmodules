# Get the path of the current script
$script_path = split-path -parent $MyInvocation.MyCommand.Definition
Push-Location $script_path/..


jsdoc modules -r -d doc -t ./node_modules/ink-docstrap/template


Pop-Location