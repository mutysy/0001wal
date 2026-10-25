@echo off
chcp 65001 >nul
setlocal
title Qingyun Server

set PORT=%~1
if "%PORT%"=="" set PORT=8123

set NODE="D:\DSH Desktop\runtime\node.exe"
if not exist %NODE% set NODE=node

echo.
echo   Starting Qingyun ...  http://127.0.0.1:%PORT%/
echo   Close this window to stop the server.
echo.

start "" /b cmd /c "timeout /t 2 >nul & start http://127.0.0.1:%PORT%/"

%NODE% "%~dp0_dev\serve.js" %PORT%

echo.
echo Server stopped.
pause
endlocal
