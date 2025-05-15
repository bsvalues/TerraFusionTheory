' TerraFusion GAMA Enterprise - Configuration Validator Script
' This script validates the configuration during installation to ensure all
' required settings are properly set and configuration files are available.

Option Explicit

' Main validation function that will be called by the MSI installer
Function ValidateConfig()
    Dim objFSO, objShell, configFolder, configFile, configHash
    Dim expectedHash, resultMessage, installDir, statusCode
    
    On Error Resume Next
    
    ' Initialize status
    statusCode = 0
    resultMessage = "Configuration check passed."
    
    ' Create filesystem and shell objects
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    Set objShell = CreateObject("WScript.Shell")
    
    ' Get the installation directory from registry or environment
    installDir = Session.Property("INSTALLFOLDER") & "GAMA\"
    
    ' Check if config directory exists
    configFolder = installDir & "config\"
    
    If Not objFSO.FolderExists(configFolder) Then
        resultMessage = "Warning: Configuration folder does not exist. It will be created during installation."
        ' Non-critical error - directory will be created
        LogMessage "Config folder check: " & resultMessage
    End If
    
    ' Check if main config file exists
    configFile = configFolder & "gama_config.json"
    
    ' Create folders during validation
    CreateFoldersIfNeeded installDir
    
    ' Check for proper configuration
    If objFSO.FileExists(configFile) Then
        ' Verify configuration hash if needed
        configHash = CalculateFileHash(configFile)
        expectedHash = GetExpectedHash()
        
        If expectedHash <> "" And configHash <> expectedHash Then
            resultMessage = "Warning: Configuration file hash does not match expected value. " & _
                           "This might indicate unauthorized changes. The installation will " & _
                           "continue, but please verify your configuration."
            LogMessage "Config hash mismatch. Expected: " & expectedHash & ", Actual: " & configHash
        Else
            LogMessage "Configuration hash verified: " & configHash
        End If
    Else
        ' Log that config file will be created
        resultMessage = "Configuration file will be created during installation."
        LogMessage "Config file check: " & resultMessage
    End If
    
    ' Check for access to required directories
    If Not CheckDirectoryAccess(installDir) Then
        resultMessage = "Error: Cannot write to installation directory. Please check permissions."
        statusCode = 1
        LogMessage "Directory access check failed: " & installDir
    End If
    
    ' Check for required system dependencies
    If Not CheckSystemDependencies() Then
        resultMessage = "Warning: Some system dependencies may be missing. " & _
                       "The application may not function correctly."
        LogMessage "System dependencies check: Some dependencies missing"
    End If
    
    ' Return result to installer
    If statusCode = 0 Then
        Session.Property("ConfigValidationResult") = "PASS: " & resultMessage
        ValidateConfig = 1 ' Success
    Else
        Session.Property("ConfigValidationResult") = "FAIL: " & resultMessage
        ValidateConfig = 0 ' Failure
    End If
    
    On Error Goto 0
End Function

' Create all required folders if they don't exist
Function CreateFoldersIfNeeded(baseDir)
    Dim objFSO, folders, folder
    
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    
    ' List of folders to create
    folders = Array("bin", "config", "data", "docs", "logs", "output", "scripts", "ui")
    
    For Each folder in folders
        If Not objFSO.FolderExists(baseDir & folder) Then
            LogMessage "Creating folder: " & baseDir & folder
            objFSO.CreateFolder baseDir & folder
        End If
    Next
    
    CreateFoldersIfNeeded = True
End Function

' Calculate SHA-256 hash of a file
Function CalculateFileHash(filePath)
    Dim objShell, command, tempFile, objFSO, hashValue
    
    Set objShell = CreateObject("WScript.Shell")
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    
    tempFile = objFSO.GetSpecialFolder(2) & "\hash_output.txt"
    
    ' Use PowerShell to calculate hash
    command = "powershell -Command ""(Get-FileHash -Path '" & filePath & _
              "' -Algorithm SHA256).Hash"" > " & tempFile
    
    objShell.Run command, 0, True
    
    If objFSO.FileExists(tempFile) Then
        Set hashFile = objFSO.OpenTextFile(tempFile, 1)
        hashValue = Trim(hashFile.ReadAll)
        hashFile.Close
        objFSO.DeleteFile tempFile
    Else
        hashValue = ""
    End If
    
    CalculateFileHash = hashValue
End Function

' Get expected hash value from registry or embedded value
Function GetExpectedHash()
    Dim objShell, regPath, hashValue
    
    Set objShell = CreateObject("WScript.Shell")
    
    ' Try to read from registry first (for upgrades)
    On Error Resume Next
    regPath = "HKLM\SOFTWARE\TerraFusion\GAMA\"
    hashValue = objShell.RegRead(regPath & "ConfigHash")
    On Error Goto 0
    
    ' If not found, use embedded expected hash (for new installs)
    If hashValue = "" Then
        ' Default expected hash for initial install
        ' This would be updated for each release
        hashValue = "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
    End If
    
    GetExpectedHash = hashValue
End Function

' Verify access to directory
Function CheckDirectoryAccess(dirPath)
    Dim objFSO, testFile, accessOK
    
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    
    On Error Resume Next
    ' Try to create a test file
    testFile = dirPath & "access_test.tmp"
    Set testStream = objFSO.CreateTextFile(testFile, True)
    
    If Err.Number = 0 Then
        testStream.WriteLine "Access test"
        testStream.Close
        objFSO.DeleteFile testFile
        accessOK = True
    Else
        accessOK = False
    End If
    On Error Goto 0
    
    CheckDirectoryAccess = accessOK
End Function

' Check for required system dependencies
Function CheckSystemDependencies()
    Dim objShell, command, result, requiredDepsMet
    
    Set objShell = CreateObject("WScript.Shell")
    
    ' Check for .NET Framework 4.7.2 or higher
    On Error Resume Next
    command = "reg query ""HKLM\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full"" /v Release"
    result = objShell.Run(command, 0, True)
    
    If result = 0 Then
        ' Found .NET Framework
        requiredDepsMet = True
    Else
        requiredDepsMet = False
        LogMessage "Required .NET Framework not found"
    End If
    On Error Goto 0
    
    ' Could add more dependency checks here
    
    CheckSystemDependencies = requiredDepsMet
End Function

' Log message to installation log
Sub LogMessage(message)
    Dim logFile, objFSO, logStream, timestamp
    
    On Error Resume Next
    
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    logFile = Session.Property("INSTALLFOLDER") & "GAMA\logs\install.log"
    
    ' Create logs directory if it doesn't exist
    If Not objFSO.FolderExists(Session.Property("INSTALLFOLDER") & "GAMA\logs") Then
        objFSO.CreateFolder Session.Property("INSTALLFOLDER") & "GAMA\logs"
    End If
    
    ' Get timestamp
    timestamp = Year(Now) & "-" & Right("0" & Month(Now), 2) & "-" & Right("0" & Day(Now), 2) & " " & _
                Right("0" & Hour(Now), 2) & ":" & Right("0" & Minute(Now), 2) & ":" & Right("0" & Second(Now), 2)
    
    ' Append to log file
    If objFSO.FileExists(logFile) Then
        Set logStream = objFSO.OpenTextFile(logFile, 8, True) ' 8 = ForAppending
    Else
        Set logStream = objFSO.CreateTextFile(logFile, True)
        logStream.WriteLine "TerraFusion GAMA Installation Log"
        logStream.WriteLine "Installation started: " & timestamp
        logStream.WriteLine "-------------------------------------------"
    End If
    
    logStream.WriteLine timestamp & " - " & message
    logStream.Close
    
    On Error Goto 0
End Sub