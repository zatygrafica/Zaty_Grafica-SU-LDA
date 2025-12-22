; ═══════════════════════════════════════════════════════════════════════════════
; Zaty Grafica - Customizacoes do Instalador NSIS
; Copyright 2025 Zaty Grafica, SU, LDA
; ═══════════════════════════════════════════════════════════════════════════════
; IMPORTANTE: Este arquivo contem APENAS macros de customizacao.
; As paginas do instalador (Welcome, License, Directory, etc.) sao gerenciadas
; automaticamente pelo electron-builder.
; ═══════════════════════════════════════════════════════════════════════════════

!include LogicLib.nsh

; ═══════════════════════════════════════════════════════════════════════════════
; Macro executada ANTES da instalacao (verificar instalacao anterior)
; ═══════════════════════════════════════════════════════════════════════════════

!macro customInit
    ; Verificar se ja existe instalacao anterior
    ReadRegStr $0 HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
    ${If} $0 != ""
        MessageBox MB_YESNO|MB_ICONQUESTION "Uma versao do Zaty Grafica ja esta instalada em:$\r$\n$0$\r$\n$\r$\nDeseja desinstalar a versao anterior antes de continuar?" IDYES doUninstallPrevious IDNO skipUninstallPrevious
        
        doUninstallPrevious:
            ExecWait '"$0\Uninstall ${PRODUCT_NAME}.exe" /S _?=$0'
            Delete "$0\Uninstall ${PRODUCT_NAME}.exe"
            RMDir /r "$0"
        
        skipUninstallPrevious:
    ${EndIf}
!macroend

; ═══════════════════════════════════════════════════════════════════════════════
; Macro executada APOS a instalacao (criar arquivos e registros adicionais)
; ═══════════════════════════════════════════════════════════════════════════════

!macro customInstall
    ; Criar arquivo de informacoes da instalacao
    FileOpen $0 "$INSTDIR\install-info.txt" w
    FileWrite $0 "Zaty Grafica - Sistema de Gestao Empresarial$\r$\n"
    FileWrite $0 "=============================================$\r$\n"
    FileWrite $0 "Versao: ${VERSION}$\r$\n"
    FileWrite $0 "Diretorio: $INSTDIR$\r$\n"
    FileWrite $0 "=============================================$\r$\n"
    FileWrite $0 "Copyright 2025 Zaty Grafica, SU, LDA$\r$\n"
    FileClose $0

    ; Registrar informacoes no registro do Windows
    WriteRegStr HKLM "Software\ZatyGrafica" "Version" "${VERSION}"
    WriteRegStr HKLM "Software\ZatyGrafica" "InstallPath" "$INSTDIR"
!macroend

; ═══════════════════════════════════════════════════════════════════════════════
; Macro executada durante a DESINSTALACAO
; ═══════════════════════════════════════════════════════════════════════════════

!macro customUnInstall
    ; Confirmar desinstalacao
    MessageBox MB_YESNO|MB_ICONQUESTION "Tem certeza que deseja remover o Zaty Grafica?$\r$\n$\r$\nNota: Seus dados permanecerao seguros no servidor." IDYES proceedUninstall IDNO cancelUninstall
    
    proceedUninstall:
        ; Remover chaves de registro
        DeleteRegKey HKLM "Software\ZatyGrafica"
        
        ; Remover arquivo de informacoes
        Delete "$INSTDIR\install-info.txt"
        
        Goto finishUninstall
    
    cancelUninstall:
        Abort
    
    finishUninstall:
!macroend
