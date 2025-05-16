' Hash Utility Script for Testing
' This script provides a command-line interface for calculating SHA-256 hashes
' of configuration files, which can be used by the test suite.

Option Explicit

' Check arguments
If WScript.Arguments.Count < 1 Then
    WScript.Echo "Usage: cscript hash_util.vbs <file_path>"
    WScript.Quit 1
End If

' Get file path from arguments
Dim filePath
filePath = WScript.Arguments(0)

' Calculate and output hash
Dim fileHash
fileHash = CalculateFileHash(filePath)
WScript.Echo "Hash: " & fileHash

' Calculate SHA-256 hash of a file
Function CalculateFileHash(filePath)
    Dim objShell, command, tempFile, objFSO, hashValue, hashFile
    
    Set objShell = CreateObject("WScript.Shell")
    Set objFSO = CreateObject("Scripting.FileSystemObject")
    
    ' Check if file exists
    If Not objFSO.FileExists(filePath) Then
        WScript.Echo "Error: File not found: " & filePath
        WScript.Quit 2
    End If
    
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