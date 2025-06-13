; NSIS Installer Script for TerraFusionTheory (GAMA)
; This script bundles PostgreSQL, Node.js, Python, and your app for a one-click Windows install

!define POSTGRES_VERSION "15.6-1"
!define POSTGRES_EXE "postgresql-${POSTGRES_VERSION}-windows-x64.exe"
!define NODE_EXE "node-v20.11.1-x64.msi"
!define PYTHON_EXE "python-3.11.8-amd64.exe"

Outfile "GAMA_Setup.exe"
InstallDir "$PROGRAMFILES\GAMA"
RequestExecutionLevel admin

Section "Install PostgreSQL"
  IfFileExists "$INSTDIR\Postgres\bin\psql.exe" skip_pg
  SetOutPath "$INSTDIR\Postgres"
  ; Bundle the PostgreSQL installer in the installer directory or download if not present
  File "${POSTGRES_EXE}"
  ExecWait '"$INSTDIR\Postgres\${POSTGRES_EXE}" --mode unattended --unattendedmodeui none --superpassword gama_pw --servicename GAMA_Postgres --datadir "$INSTDIR\Postgres\data" --prefix "$INSTDIR\Postgres"'
  skip_pg:
SectionEnd

Section "Install Node.js"
  IfFileExists "$INSTDIR\Node\node.exe" skip_node
  SetOutPath "$INSTDIR\Node"
  File "${NODE_EXE}"
  ExecWait 'msiexec /i "$INSTDIR\Node\${NODE_EXE}" /qn /norestart TARGETDIR="$INSTDIR\Node"'
  skip_node:
SectionEnd

Section "Install Python"
  IfFileExists "$INSTDIR\Python\python.exe" skip_py
  SetOutPath "$INSTDIR\Python"
  File "${PYTHON_EXE}"
  ExecWait '"$INSTDIR\Python\${PYTHON_EXE}" /quiet InstallAllUsers=1 PrependPath=1 TargetDir="$INSTDIR\Python"'
  skip_py:
SectionEnd

Section "Install GAMA App"
  SetOutPath "$INSTDIR\App"
  File /r "dist\*.*"
  File /r "scripts\*.*"
  File /r ".env.example"
  ; Optionally run npm install and pip install
  ExecWait '"$INSTDIR\Node\node.exe" "$INSTDIR\Node\node_modules\npm\bin\npm-cli.js" install --prefix "$INSTDIR\App"'
  ExecWait '"$INSTDIR\Python\python.exe" -m pip install -r "$INSTDIR\App\requirements.txt"'
SectionEnd

Section "Configure Environment"
  ; Set environment variable for database connection
  WriteRegExpandStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "DATABASE_URL" "postgres://gama:gama_pw@localhost:5432/terrafusion"
SectionEnd

Section "Finish"
  ; Optionally create Start Menu shortcuts, launch app, etc.
  Exec '"$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"'
SectionEnd
