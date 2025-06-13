; NSIS Modern UI 2 Advanced Installer Script for TerraFusionTheory (GAMA)
!include "MUI2.nsh"
!include "LogicLib.nsh"

!define MUI_ICON "installer\\gama.ico"
!define MUI_UNICON "installer\\gama_uninstall.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "installer\\gama_header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "installer\\gama_welcome.bmp"

Outfile "GAMA_Setup_Advanced.exe"
InstallDir "$PROGRAMFILES\GAMA"
RequestExecutionLevel admin

Var /GLOBAL USERNAME
Var /GLOBAL USEREMAIL
Var /GLOBAL LOGFILE

; Custom configuration page
Page custom ConfigPageShow ConfigPageLeave

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "installer\\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Function ConfigPageShow
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  nsDialogs::CreateControl Static "" 0x40000000 0 0 100% 12u "Enter your GAMA user configuration:"
  nsDialogs::CreateControl Static "" 0x40000000 0 18u 60u 12u "Username:"
  nsDialogs::CreateControl Edit "" 0x14000000 65u 18u 80u 12u ""
  Pop $USERNAME
  nsDialogs::CreateControl Static "" 0x40000000 0 36u 60u 12u "Email:"
  nsDialogs::CreateControl Edit "" 0x14000000 65u 36u 120u 12u ""
  Pop $USEREMAIL
  nsDialogs::Show
FunctionEnd

Function ConfigPageLeave
  ; Save user input to file or registry as needed
  Push $R0
FunctionEnd

Section "Upgrade Detection"
  IfFileExists "$INSTDIR\App\start.js" 0 continue_install
  MessageBox MB_OK "Existing GAMA installation detected. This will upgrade your installation."
  ; Optionally backup old config or data here
  continue_install:
SectionEnd

Section "Download and Install PostgreSQL"
  IfFileExists "$INSTDIR\Postgres\bin\psql.exe" skip_pg
  SetOutPath "$INSTDIR\Postgres"
  NSISdl::download /TIMEOUT=30000 "https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64.exe" "$INSTDIR\Postgres\postgresql.exe"
  ExecWait '"$INSTDIR\Postgres\postgresql.exe" --mode unattended --unattendedmodeui none --superpassword gama_pw --servicename GAMA_Postgres --datadir "$INSTDIR\Postgres\data" --prefix "$INSTDIR\Postgres"'
  skip_pg:
SectionEnd

Section "Download and Install Node.js"
  IfFileExists "$INSTDIR\Node\node.exe" skip_node
  SetOutPath "$INSTDIR\Node"
  NSISdl::download /TIMEOUT=30000 "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi" "$INSTDIR\Node\node.msi"
  ExecWait 'msiexec /i "$INSTDIR\Node\node.msi" /qn /norestart TARGETDIR="$INSTDIR\Node"'
  skip_node:
SectionEnd

Section "Download and Install Python"
  IfFileExists "$INSTDIR\Python\python.exe" skip_py
  SetOutPath "$INSTDIR\Python"
  NSISdl::download /TIMEOUT=30000 "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe" "$INSTDIR\Python\python.exe"
  ExecWait '"$INSTDIR\Python\python.exe" /quiet InstallAllUsers=1 PrependPath=1 TargetDir="$INSTDIR\Python"'
  skip_py:
SectionEnd

Section "Install GAMA App"
  SetOutPath "$INSTDIR\App"
  File /r "dist\*.*"
  File /r "scripts\*.*"
  File /r ".env.example"
  ExecWait '"$INSTDIR\Node\node.exe" "$INSTDIR\Node\node_modules\npm\bin\npm-cli.js" install --prefix "$INSTDIR\App"'
  ExecWait '"$INSTDIR\Python\python.exe" -m pip install -r "$INSTDIR\App\requirements.txt"'
SectionEnd

Section "Configure Environment"
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "DATABASE_URL" "postgres://gama:gama_pw@localhost:5432/terrafusion"
SectionEnd

Section "Shortcuts and Finish"
  CreateDirectory "$SMPROGRAMS\GAMA"
  CreateShortCut "$SMPROGRAMS\GAMA\Start GAMA.lnk" "$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"
  CreateShortCut "$DESKTOP\Start GAMA.lnk" "$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"
  Exec '"$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"'
  ; Log file generation
  StrCpy $LOGFILE "$INSTDIR\install_log.txt"
  FileOpen $0 $LOGFILE w
  FileWrite $0 "GAMA installed at $INSTDIR on $\n"
  FileWrite $0 "Username: $USERNAME Email: $USEREMAIL$\n"
  FileClose $0
SectionEnd

; Silent/Unattended Install Option
Function .onInit
  ${GetParameters} $R0
  StrCmp $R0 "/S" 0 +2
  SetSilent silent
FunctionEnd
