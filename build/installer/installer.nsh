; ═══════════════════════════════════════════════════════════════════════════════
; Zaty Gráfica - Instalador Personalizado NSIS
; Copyright © 2025 Zaty Gráfica, SU, LDA
; ═══════════════════════════════════════════════════════════════════════════════

!include MUI2.nsh
!include LogicLib.nsh
!include nsDialogs.nsh
!include WinMessages.nsh

; ═══════════════════════════════════════════════════════════════════════════════
; Variáveis Globais
; ═══════════════════════════════════════════════════════════════════════════════

Var LicenseAccepted
Var Dialog
Var Label
Var CheckBox
Var TextBox
Var ScrollBar
Var LicenseText

; ═══════════════════════════════════════════════════════════════════════════════
; Configurações do Instalador (ícones e imagens já definidos no electron-builder.json)
; ═══════════════════════════════════════════════════════════════════════════════

; Cores e estilo profissional
!define MUI_BGCOLOR 0xFFFFFF
!define MUI_TEXTCOLOR 0x000000

; Textos personalizados
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Sistema Zaty Gráfica"
!define MUI_WELCOMEPAGE_TEXT "Este assistente irá guiá-lo através da instalação do Sistema de Gestão Empresarial Zaty Gráfica.$\r$\n$\r$\nO sistema oferece recursos completos para gerenciamento de clientes, produtos, serviços, vendas e muito mais.$\r$\n$\r$\nClique em Avançar para continuar."

!define MUI_FINISHPAGE_TITLE "Instalação Concluída com Sucesso"
!define MUI_FINISHPAGE_TEXT "O Sistema Zaty Gráfica foi instalado com sucesso em seu computador.$\r$\n$\r$\nVocê pode iniciar o sistema através do atalho criado na área de trabalho ou no menu iniciar.$\r$\n$\r$\nObrigado por escolher a Zaty Gráfica!"

!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar Zaty Gráfica agora"
!define MUI_FINISHPAGE_LINK "Visitar o site da Zaty Gráfica"
!define MUI_FINISHPAGE_LINK_LOCATION "https://zatygrafica.co.mz"

; ═══════════════════════════════════════════════════════════════════════════════
; Páginas do Instalador
; ═══════════════════════════════════════════════════════════════════════════════

; Página de boas-vindas
!insertmacro MUI_PAGE_WELCOME

; Página customizada de termos de uso
Page custom LicensePage LicensePageLeave

; Página de seleção de diretório
!define MUI_DIRECTORYPAGE_TEXT_TOP "Escolha o local onde deseja instalar o Sistema Zaty Gráfica.$\r$\n$\r$\nO assistente instalará o sistema no diretório a seguir. Para instalar em um diretório diferente, clique em Procurar e selecione outro diretório."
!insertmacro MUI_PAGE_DIRECTORY

; Página de instalação
!insertmacro MUI_PAGE_INSTFILES

; Página de finalização
!define MUI_FINISHPAGE_NOAUTOCLOSE
!insertmacro MUI_PAGE_FINISH

; Páginas do desinstalador
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ═══════════════════════════════════════════════════════════════════════════════
; Idiomas
; ═══════════════════════════════════════════════════════════════════════════════

!insertmacro MUI_LANGUAGE "PortugueseBR"

; ═══════════════════════════════════════════════════════════════════════════════
; Página Personalizada de Licença
; ═══════════════════════════════════════════════════════════════════════════════

Function LicensePage
    ; Inicializar variável
    StrCpy $LicenseAccepted "0"

    ; Criar página customizada
    nsDialogs::Create 1018
    Pop $Dialog

    ${If} $Dialog == error
        Abort
    ${EndIf}

    ; Logo da empresa (topo)
    ${NSD_CreateBitmap} 0 0 100% 60u ""
    Pop $0
    ${NSD_SetImage} $0 "${BUILD_RESOURCES_DIR}\installer\logo.bmp" $1

    ; Título
    ${NSD_CreateLabel} 0 65u 100% 12u "Termos de Uso e Política de Privacidade"
    Pop $Label
    CreateFont $0 "Segoe UI" 11 700
    SendMessage $Label ${WM_SETFONT} $0 0

    ; Subtítulo
    ${NSD_CreateLabel} 0 80u 100% 20u "Por favor, leia atentamente os Termos de Uso e a Política de Privacidade.$\r$\nVocê deve aceitar os termos para continuar a instalação."
    Pop $Label

    ; Caixa de texto com scroll para o conteúdo da licença
    ${NSD_CreateText} 0 105u 100% 110u ""
    Pop $TextBox

    ; Carregar conteúdo do arquivo de licença
    FileOpen $0 "${BUILD_RESOURCES_DIR}\installer\LICENSE.txt" r
    StrCpy $LicenseText ""

    LicenseReadLoop:
        FileRead $0 $1
        StrCmp $1 "" LicenseReadDone
        StrCpy $LicenseText "$LicenseText$1"
        Goto LicenseReadLoop

    LicenseReadDone:
        FileClose $0

    ; Definir texto na caixa
    SendMessage $TextBox ${WM_SETTEXT} 0 "STR:$LicenseText"

    ; Tornar a caixa de texto somente leitura e com scroll
    SendMessage $TextBox ${EM_SETREADONLY} 1 0

    ; Criar estilo de borda para a caixa de texto
    System::Call 'user32::SetWindowLong(i$TextBox, i${GWL_EXSTYLE}, i${WS_EX_CLIENTEDGE})i.r0'

    ; Checkbox de aceitação
    ${NSD_CreateCheckbox} 0 220u 100% 12u "Li e aceito os Termos de Uso e a Política de Privacidade"
    Pop $CheckBox
    ${NSD_OnClick} $CheckBox OnLicenseCheckbox

    ; Aviso importante
    ${NSD_CreateLabel} 0 235u 100% 16u "IMPORTANTE: Ao marcar esta caixa, você confirma que leu, compreendeu$\r$\ne concordou com todos os termos descritos acima."
    Pop $Label
    CreateFont $0 "Segoe UI" 8 400
    SendMessage $Label ${WM_SETFONT} $0 0
    SetCtlColors $Label 0x800000 transparent

    nsDialogs::Show
