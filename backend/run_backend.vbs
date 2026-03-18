Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c C:\inetpub\wwwroot\im\backend\start_server.bat", 0
Set WshShell = Nothing
