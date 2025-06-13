; NSIS Modern UI 2 Enterprise Pro Installer - Deep Integration, Advanced Backup, Extra Wizard Pages
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsExec.nsh"

!define MUI_ICON "installer\\gama.ico"
!define MUI_UNICON "installer\\gama_uninstall.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "installer\\gama_header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "installer\\gama_welcome.bmp"

Outfile "GAMA_Setup_Enterprise_Pro.exe"
InstallDir "$PROGRAMFILES\GAMA"
RequestExecutionLevel admin

Var /GLOBAL USERNAME
Var /GLOBAL USEREMAIL
Var /GLOBAL USERPASS
Var /GLOBAL LICENSEKEY
Var /GLOBAL TELEMETRY
Var /GLOBAL LOGFILE
Var /GLOBAL BACKUPDIR
Var /GLOBAL RESTORE
Var /GLOBAL DB_BACKUP
Var /GLOBAL ENCRYPT_PASS

; Custom wizard pages
Page custom LicenseKeyPageShow LicenseKeyPageLeave
Page custom ConfigPageShow ConfigPageLeave
Page custom TelemetryPageShow TelemetryPageLeave
Page custom AdvancedConfigPageShow AdvancedConfigPageLeave

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "installer\\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; License Key Page
Function LicenseKeyPageShow
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  nsDialogs::CreateControl Static "" 0x40000000 0 0 100% 12u "Enter your GAMA license key:"
  nsDialogs::CreateControl Edit "" 0x14000000 0 18u 180u 12u ""
  Pop $LICENSEKEY
  nsDialogs::Show
FunctionEnd

Function LicenseKeyPageLeave
  ; Validate license key with backend (example)
  StrCpy $0 'curl -X POST -H "Content-Type: application/json" -d "{\"license_key\":\"$LICENSEKEY\"}" https://api.gama-county.ai/validate-license'
  nsExec::ExecToLog $0
FunctionEnd

; User Registration Page
Function ConfigPageShow
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  nsDialogs::CreateControl Static "" 0x40000000 0 0 100% 12u "Register your GAMA user account:"
  nsDialogs::CreateControl Static "" 0x40000000 0 18u 60u 12u "Username:"
  nsDialogs::CreateControl Edit "" 0x14000000 65u 18u 80u 12u ""
  Pop $USERNAME
  nsDialogs::CreateControl Static "" 0x40000000 0 36u 60u 12u "Email:"
  nsDialogs::CreateControl Edit "" 0x14000000 65u 36u 120u 12u ""
  Pop $USEREMAIL
  nsDialogs::CreateControl Static "" 0x40000000 0 54u 60u 12u "Password:"
  nsDialogs::CreateControl Edit "" 0x14000020 65u 54u 120u 12u ""
  Pop $USERPASS
  nsDialogs::Show
FunctionEnd

Function ConfigPageLeave
  ; Register user with backend via REST API (using curl)
  StrCpy $0 'curl -X POST -H "Content-Type: application/json" -d "{\"username\":\"$USERNAME\",\"email\":\"$USEREMAIL\",\"password\":\"$USERPASS\",\"license_key\":\"$LICENSEKEY\"}" https://api.gama-county.ai/register'
  nsExec::ExecToLog $0
  ; Optionally, create a Windows user as well
  StrCpy $1 'net user "$USERNAME" "$USERPASS" /add'
  nsExec::ExecToLog $1
FunctionEnd

; Telemetry Opt-In Page
Function TelemetryPageShow
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  nsDialogs::CreateControl Static "" 0x40000000 0 0 100% 12u "Would you like to enable anonymous telemetry to help improve GAMA? (yes/no):"
  nsDialogs::CreateControl Edit "" 0x14000000 0 18u 60u 12u "yes"
  Pop $TELEMETRY
  nsDialogs::Show
FunctionEnd

Function TelemetryPageLeave
  ; Save telemetry opt-in to file
  StrCpy $LOGFILE "$INSTDIR\telemetry_opt.txt"
  FileOpen $0 $LOGFILE w
  FileWrite $0 "Telemetry: $TELEMETRY\r\n"
  FileClose $0
FunctionEnd

