; NSIS Modern UI 2 Branded Installer Script for TerraFusionTheory (GAMA)
!include "MUI2.nsh"

; Branding
!define MUI_ICON "installer\\gama.ico"
!define MUI_UNICON "installer\\gama_uninstall.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "installer\\gama_header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "installer\\gama_welcome.bmp"

Outfile "GAMA_Setup_ModernUI2.exe"
InstallDir "$PROGRAMFILES\GAMA"
RequestExecutionLevel admin

; License Page
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "installer\\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

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
SectionEnd

; Silent/Unattended Install Option
Function .onInit
  ; Check for /S (silent) switch
  ${GetParameters} $R0
  StrCmp $R0 "/S" 0 +2
  SetSilent silent
FunctionEnd
