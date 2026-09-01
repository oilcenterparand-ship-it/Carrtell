@echo off
setlocal
REM Carrtell Agent launcher: bypasses the PowerShell signature policy only for
REM this single process. It does not change the user's Windows security policy.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0agent.ps1" %*
exit /b %ERRORLEVEL%
