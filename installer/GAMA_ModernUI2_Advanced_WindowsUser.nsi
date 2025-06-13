; NSIS Modern UI 2 Installer - Create Windows User Account Example
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsExec.nsh"

!define MUI_ICON "installer\\gama.ico"
!define MUI_UNICON "installer\\gama_uninstall.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "installer\\gama_header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "installer\\gama_welcome.bmp"

Outfile "GAMA_Setup_WindowsUser.exe"
InstallDir "$PROGRAMFILES\GAMA"
RequestExecutionLevel admin

Var /GLOBAL USERNAME
Var /GLOBAL USERPASS

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
  nsDialogs::CreateControl Static "" 0x40000000 0 0 100% 12u "Create a Windows user account for GAMA:"
  nsDialogs::CreateControl Static "" 0x40000000 0 18u 60u 12u "Username:"
  nsDialogs::CreateControl Edit "" 0x14000000 65u 18u 80u 12u ""
  Pop $USERNAME
  nsDialogs::CreateControl Static "" 0x40000000 0 36u 60u 12u "Password:"
  nsDialogs::CreateControl Edit "" 0x14000020 65u 36u 120u 12u ""
  Pop $USERPASS
  nsDialogs::Show
FunctionEnd

Function ConfigPageLeave
  ; Create a Windows user account (requires admin)
  StrCpy $0 'net user "$USERNAME" "$USERPASS" /add'
  nsExec::ExecToLog $0
  ; Optionally add to a group:
  ; StrCpy $1 'net localgroup "Users" "$USERNAME" /add'
  ; nsExec::ExecToLog $1
FunctionEnd

Section "Install GAMA App"
  SetOutPath "$INSTDIR\App"
  File /r "dist\*.*"
  File /r "scripts\*.*"
  File /r ".env.example"
SectionEnd

Section "Shortcuts and Finish"
  CreateDirectory "$SMPROGRAMS\GAMA"
  CreateShortCut "$SMPROGRAMS\GAMA\Start GAMA.lnk" "$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"
  CreateShortCut "$DESKTOP\Start GAMA.lnk" "$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"
  Exec '"$INSTDIR\Node\node.exe" "$INSTDIR\App\start.js"'
SectionEnd
