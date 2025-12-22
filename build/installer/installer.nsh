; ═══════════════════════════════════════════════════════════════════════════════
; Zaty Grafica - Instalador Personalizado NSIS
; Copyright 2025 Zaty Grafica, SU, LDA
; ═══════════════════════════════════════════════════════════════════════════════

!include MUI2.nsh
!include LogicLib.nsh

; ═══════════════════════════════════════════════════════════════════════════════
; Configuracoes Visuais - Banners
; ═══════════════════════════════════════════════════════════════════════════════

; Banner lateral para paginas Welcome e Finish (164x314 pixels)
!define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer\sidebar.bmp"

; Cabecalho para paginas internas (150x57 pixels)  
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer\header.bmp"
!define MUI_HEADERIMAGE_RIGHT

; Banner do desinstalador
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installer\sidebar.bmp"

; ═══════════════════════════════════════════════════════════════════════════════
; Textos Personalizados
; ═══════════════════════════════════════════════════════════════════════════════

!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Sistema Zaty Grafica"
!define MUI_WELCOMEPAGE_TEXT "Este assistente ira guia-lo atraves da instalacao do Sistema de Gestao Empresarial Zaty Grafica.$\r$\n$\r$\nO sistema oferece recursos completos para gerenciamento de clientes, produtos, servicos, vendas e muito mais.$\r$\n$\r$\nClique em Proximo para continuar."

!define MUI_LICENSEPAGE_TEXT_TOP "Por favor, leia atentamente os Termos de Uso abaixo."
!define MUI_LICENSEPAGE_TEXT_BOTTOM "Se voce aceita todos os termos do acordo, clique em Eu Concordo para continuar. Voce deve aceitar o acordo para instalar o Sistema Zaty Grafica."
!define MUI_LICENSEPAGE_BUTTON "Eu Concordo"

!define MUI_DIRECTORYPAGE_TEXT_TOP "Escolha o local onde deseja instalar o Sistema Zaty Grafica."

!define MUI_FINISHPAGE_TITLE "Instalacao Concluida com Sucesso"
!define MUI_FINISHPAGE_TEXT "O Sistema Zaty Grafica foi instalado com sucesso em seu computador.$\r$\n$\r$\nClique em Concluir para sair do assistente."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar Zaty Grafica agora"
!define MUI_FINISHPAGE_LINK "Visitar o site da Zaty Grafica"
!define MUI_FINISHPAGE_LINK_LOCATION "https://zatygrafica.co.mz"

; ═══════════════════════════════════════════════════════════════════════════════
; Paginas do Instalador
; ═══════════════════════════════════════════════════════════════════════════════

; Pagina de boas-vindas
!insertmacro MUI_PAGE_WELCOME

; Pagina de licenca (padrao MUI com checkbox)
!define MUI_LICENSEPAGE_RADIOBUTTONS
!insertmacro MUI_PAGE_LICENSE "${BUILD_RESOURCES_DIR}\installer\LICENSE.txt"

; Pagina de selecao de diretorio
!insertmacro MUI_PAGE_DIRECTORY

; Pagina de instalacao
!insertmacro MUI_PAGE_INSTFILES

; Pagina de finalizacao
!define MUI_FINISHPAGE_NOAUTOCLOSE
!insertmacro MUI_PAGE_FINISH

; Paginas do desinstalador
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ═══════════════════════════════════════════════════════════════════════════════
; Idioma
; ═══════════════════════════════════════════════════════════════════════════════

!insertmacro MUI_LANGUAGE "PortugueseBR"

; ═══════════════════════════════════════════════════════════════════════════════
; Customizacoes
; ═══════════════════════════════════════════════════════════════════════════════

!macro customInit
    ReadRegStr $0 HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
    ${If} $0 != ""
        MessageBox MB_YESNO|MB_ICONQUESTION "Uma versao do Zaty Grafica ja esta instalada.$\r$\n$\r$\nDeseja desinstalar a versao anterior?" IDYES doUninstall IDNO skipUninstall
        doUninstall:
            ExecWait '"$0\Uninstall ${PRODUCT_NAME}.exe" /S _?=$0'
            Delete "$0\Uninstall ${PRODUCT_NAME}.exe"
            RMDir $0
        skipUninstall:
    ${EndIf}
!macroend

!macro customInstall
    FileOpen $0 "$INSTDIR\install-info.txt" w
    FileWrite $0 "Zaty Grafica - Sistema de Gestao$\r$\n"
    FileWrite $0 "Versao: ${VERSION}$\r$\n"
    FileWrite $0 "Diretorio: $INSTDIR$\r$\n"
    FileWrite $0 "Copyright 2025 Zaty Grafica$\r$\n"
    FileClose $0
    WriteRegStr HKLM "Software\ZatyGrafica" "Version" "${VERSION}"
!macroend

!macro customUnInstall
    MessageBox MB_YESNO|MB_ICONQUESTION "Deseja remover o Zaty Grafica?$\r$\n$\r$\nSeus dados permanecerao seguros no servidor." IDYES doRemove IDNO cancelRemove
    doRemove:
        DeleteRegKey HKLM "Software\ZatyGrafica"
        Goto continueRemove
    cancelRemove:
        Abort
    continueRemove:
!macroend
