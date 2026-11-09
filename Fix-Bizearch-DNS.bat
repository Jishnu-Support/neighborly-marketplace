@echo off
:: Batch script to map bizearch.in to new server IP 129.121.171.41
echo ========================================================
echo   Updating Bizearch DNS Mapping to New Server (129.121.171.41)
echo ========================================================
echo.

findstr /C:"129.121.171.41 bizearch.in" %windir%\system32\drivers\etc\hosts >nul
if %errorlevel% equ 0 (
    echo Already mapped to 129.121.171.41!
) else (
    echo 129.121.171.41 bizearch.in www.bizearch.in >> %windir%\system32\drivers\etc\hosts
    echo Added 129.121.171.41 bizearch.in to hosts file.
)

ipconfig /flushdns
echo.
echo ========================================================
echo SUCCESS! DNS cache flushed. Refresh bizearch.in now!
echo ========================================================
pause
