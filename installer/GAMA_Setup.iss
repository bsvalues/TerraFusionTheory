; Inno Setup Script for TerraFusionTheory (GAMA) - Download Dependencies at Install Time

[Setup]
AppName=GAMA
AppVersion=1.0
DefaultDirName={pf}\GAMA
DefaultGroupName=GAMA
UninstallDisplayIcon={app}\App\favicon.ico
OutputBaseFilename=GAMA_Setup
PrivilegesRequired=admin

[Files]
Source: "dist\*"; DestDir: "{app}\App"; Flags: recursesubdirs
Source: "scripts\*"; DestDir: "{app}\scripts"; Flags: recursesubdirs
Source: ".env.example"; DestDir: "{app}"; Flags: ignoreversion

[Run]
Filename: "{tmp}\postgresql.exe"; Description: "Install PostgreSQL"; Flags: runhidden
Parameters: "--mode unattended --unattendedmodeui none --superpassword gama_pw --servicename GAMA_Postgres --datadir \"{app}\Postgres\data\" --prefix \"{app}\Postgres\""

Filename: "msiexec.exe"; Parameters: "/i {tmp}\node.msi /qn /norestart TARGETDIR=\"{app}\Node\""; Description: "Install Node.js"; Flags: runhidden

Filename: "{tmp}\python.exe"; Parameters: "/quiet InstallAllUsers=1 PrependPath=1 TargetDir=\"{app}\Python\""; Description: "Install Python"; Flags: runhidden

Filename: "{app}\Node\node.exe"; Parameters: "{app}\Node\node_modules\npm\bin\npm-cli.js install --prefix {app}\App"; Description: "Install Node.js dependencies"; Flags: runhidden

Filename: "{app}\Python\python.exe"; Parameters: "-m pip install -r {app}\App\requirements.txt"; Description: "Install Python dependencies"; Flags: runhidden

Filename: "{app}\Node\node.exe"; Parameters: "{app}\App\start.js"; Description: "Launch GAMA"; Flags: nowait postinstall skipifsilent

[Icons]
Name: "{group}\Start GAMA"; Filename: "{app}\Node\node.exe"; Parameters: "{app}\App\start.js"
Name: "{userdesktop}\Start GAMA"; Filename: "{app}\Node\node.exe"; Parameters: "{app}\App\start.js"

[Code]
procedure InitializeWizard;
begin
  idpAddFile('https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64.exe', ExpandConstant('{tmp}\postgresql.exe'));
  idpAddFile('https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi', ExpandConstant('{tmp}\node.msi'));
  idpAddFile('https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe', ExpandConstant('{tmp}\python.exe'));
end;

[CustomMessages]
WelcomeLabel1=Welcome to the GAMA Setup Wizard! This will install all prerequisites and the GAMA application.