FunctionEnd

; Callback do checkbox
Function OnLicenseCheckbox
    Pop $0
    ${NSD_GetState} $CheckBox $0
    ${If} $0 == ${BST_CHECKED}
        StrCpy $LicenseAccepted "1"
    ${Else}
        StrCpy $LicenseAccepted "0"
    ${EndIf}
FunctionEnd

; Validação ao sair da página
Function LicensePageLeave
    ${If} $LicenseAccepted == "0"
        MessageBox MB_OK|MB_ICONEXCLAMATION "Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar a instalação.$\r$\n$\r$\nPor favor, leia os termos e marque a caixa de aceitação."
        Abort
    ${EndIf}
FunctionEnd

; ═══════════════════════════════════════════════════════════════════════════════
; Customizações Adicionais
; ═══════════════════════════════════════════════════════════════════════════════

; Função executada antes da instalação
!macro customInit
    ; Verificar se já existe instalação anterior
    ReadRegStr $0 HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
    ${If} $0 != ""
        MessageBox MB_YESNO|MB_ICONQUESTION "Uma versão do Zaty Gráfica já está instalada.$\r$\n$\r$\nDeseja desinstalar a versão anterior antes de continuar?" IDYES Uninstall IDNO Continue

        Uninstall:
            ExecWait '"$0\Uninstall ${PRODUCT_NAME}.exe" /S _?=$0'
            Delete "$0\Uninstall ${PRODUCT_NAME}.exe"
            RMDir $0

        Continue:
    ${EndIf}
!macroend

; Função executada após a instalação
!macro customInstall
    ; Criar arquivo de informações de instalação
    FileOpen $0 "$INSTDIR\install-info.txt" w
    FileWrite $0 "Zaty Gráfica - Sistema de Gestão Empresarial$\r$\n"
    FileWrite $0 "═══════════════════════════════════════════════$\r$\n"
    FileWrite $0 "Versão: ${VERSION}$\r$\n"
    FileWrite $0 "Data de Instalação: "

    ; Obter data atual
    System::Call 'kernel32::GetLocalTime(i.r1)'
    System::Call '*$1(&i2.r2,&i2.r3,&i2,&i2.r4)'
    IntOp $2 $2 + 0
    IntOp $3 $3 + 0
    IntOp $4 $4 + 0
    FileWrite $0 "$4/$3/$2$\r$\n"

    FileWrite $0 "Diretório: $INSTDIR$\r$\n"
    FileWrite $0 "═══════════════════════════════════════════════$\r$\n"
    FileWrite $0 "Copyright © 2025 Zaty Gráfica, SU, LDA$\r$\n"
    FileClose $0

    ; Registrar informações no sistema
    WriteRegStr HKLM "Software\ZatyGrafica" "InstallDate" "$4/$3/$2"
    WriteRegStr HKLM "Software\ZatyGrafica" "Version" "${VERSION}"
!macroend

; Mensagem de desinstalação
!macro customUnInstall
    MessageBox MB_YESNO|MB_ICONQUESTION "Deseja remover completamente o Zaty Gráfica e todos os seus componentes?$\r$\n$\r$\nNOTA: Os dados do sistema não serão removidos e permanecerão seguros no servidor." IDYES DoUninstall IDNO Cancel

    DoUninstall:
        ; Remover chaves de registro
        DeleteRegKey HKLM "Software\ZatyGrafica"
        Goto Continue

    Cancel:
        Abort

    Continue:
!macroend