; Advanced Backup/Restore Page
Function AdvancedConfigPageShow
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  nsDialogs::CreateControl Static "" 0x40000000 0 0 100% 12u "Backup & Restore Options:"
  nsDialogs::CreateControl Static "" 0x40000000 0 18u 60u 12u "Backup Directory:"
  nsDialogs::CreateControl Edit "" 0x14000000 65u 18u 120u 12u "$INSTDIR\\backup"
  Pop $BACKUPDIR
  nsDialogs::CreateControl Static "" 0x40000000 0 36u 60u 12u "Restore from Backup (yes/no):"
  nsDialogs::CreateControl Edit "" 0x14000000 65u 36u 60u 12u "no"
  Pop $RESTORE
  nsDialogs::CreateControl Static "" 0x40000000 0 54u 120u 12u "Database Backup (yes/no):"
  nsDialogs::CreateControl Edit "" 0x14000000 145u 54u 40u 12u "yes"
  Pop $DB_BACKUP
  nsDialogs::CreateControl Static "" 0x40000000 0 72u 120u 12u "Encrypt Backups (password, blank for none):"
  nsDialogs::CreateControl Edit "" 0x14000020 145u 72u 80u 12u ""
  Pop $ENCRYPT_PASS
  nsDialogs::Show
FunctionEnd

Function AdvancedConfigPageLeave
  ; Placeholder for handling advanced backup/restore/encryption
  Push $R0
FunctionEnd

Section "Upgrade Detection and Advanced Backup"
  IfFileExists "$INSTDIR\App\start.js" 0 continue_install
  MessageBox MB_OK "Existing GAMA installation detected. Backing up configuration before upgrade."
  ; Backup config/data
  CopyFiles /SILENT "$INSTDIR\App\*.json" "$BACKUPDIR\"
  CopyFiles /SILENT "$INSTDIR\App\*.env" "$BACKUPDIR\"
  CopyFiles /SILENT "$INSTDIR\App\*.db" "$BACKUPDIR\"
  ; Database dump (PostgreSQL example, requires pg_dump in PATH)
  StrCmp $DB_BACKUP "yes" 0 skip_db_backup
  StrCpy $0 'pg_dump -U postgres -F c -b -v -f "$BACKUPDIR\gama_db.backup" terrafusion'
  nsExec::ExecToLog $0
  skip_db_backup:
  ; Encrypt backup (if password provided, using 7z)
  StrCmp $ENCRYPT_PASS "" skip_encrypt
  StrCpy $0 '7z a -p$ENCRYPT_PASS "$BACKUPDIR\gama_backup_encrypted.7z" "$BACKUPDIR\*.*"'
  nsExec::ExecToLog $0
  skip_encrypt:
  continue_install:
SectionEnd

Section "Restore from Backup"
  StrCmp $RESTORE "yes" 0 no_restore
  MessageBox MB_OK "Restoring configuration from backup."
  CopyFiles /SILENT "$BACKUPDIR\*.json" "$INSTDIR\App\"
  CopyFiles /SILENT "$BACKUPDIR\*.env" "$INSTDIR\App\"
  CopyFiles /SILENT "$BACKUPDIR\*.db" "$INSTDIR\App\"
  ; Optionally restore DB (requires pg_restore)
  StrCmp $DB_BACKUP "yes" 0 no_restore_db
  StrCpy $0 'pg_restore -U postgres -d terrafusion "$BACKUPDIR\gama_db.backup"'
  nsExec::ExecToLog $0
  no_restore_db:
  no_restore:
SectionEnd

Section "Install GAMA App"
  SetOutPath "$INSTDIR\App"
  File /r "dist\*.*"
  File /r "scripts\*.*"
  File /r ".env.example"
  ; Log installation event
  StrCpy $LOGFILE "$INSTDIR\install_log.txt"
  FileOpen $0 $LOGFILE a
  FileWrite $0 "Install event at $INSTDIR on $\n"
  FileWrite $0 "User: $USERNAME Email: $USEREMAIL License: $LICENSEKEY Telemetry: $TELEMETRY$\n"
  FileClose $0
SectionEnd

Section "Shortcuts and Finish"
  CreateDirectory "$SMPROGRAMS\GAMA"
  CreateShortCut "$SMPROGRAMS\GAMA\Start GAMA.lnk" "$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"
  CreateShortCut "$DESKTOP\Start GAMA.lnk" "$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"
  Exec '"$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"'
  ; Log finish event
  StrCpy $LOGFILE "$INSTDIR\install_log.txt"
  FileOpen $0 $LOGFILE a
  FileWrite $0 "Install finished at $INSTDIR on $\n"
  FileClose $0
SectionEnd

; Silent/Unattended Install Option
Function .onInit
  ${GetParameters} $R0
  StrCmp $R0 "/S" 0 +2
  SetSilent silent
FunctionEnd
