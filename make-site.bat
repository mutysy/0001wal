@echo off
chcp 65001 >nul
setlocal
title Qingyun - Build Publish Package

set NODE="D:\DSH Desktop\runtime\node.exe"
if not exist %NODE% set NODE=node

%NODE% "%~dp0_dev\build.js"
if errorlevel 1 (
  echo.
  echo Build FAILED.
  pause
  exit /b 1
)

echo.
echo   Output: _publish\  +  qingyun-site.zip
echo   Drag the zip to your Netlify site's Deploys page.
echo.
pause
endlocal
