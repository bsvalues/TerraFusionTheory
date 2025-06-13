; NSIS Modern UI 2 Installer - Upgrade Detection and Log File Example
!include "MUI2.nsh"
!include "LogicLib.nsh"

!define MUI_ICON "installer\\gama.ico"
!define MUI_UNICON "installer\\gama_uninstall.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "installer\\gama_header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "installer\\gama_welcome.bmp"

Outfile "GAMA_Setup_UpgradeLog.exe"
InstallDir "$PROGRAMFILES\GAMA"
RequestExecutionLevel admin

Var /GLOBAL LOGFILE

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "installer\\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Upgrade Detection and Backup"
  IfFileExists "$INSTDIR\App\start.js" 0 continue_install
  MessageBox MB_OK "Existing GAMA installation detected. Backing up configuration before upgrade."
  ; Backup config/data
  CopyFiles /SILENT "$INSTDIR\App\*.json" "$INSTDIR\backup\"
  CopyFiles /SILENT "$INSTDIR\App\*.env" "$INSTDIR\backup\"
  CopyFiles /SILENT "$INSTDIR\App\*.db" "$INSTDIR\backup\"
  continue_install:
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
