import{G as P,u as N,H as T,r as O,j as t}from"./index-_GOHtcVX.js";import j from"./purify.es-C65SP4u9.js";const B=[{id:"cv",name:"Currículo Vitae",type:"client",template:`
      <div class="text-sm leading-normal cv-doc">
        <h1 class="cv-title text-center">CURRICULUM VITAE</h1>
        <div class="section-container" data-section-id="personal_data">
          <h2 class="section-title">I. IDENTIFICAÇÃO</h2>
          <table class="w-full ident-table">
            <tbody>
              <tr><td class="label">Apelido:</td><td>{{apelido}}</td></tr>
              <tr><td class="label">Nome Completo:</td><td>{{nome}}</td></tr>
              <tr><td class="label">Filiação:</td><td>{{filiacao}}</td></tr>
              <tr><td class="label">B.I. no:</td><td>{{bi}}</td></tr>
              <tr><td class="label">Data de Nascimento:</td><td>{{data_nascimento}}</td></tr>
              <tr><td class="label">Estado Civil:</td><td>{{estado_civil}}</td></tr>
              <tr><td class="label">Naturalidade:</td><td>{{naturalidade}}</td></tr>
              <tr><td class="label">Nacionalidade:</td><td>{{nacionalidade}}</td></tr>
              <tr><td class="label">Residência:</td><td>{{residencia}}</td></tr>
              <tr><td class="label">Número de Telefone:</td><td>{{telemovel}}</td></tr>
              <tr style="{{email_display}}"><td class="label">Email:</td><td>{{email}}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="section-container" data-section-id="education">
          <h2 class="section-title">II. FORMAÇÃO ACADÉMICA</h2>
          <div class="space-y-3">{{education_list}}</div>
        </div>
        <div class="section-container" data-section-id="professional_training">
          <h2 class="section-title">III. FORMAÇÃO PROFISSIONAL</h2>
          <ul class="list-plain">{{professional_training_list}}</ul>
        </div>
        <div class="section-container" data-section-id="experience">
          <h2 class="section-title">IV. EXPERIÊNCIA PROFISSIONAL</h2>
          <ul class="list-plain">{{experience_list}}</ul>
        </div>
        <div class="section-container" data-section-id="it_skills">
          <h2 class="section-title">V. INFORMÁTICA</h2>
          <p class="mb-2">Domínio da informática na óptica do utilizador nos pacotes seguintes:</p>
          <ul class="pl-6 space-y-1">{{it_skills_list}}</ul>
        </div>
        <div class="section-container" data-section-id="languages">
          <h2 class="section-title">VI. LÍNGUAS</h2>
          <table class="w-full text-left grid-table">
            <thead>
              <tr>
                <th class="font-bold pb-1 w-1/4">Idioma</th>
                <th class="font-bold pb-1 w-1/4">Leitura</th>
                <th class="font-bold pb-1 w-1/4">Fala</th>
                <th class="font-bold pb-1 w-1/4">Escrita</th>
              </tr>
            </thead>
            <tbody>
              {{languages}}
            </tbody>
          </table>
        </div>
        <div class="section-container" data-section-id="social_skills">
          <h2 class="section-title">VII. APTIDÕES E COMPETÊNCIAS SOCIAIS</h2>
          <ul class="list-disc pl-6 space-y-1">{{social_skills_list}}</ul>
        </div>
        <div class="section-container" data-section-id="references">
          <h2 class="section-title">VIII. REFERÊNCIAS</h2>
          <ol class="list-decimal pl-6 space-y-2">{{references_list}}</ol>
        </div>
      </div>
    `,fields:[{name:"section_personal_data",label:"I. IDENTIFICAÇÃO",type:"section_toggle",defaultValue:"true"},{name:"apelido",label:"Apelido",type:"text",required:!0,sectionId:"personal_data"},{name:"nome",label:"Nome Completo",type:"text",required:!0,sectionId:"personal_data"},{name:"filiacao",label:"Filiação",type:"text",sectionId:"personal_data"},{name:"bi",label:"B.I. no",type:"text",sectionId:"personal_data"},{name:"data_nascimento",label:"Data de Nascimento",type:"text",sectionId:"personal_data"},{name:"estado_civil",label:"Estado Civil",type:"text",sectionId:"personal_data"},{name:"naturalidade",label:"Naturalidade",type:"text",sectionId:"personal_data"},{name:"nacionalidade",label:"Nacionalidade",type:"text",defaultValue:"Moçambicana",sectionId:"personal_data"},{name:"residencia",label:"Residência",type:"text",sectionId:"personal_data"},{name:"telemovel",label:"Número de Telefone",type:"text",sectionId:"personal_data"},{name:"show_email",label:"Exibir Email",type:"section_toggle",defaultValue:"true",sectionId:"personal_data"},{name:"email",label:"Email",type:"email",sectionId:"personal_data"},{name:"section_education",label:"II. FORMAÇÃO ACADÉMICA",type:"section_toggle",defaultValue:"true"},{name:"education_list",label:"Lista de Formações",type:"repeatable",sectionId:"education",subFields:[{name:"period",label:"Período (Ex: 2010-14)",type:"text"},{name:"degree",label:"Grau (Ex: Licenciado em Antropologia)",type:"text"},{name:"institution",label:"Instituição (Ex: Universidade Eduardo Mondlane)",type:"text"}]},{name:"section_professional_training",label:"III. FORMAÇÃO PROFISSIONAL",type:"section_toggle",defaultValue:"true"},{name:"professional_training_list",label:"Lista de Formações Profissionais",type:"list",sectionId:"professional_training"},{name:"section_experience",label:"IV. EXPERIÊNCIA PROFISSIONAL",type:"section_toggle",defaultValue:"true"},{name:"experience_list",label:"Lista de Experiências",type:"list",sectionId:"experience"},{name:"section_it_skills",label:"V. INFORMÁTICA",type:"section_toggle",defaultValue:"true"},{name:"it_skills_list",label:"Lista de Competências de Informática",type:"checklist",sectionId:"it_skills",options:["Microsoft Office Word","Microsoft Office Excel","Microsoft Access (Básico) e SPSS","Microsoft Office PowerPoint","Internet"]},{name:"section_languages",label:"VI. LÍNGUAS",type:"section_toggle",defaultValue:"true"},{name:"languages",label:"Idiomas",type:"repeatable",sectionId:"languages",subFields:[{name:"idioma",label:"Idioma",type:"select",options:["Português","Inglês","Francês","Chinês","Espanhol","Macua"]},{name:"leitura",label:"Leitura",type:"select",options:["Excelente","Razoável"]},{name:"fala",label:"Fala",type:"select",options:["Excelente","Razoável"]},{name:"escrita",label:"Escrita",type:"select",options:["Excelente","Razoável"]}]},{name:"section_social_skills",label:"VII. APTIDÕES E COMPETÊNCIAS SOCIAIS",type:"section_toggle",defaultValue:"true"},{name:"social_skills_list",label:"Lista de Aptidões",type:"list",sectionId:"social_skills",defaultValue:["Espírito de liderança.","Boa capacidade de comunicação e de relacionamento interpessoal.","Responsabilidade, honestidade e dinamismo.","Capacidade de trabalhar sob pressão.","Capacidade de planificação, organização e execução de actividades.","Espírito de equipa e facilidade de adaptação a novos grupos multiculturais.","Criatividade e iniciativa."]},{name:"section_references",label:"VIII. REFERÊNCIAS",type:"section_toggle",defaultValue:"true"},{name:"references_list",label:"Lista de Referências",type:"list",sectionId:"references"}],version:3,active:!0,createdAt:new Date,updatedAt:new Date},{id:"loan_simple",name:"Declaração Simples de Empréstimo",type:"client",template:`
      <div class="leading-normal formal-doc" style="line-height:1.3;">
        <h1 class="text-xl font-bold text-center mb-6">DECLARAÇÃO</h1>
        <p class="mb-6 text-justify">Eu, <strong>{{NOME_DECLARANTE}}</strong><span data-field-id="declarante_bi_block">, portador do BI nº <strong>{{NUM_BI_DECLARANTE}}</strong></span>, residente em {{ENDERECO_DECLARANTE}}, <strong>DECLARO</strong> para os devidos efeitos que solicitei junto à empresa <strong>{{NOME_EMPRESA}}</strong> um empréstimo no valor de <strong>{{VALOR_EXTENSO}} ({{VALOR_NUM}} MZN)</strong>.</p>
        <p class="mb-6 text-justify">Fica estabelecido que o reembolso será efetuado em prestações mensais no valor de <strong>{{VALOR_PRESTACAO_EXTENSO}} ({{VALOR_PRESTACAO}} MZN)</strong>, com início no mês de <strong>{{MES_ANO_INICIO}}</strong>, conforme acordo celebrado entre as partes.</p>
        <p class="mb-10 text-justify">Mais declaro estar ciente das condições assumidas e <strong>COMPROMETO-ME</strong> a cumprir rigorosamente com o pagamento até à <strong>liquidação total</strong> da dívida.</p>
        <p class="mb-8 text-justify">Por ser verdade e me ter sido solicitado, firmo a presente declaração.</p>
        <p class="text-center signature-block mb-10"><span class="local">{{LOCAL}}</span>, <span class="data">{{DATA}}</span>.</p>
        <div class="signature-wrapper mt-12">
          <div class="signature-line">
            <p>Assinatura do Empregado</p>
            <hr />
          </div>
          <div class="signature-line">
            <p>Assinatura do Empregador</p>
            <hr />
          </div>
        </div>
      </div>
    `,fields:[{name:"NOME_DECLARANTE",label:"Nome do Declarante",type:"text",required:!0},{name:"show_declarante_bi",label:"Exibir BI do Declarante",type:"section_toggle",defaultValue:"true"},{name:"NUM_BI_DECLARANTE",label:"Nº do BI do Declarante",type:"text",dependsOn:"show_declarante_bi"},{name:"ENDERECO_DECLARANTE",label:"Endereço do Declarante",type:"text",required:!0},{name:"NOME_EMPRESA",label:"Nome da Empresa",type:"text",required:!0},{name:"VALOR_NUM",label:"Valor do Empréstimo (numérico)",type:"number",required:!0},{name:"VALOR_EXTENSO",label:"Valor do Empréstimo (por extenso)",type:"text",required:!0},{name:"VALOR_PRESTACAO",label:"Valor da Prestação (numérico)",type:"number",required:!0},{name:"VALOR_PRESTACAO_EXTENSO",label:"Valor da Prestação (por extenso)",type:"text",required:!0},{name:"MES_ANO_INICIO",label:"Mês e Ano de Início",type:"text",required:!0},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"text",required:!0,defaultValue:"aos {{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"loan_employee_employer",name:"Declaração de Empréstimo — Empregado/Patrão",type:"client",template:`
      <div class="leading-normal formal-doc" style="line-height:1.3;">
        <h1 class="text-xl font-bold text-center mb-6">DECLARAÇÃO DE EMPRÉSTIMO</h1>
        <p class="mb-6 text-justify">Eu, <strong>{{NOME_EMPREGADO}}</strong>, de nacionalidade moçambicana<span data-field-id="empregado_bi_block">, portador do BI nº <strong>{{NUM_BI_EMPREGADO}}</strong>, emitido em {{LOCAL_EMISSAO_BI}} em <strong>{{DATA_EMISSAO_BI}}</strong></span>, residente no bairro {{BAIRRO_EMPREGADO}}, <strong>DECLARO</strong> para os devidos efeitos que solicitei ao meu empregador, <strong>{{NOME_PATRÃO}}</strong>, um empréstimo no valor de <strong>{{VALOR_EXTENSO}} Meticais ({{VALOR_NUM}} MZN)</strong>.</p>
        <p class="mb-6 text-justify">O referido valor será utilizado para fins pessoais e <strong>COMPROMETO-ME</strong> a reembolsá-lo <strong>integralmente</strong>, em prestações mensais no valor de <strong>{{VALOR_PRESTACAO}} Meticais</strong>, com início no mês de <strong>{{MES_ANO_INICIO}}</strong>, até à <strong>liquidação total</strong> do montante emprestado.</p>
        <p class="mb-6 text-justify">Declaro ainda estar ciente e de acordo com os termos estabelecidos.</p>
        <p class="mb-8 text-justify">Por ser verdade, firmo a presente declaração.</p>
        <p class="text-center signature-block mb-10"><span class="local">{{LOCAL}}</span>, <span class="data">{{DATA}}</span>.</p>
        <div class="signature-wrapper mt-12">
          <div class="signature-line">
            <p>Assinatura do Empregado</p>
            <hr />
          </div>
          <div class="signature-line">
            <p>Assinatura do Empregador</p>
            <hr />
          </div>
        </div>
      </div>
    `,fields:[{name:"NOME_EMPREGADO",label:"Nome do Empregado",type:"text",required:!0},{name:"show_empregado_bi",label:"Exibir BI do Empregado",type:"section_toggle",defaultValue:"true"},{name:"NUM_BI_EMPREGADO",label:"Nº do BI do Empregado",type:"text",dependsOn:"show_empregado_bi"},{name:"LOCAL_EMISSAO_BI",label:"Local de Emissão do BI",type:"text",dependsOn:"show_empregado_bi"},{name:"DATA_EMISSAO_BI",label:"Data de Emissão do BI",type:"date",dependsOn:"show_empregado_bi"},{name:"BAIRRO_EMPREGADO",label:"Bairro de Residência do Empregado",type:"text",required:!0},{name:"NOME_PATRÃO",label:"Nome do Empregador",type:"text",required:!0},{name:"VALOR_EXTENSO",label:"Valor do Empréstimo (por extenso)",type:"text",required:!0},{name:"VALOR_NUM",label:"Valor do Empréstimo (numérico)",type:"number",required:!0},{name:"VALOR_PRESTACAO",label:"Valor da Prestação (numérico)",type:"number",required:!0},{name:"MES_ANO_INICIO",label:"Mês e Ano de Início",type:"text",required:!0},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"text",required:!0,defaultValue:"aos {{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"loan_single_payment",name:"Declaração de Empréstimo — Credor/Devedor (Pagamento Único)",type:"client",template:`
      <div class="leading-normal">
        <h1 class="text-xl font-bold text-center mb-10">DECLARAÇÃO DE EMPRÉSTIMO</h1>
        <p class="mb-6 text-justify">Eu, <strong>{{NOME_CREDOR}}</strong><span data-field-id="credor_doc_block">, portador do {{TIPO_DOC_CREDOR}} nº <strong>{{NUM_DOC_CREDOR}}</strong></span>, residente em {{ENDERECO_CREDOR}}, <strong>DECLARO</strong> que emprestei a <strong>{{NOME_DEVEDOR}}</strong><span data-field-id="devedor_doc_block">, portador do {{TIPO_DOC_DEVEDOR}} nº <strong>{{NUM_DOC_DEVEDOR}}</strong></span>, residente em {{ENDERECO_DEVEDOR}}, a quantia de <strong>{{VALOR_EXTENSO}} Meticais ({{VALOR_NUM}} MZN)</strong>.</p>
        <p class="mb-6 text-justify">Fica acordado que o montante será devolvido <strong>integralmente</strong> no dia <strong>{{DATA_PAGAMENTO}}</strong>, sem parcelamento.</p>
        <p class="mb-10 text-justify">Mais declaro que ambas as partes estão cientes e de acordo.</p>
        <p class="text-center signature-block mb-10"><span class="local">{{LOCAL}}</span>, <span class="data">{{DATA}}</span></p>
        <div class="signature-wrapper mt-16">
          <div class="signature-line">
            <p>Assinatura do Devedor</p>
            <hr />
          </div>
          <div class="signature-line">
            <p>Assinatura do Credor</p>
            <hr />
          </div>
        </div>
      </div>
    `,fields:[{name:"NOME_CREDOR",label:"Nome do Credor",type:"text",required:!0},{name:"show_credor_doc",label:"Exibir Documento do Credor",type:"section_toggle",defaultValue:"true"},{name:"TIPO_DOC_CREDOR",label:"Tipo de Documento do Credor",type:"text",dependsOn:"show_credor_doc",defaultValue:"BI"},{name:"NUM_DOC_CREDOR",label:"Nº do Documento do Credor",type:"text",dependsOn:"show_credor_doc"},{name:"ENDERECO_CREDOR",label:"Endereço do Credor",type:"text",required:!0},{name:"NOME_DEVEDOR",label:"Nome do Devedor",type:"text",required:!0},{name:"show_devedor_doc",label:"Exibir Documento do Devedor",type:"section_toggle",defaultValue:"true"},{name:"TIPO_DOC_DEVEDOR",label:"Tipo de Documento do Devedor",type:"text",dependsOn:"show_devedor_doc",defaultValue:"BI"},{name:"NUM_DOC_DEVEDOR",label:"Nº do Documento do Devedor",type:"text",dependsOn:"show_devedor_doc"},{name:"ENDERECO_DEVEDOR",label:"Endereço do Devedor",type:"text",required:!0},{name:"VALOR_EXTENSO",label:"Valor (por extenso)",type:"text",required:!0},{name:"VALOR_NUM",label:"Valor (numérico)",type:"number",required:!0},{name:"DATA_PAGAMENTO",label:"Data de Pagamento Integral",type:"date",required:!0},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"text",required:!0,defaultValue:"aos {{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"loan_guarantee",name:"Declaração de Empréstimo com Garantia",type:"client",template:`
      <div class="formal-doc" style="line-height:1.3;">
        <h1 class="text-xl font-bold text-center mb-6">DECLARAÇÃO DE EMPRÉSTIMO COM GARANTIA</h1>
        <p class="mb-4 text-justify">Eu, <strong>{{NOME_DEVEDOR}}</strong><span data-field-id="devedor_doc_block">, portador do {{TIPO_DOC_DEVEDOR}} nº <strong>{{NUM_DOC_DEVEDOR}}</strong></span>, residente em {{ENDERECO_DEVEDOR}}, <strong>DECLARO</strong> que recebi de <strong>{{NOME_CREDOR}}</strong><span data-field-id="credor_doc_block">, portador do {{TIPO_DOC_CREDOR}} nº <strong>{{NUM_DOC_CREDOR}}</strong></span>, residente em {{ENDERECO_CREDOR}}, a quantia de <strong>{{VALOR_EXTENSO}} Meticais ({{VALOR_NUM}} MZN)</strong>.</p>
        <p class="mb-4 text-justify">Fica acordado que o valor será devolvido até o dia <strong>{{DATA_PAGAMENTO}}</strong>.</p>
        <p class="mb-4 text-justify">Como forma de <strong>GARANTIA</strong>, coloco à disposição o bem: <strong>{{DESCRICAO_BEM}}</strong>.</p>
        <p class="mb-6 text-justify">Em caso de incumprimento, o credor fica autorizado a confiscar o referido bem como compensação.</p>
        <p class="signature-block mb-6"><span class="local">{{LOCAL}}</span>, <span class="data">{{DATA}}</span></p>
        <div class="signature-wrapper mt-12">
          <div class="signature-line">
            <p>Assinatura do Devedor</p>
            <hr />
          </div>
          <div class="signature-line">
            <p>Assinatura do Credor</p>
            <hr />
          </div>
        </div>
      </div>
    `,fields:[{name:"NOME_DEVEDOR",label:"Nome do Devedor",type:"text",required:!0},{name:"show_devedor_doc",label:"Exibir Documento do Devedor",type:"section_toggle",defaultValue:"true"},{name:"TIPO_DOC_DEVEDOR",label:"Tipo de Documento do Devedor",type:"text",dependsOn:"show_devedor_doc",defaultValue:"BI"},{name:"NUM_DOC_DEVEDOR",label:"Nº do Documento do Devedor",type:"text",dependsOn:"show_devedor_doc"},{name:"ENDERECO_DEVEDOR",label:"Endereço do Devedor",type:"text",required:!0},{name:"NOME_CREDOR",label:"Nome do Credor",type:"text",required:!0},{name:"show_credor_doc",label:"Exibir Documento do Credor",type:"section_toggle",defaultValue:"true"},{name:"TIPO_DOC_CREDOR",label:"Tipo de Documento do Credor",type:"text",dependsOn:"show_credor_doc",defaultValue:"BI"},{name:"NUM_DOC_CREDOR",label:"Nº do Documento do Credor",type:"text",dependsOn:"show_credor_doc"},{name:"ENDERECO_CREDOR",label:"Endereço do Credor",type:"text",required:!0},{name:"VALOR_EXTENSO",label:"Valor (por extenso)",type:"text",required:!0},{name:"VALOR_NUM",label:"Valor (numérico)",type:"number",required:!0},{name:"DATA_PAGAMENTO",label:"Data Limite de Pagamento",type:"date",required:!0},{name:"DESCRICAO_BEM",label:"Descrição do Bem em Garantia",type:"textarea",required:!0},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"text",required:!0,defaultValue:"aos {{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"payment_commitment",name:"Declaração de Compromisso de Pagamento",type:"client",template:`
      <div class="leading-normal">
        <h1 class="text-xl font-bold text-center mb-10">DECLARAÇÃO DE COMPROMISSO DE PAGAMENTO</h1>
        <p class="mb-6 text-justify">Eu, <strong>{{NOME_COMPRADOR}}</strong><span data-field-id="comprador_doc_block">, portador do {{TIPO_DOC_COMPRADOR}} nº <strong>{{NUM_DOC_COMPRADOR}}</strong></span>, residente em {{ENDERECO_COMPRADOR}}, <strong>DECLARO</strong> que adquiri de <strong>{{NOME_VENDEDOR}}</strong><span data-field-id="vendedor_doc_block">, portador do {{TIPO_DOC_VENDEDOR}} nº <strong>{{NUM_DOC_VENDEDOR}}</strong></span>, residente em {{ENDERECO_VENDEDOR}}, o seguinte bem/serviço: <strong>{{DESCRICAO_BEM_SERVICO}}</strong>, pelo valor total de <strong>{{VALOR_EXTENSO}} Meticais ({{VALOR_NUM}} MZN)</strong>.</p>
        <p class="mb-6 text-justify">Até à presente data, já efetuei o pagamento de <strong>{{VALOR_PAGO}} MZN</strong>, restando em aberto <strong>{{VALOR_FALTA}} MZN</strong>.</p>
        <p class="mb-10 text-justify"><strong>COMPROMETO-ME</strong> a liquidar o valor em falta até o dia <strong>{{DATA_PAGAMENTO}}</strong>.</p>
        <p class="text-center signature-block mb-10"><span class="local">{{LOCAL}}</span>, <span class="data">{{DATA}}</span></p>
        <div class="signature-wrapper mt-16">
          <div class="signature-line">
            <p>Assinatura do Comprador</p>
            <hr />
          </div>
          <div class="signature-line">
            <p>Assinatura do Vendedor</p>
            <hr />
          </div>
        </div>
      </div>
    `,fields:[{name:"NOME_COMPRADOR",label:"Nome do Comprador/Devedor",type:"text",required:!0},{name:"show_comprador_doc",label:"Exibir Documento do Comprador",type:"section_toggle",defaultValue:"true"},{name:"TIPO_DOC_COMPRADOR",label:"Tipo de Documento do Comprador",type:"text",dependsOn:"show_comprador_doc",defaultValue:"BI"},{name:"NUM_DOC_COMPRADOR",label:"Nº do Documento do Comprador",type:"text",dependsOn:"show_comprador_doc"},{name:"ENDERECO_COMPRADOR",label:"Endereço do Comprador",type:"text",required:!0},{name:"NOME_VENDEDOR",label:"Nome do Vendedor/Credor",type:"text",required:!0},{name:"show_vendedor_doc",label:"Exibir Documento do Vendedor",type:"section_toggle",defaultValue:"true"},{name:"TIPO_DOC_VENDEDOR",label:"Tipo de Documento do Vendedor",type:"text",dependsOn:"show_vendedor_doc",defaultValue:"BI"},{name:"NUM_DOC_VENDEDOR",label:"Nº do Documento do Vendedor",type:"text",dependsOn:"show_vendedor_doc"},{name:"ENDERECO_VENDEDOR",label:"Endereço do Vendedor",type:"text",required:!0},{name:"DESCRICAO_BEM_SERVICO",label:"Descrição do Bem/Serviço",type:"text",required:!0},{name:"VALOR_EXTENSO",label:"Valor Total (por extenso)",type:"text",required:!0},{name:"VALOR_NUM",label:"Valor Total (numérico)",type:"number",required:!0},{name:"VALOR_PAGO",label:"Valor já Pago (numérico)",type:"number",required:!0},{name:"VALOR_FALTA",label:"Valor em Falta (numérico)",type:"number",required:!0},{name:"DATA_PAGAMENTO",label:"Data Limite de Pagamento",type:"date",required:!0},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"text",required:!0,defaultValue:"aos {{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"honor_commitment_declaration",name:"Declaração sob Compromisso de Honra",type:"client",template:`
      <div class="leading-normal">
        <h1 class="text-xl font-bold text-center mb-10">DECLARAÇÃO SOB COMPROMISSO DE HONRA</h1>
        <p class="mb-6 text-justify" style="margin-left: 3rem;">Eu, <strong>{{NOME_COMPLETO}}</strong>, filho(a) de <strong>{{NOME_PAI}}</strong> e de <strong>{{NOME_MAE}}</strong>, <strong>{{ESTADO_CIVIL}}</strong>, natural de <strong>{{NATURALIDADE}}</strong>, província de <strong>{{PROVINCIA}}</strong><span data-field-id="bi_block">, portador(a) do B.I nº <strong>{{NUM_BI}}</strong>, emitido pela Identificação Civil de <strong>{{LOCAL_EMISSAO}}</strong>, aos <strong>{{DATA_EMISSAO}}</strong></span>, declaro sob minha honra que:</p>
        <ol class="list-[lower-alpha] pl-6 space-y-2 mb-6 text-justify">
          <li>Disponho de saúde mental e física para realizar as atividades no serviço público;</li>
          <li>Não estou em processo de aposentadoria;</li>
          <li>Jamais fui excluído(a) de uma instituição pública ou governamental;</li>
          <li>Nunca recebi uma sentença de prisão, seja por crime leve ou grave;</li>
          <li>Nunca fui penalizado(a) por crime que desonrasse minha reputação ou por qualquer outro delito claramente incompatível com o exercício de funções públicas.</li>
        </ol>
        <p class="mb-10 text-justify">Para que se firme a verdade, assino a presente declaração e assumo a responsabilidade da informação prestada, sob as penas da Lei.</p>
        <p class="text-center signature-block mb-10"><span class="local">{{LOCAL}}</span>, <span class="data">{{DATA}}</span>.</p>
        <div class="text-center mt-24">
          <p class="border-t border-black w-2/3 mx-auto pt-2">(Assinatura)</p>
          <p>(<strong>{{NOME_COMPLETO}}</strong>)</p>
        </div>
      </div>
    `,fields:[{name:"NOME_COMPLETO",label:"Nome Completo",type:"text",required:!0},{name:"NOME_PAI",label:"Nome do Pai",type:"text",required:!0},{name:"NOME_MAE",label:"Nome da Mãe",type:"text",required:!0},{name:"ESTADO_CIVIL",label:"Estado Civil",type:"text",required:!0},{name:"NATURALIDADE",label:"Naturalidade",type:"text",required:!0},{name:"PROVINCIA",label:"Província",type:"text",required:!0},{name:"show_bi",label:"Exibir B.I.",type:"section_toggle",defaultValue:"true"},{name:"NUM_BI",label:"Nº do B.I.",type:"text",dependsOn:"show_bi"},{name:"LOCAL_EMISSAO",label:"Local de Emissão do B.I.",type:"text",dependsOn:"show_bi"},{name:"DATA_EMISSAO",label:"Data de Emissão do B.I.",type:"date",dependsOn:"show_bi"},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"text",required:!0,defaultValue:"aos {{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"application_request",name:"Requerimento para Secretário de Estado",type:"client",template:`
      <div class="leading-normal" style="padding-top: 5rem;">
        <p class="mb-4 uppercase">SUA EXCIA. SECRETÁRIO DE ESTADO DA PROVÍNCIA DE <strong>{{PROVINCIA}}</strong></p>
        <p class="mb-10">= <strong>{{LOCAL}}</strong> =</p>
        <p class="mb-6 text-justify">Eu, <strong>{{NOME_COMPLETO}}</strong>, filho(a) de <strong>{{NOME_PAI}}</strong> e de <strong>{{NOME_MAE}}</strong>, natural de <strong>{{NATURALIDADE}}</strong><span data-field-id="bi_block">, portador(a) do B.I nº <strong>{{NUM_BI}}</strong>, emitido em <strong>{{LOCAL_EMISSAO}}</strong> aos <strong>{{DATA_EMISSAO}}</strong></span>, venho por meio desta requerer a V. Excia. se digne autorizar a minha admissão no concurso de ingresso na carreira de <strong>{{CARGO}}</strong>, nos termos do artigo 8 do REGFAE, aprovado pelo Decreto nº 32/2023, de 8 de Junho, a que se refere o aviso publicado no Jornal Notícias, no dia <strong>{{DATA_PUBLICACAO}}</strong>, e afixado na vitrina do <strong>{{INSTITUICAO}}</strong> em igual data.</p>
        <p class="mb-10">Pede deferimento.</p>
        <p class="text-center signature-block mb-10"><span class="local">{{LOCAL}}</span>, <span class="data">{{DATA}}</span>.</p>
        <div class="text-center mt-24">
          <p class="border-t border-black w-2/3 mx-auto pt-2">(Assinatura)</p>
          <p>(<strong>{{NOME_COMPLETO}}</strong>)</p>
        </div>
      </div>
    `,fields:[{name:"PROVINCIA",label:"Província",type:"text",required:!0,defaultValue:"Nampula"},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"NOME_COMPLETO",label:"Nome Completo",type:"text",required:!0},{name:"NOME_PAI",label:"Nome do Pai",type:"text",required:!0},{name:"NOME_MAE",label:"Nome da Mãe",type:"text",required:!0},{name:"NATURALIDADE",label:"Naturalidade",type:"text",required:!0},{name:"show_bi",label:"Exibir B.I.",type:"section_toggle",defaultValue:"true"},{name:"NUM_BI",label:"Nº do B.I.",type:"text",dependsOn:"show_bi"},{name:"LOCAL_EMISSAO",label:"Local de Emissão do B.I.",type:"text",dependsOn:"show_bi"},{name:"DATA_EMISSAO",label:"Data de Emissão do B.I.",type:"date",dependsOn:"show_bi"},{name:"CARGO",label:"Carreira/Cargo",type:"text",required:!0},{name:"DATA_PUBLICACAO",label:"Data de Publicação do Aviso",type:"date",required:!0},{name:"INSTITUICAO",label:"Instituição",type:"text",required:!0},{name:"DATA",label:"Data do Requerimento",type:"text",required:!0,defaultValue:"aos {{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"application_request_municipal",name:"Requerimento para Conselho Municipal",type:"client",template:`
      <div class="leading-normal" style="padding-top: 5rem;">
        <p class="mb-4">Exmo. Senhor<br/><strong>{{DESTINATARIO_CARGO}}</strong></p>
        <p class="my-10">Excelência</p>
        <p class="mb-6 text-justify">
          <strong>{{NOME_COMPLETO}}</strong>, {{ESTADO_CIVIL}}, nascido(a) aos <strong>{{DATA_NASCIMENTO}}</strong>, filho(a) de <strong>{{NOME_PAI}}</strong> e de <strong>{{NOME_MAE}}</strong>, natural de <strong>{{NATURALIDADE}}</strong>, residente no <strong>{{ENDERECO_COMPLETO}}</strong><span data-field-id="bi_block">, titular de bilhete de Identidade nº <strong>{{NUM_BI}}</strong> emitido em <strong>{{DATA_EMISSAO_BI}}</strong>, pelo arquivo de identificação de <strong>{{LOCAL_EMISSAO_BI}}</strong></span>, vem por este meio requerer a V. Excia se digne autorizar a sua admissão para o provimento de vaga na carreira de <strong>{{CARGO_VAGA}}</strong> a que se refere o aviso publicado no <strong>{{JORNAL_AVISO}}</strong> no dia <strong>{{DATA_AVISO}}</strong>.
        </p>
        <p class="mb-10 text-justify">Para o que junta <strong>{{DOCUMENTOS_ANEXOS}}</strong> pelo que:</p>
        <p class="text-center mb-10">Pede deferimento</p>
        <p class="text-center mb-16">{{LOCAL}}, aos {{DATA}}.</p>
        <div class="text-center mt-24">
          <p class="border-t border-black w-2/3 mx-auto"></p>
        </div>
      </div>
    `,fields:[{name:"DESTINATARIO_CARGO",label:"Cargo do Destinatário",type:"text",required:!0,defaultValue:"Presidente do Conselho Municipal da Cidade de Nampula"},{name:"NOME_COMPLETO",label:"Nome Completo",type:"text",required:!0},{name:"ESTADO_CIVIL",label:"Estado Civil",type:"text",required:!0,defaultValue:"Solteiro(a)"},{name:"DATA_NASCIMENTO",label:"Data de Nascimento",type:"date",required:!0},{name:"NOME_PAI",label:"Nome do Pai",type:"text",required:!0},{name:"NOME_MAE",label:"Nome da Mãe",type:"text",required:!0},{name:"NATURALIDADE",label:"Naturalidade",type:"text",required:!0,defaultValue:"Nampula"},{name:"ENDERECO_COMPLETO",label:"Endereço Completo",type:"text",required:!0,defaultValue:"Bairro de Namicopo"},{name:"show_bi",label:"Exibir B.I.",type:"section_toggle",defaultValue:"true"},{name:"NUM_BI",label:"Nº do B.I.",type:"text",dependsOn:"show_bi"},{name:"DATA_EMISSAO_BI",label:"Data de Emissão do B.I.",type:"date",dependsOn:"show_bi"},{name:"LOCAL_EMISSAO_BI",label:"Local de Emissão do B.I.",type:"text",dependsOn:"show_bi",defaultValue:"Nampula"},{name:"CARGO_VAGA",label:"Vaga/Carreira",type:"text",required:!0,defaultValue:"Auxiliar área de formação/ocupação de 7ª classe"},{name:"JORNAL_AVISO",label:"Jornal do Aviso",type:"text",required:!0,defaultValue:"Jornal Notícias"},{name:"DATA_AVISO",label:"Data de Publicação do Aviso",type:"date",required:!0},{name:"DOCUMENTOS_ANEXOS",label:"Documentos Anexos",type:"text",required:!0,defaultValue:"Currículo Vitae, bilhete de identidade e certidão de habilitações literárias"},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data do Requerimento",type:"text",required:!0,defaultValue:"{{currentDate}}"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"honor_commitment_stae",name:"Declaração de Honra (Concurso STAE)",type:"client",template:`
      <div class="leading-relaxed text-sm">
        <h1 class="text-xl font-bold text-center mb-10">DECLARAÇÃO SOB COMPROMISSO DE HONRA</h1>
        <p class="mb-2"><strong>EXMO.</strong></p>
        <p class="mb-8"><strong>SENHOR {{DESTINATARIO_CARGO}} {{DESTINATARIO_LOCAL}}</strong></p>
        <p class="text-justify mb-6">
          <strong>{{NOME_COMPLETO}}</strong>, {{ESTADO_CIVIL}}, nascido(a) a <strong>{{DATA_NASCIMENTO}}</strong>, filho(a) de <strong>{{NOME_PAI}}</strong> e de <strong>{{NOME_MAE}}</strong>, natural de <strong>{{NATURALIDADE}}</strong>, residente em <strong>{{ENDERECO_COMPLETO}}</strong><span data-field-id="bi_block">, titular do BI nº <strong>{{NUM_BI}}</strong>, emitido aos <strong>{{DATA_EMISSAO_BI}}</strong>, pelo arquivo de identificação de <strong>{{LOCAL_EMISSAO_BI}}</strong></span>, vem requerer a V.Excia se digne autorizar a sua admissão ao concurso do ingresso para provimento de vaga de <strong>{{CARGO_CONCURSO}}</strong> a que se refere o aviso publicado pelo <strong>{{JORNAL_AVISO}}</strong> de <strong>{{DATA_AVISO}}</strong>, e junta <strong>{{DOCUMENTOS_ANEXOS}}</strong>.
        </p>
        <p class="text-justify mb-4">O referente declara sob compromisso de honra que:</p>
        <ol class="list-[lower-alpha] pl-16 space-y-2 mb-8 text-justify" style="margin-left: 3rem;">
          <li>{{CLAUSULA_A}}</li>
          <li>{{CLAUSULA_B}}</li>
          <li>{{CLAUSULA_C}}</li>
          <li>{{CLAUSULA_D}}</li>
        </ol>
        <p class="text-center my-8">Pede deferimento</p>
        <p class="text-center mb-16">{{LOCAL}}, {{DATA}}.</p>
        <div class="text-center mt-24">
          <hr class="border-black w-1/2 mx-auto"/>
        </div>
      </div>
    `,fields:[{name:"DESTINATARIO_CARGO",label:"Cargo do Destinatário",type:"text",required:!0},{name:"DESTINATARIO_LOCAL",label:"Local do Destinatário",type:"text",required:!0},{name:"NOME_COMPLETO",label:"Nome Completo",type:"text",required:!0},{name:"ESTADO_CIVIL",label:"Estado Civil",type:"text",required:!0},{name:"DATA_NASCIMENTO",label:"Data de Nascimento",type:"date",required:!0},{name:"NOME_PAI",label:"Nome do Pai",type:"text",required:!0},{name:"NOME_MAE",label:"Nome da Mãe",type:"text",required:!0},{name:"NATURALIDADE",label:"Naturalidade",type:"text",required:!0},{name:"ENDERECO_COMPLETO",label:"Endereço Completo",type:"text",required:!0},{name:"show_bi",label:"Exibir B.I.",type:"section_toggle",defaultValue:"true"},{name:"NUM_BI",label:"Nº do B.I.",type:"text",dependsOn:"show_bi"},{name:"DATA_EMISSAO_BI",label:"Data de Emissão do B.I.",type:"date",dependsOn:"show_bi"},{name:"LOCAL_EMISSAO_BI",label:"Local de Emissão do B.I.",type:"text",dependsOn:"show_bi"},{name:"CARGO_CONCURSO",label:"Vaga/Cargo do Concurso",type:"text",required:!0},{name:"JORNAL_AVISO",label:"Jornal do Aviso",type:"text",required:!0,defaultValue:"Jornal Notícias"},{name:"DATA_AVISO",label:"Data de Publicação do Aviso",type:"date",required:!0},{name:"DOCUMENTOS_ANEXOS",label:"Documentos Anexos",type:"text",required:!0,defaultValue:"Certidão de habilitações, fotocópia de BI e Currículo Vitae"},{name:"CLAUSULA_A",label:"Cláusula (a)",type:"textarea",required:!0,defaultValue:"Nunca fui expulso do aparelho de Estado e não me encontro na situação de aposentado ou reformado."},{name:"CLAUSULA_B",label:"Cláusula (b)",type:"textarea",required:!0,defaultValue:"Tenho sanidade mental e capacidade física para o desempenho das funções."},{name:"CLAUSULA_C",label:"Cláusula (c)",type:"textarea",required:!0,defaultValue:"Nunca fui condenado por crime contra a segurança do Estado ou ato desonroso."},{name:"CLAUSULA_D",label:"Cláusula (d)",type:"textarea",required:!0,defaultValue:"Tenho a situação militar regularizada."},{name:"LOCAL",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"date",required:!0}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"job_application_letter",name:"Carta de Pedido de Emprego",type:"client",template:`
      <div class="leading-normal">
        <h1 class="text-xl font-bold text-center mb-10">CARTA DE PEDIDO DE EMPREGO</h1>
        <p class="mb-2">À<br/><strong>{{NOME_EMPRESA_DESTINO}}</strong><br/>{{DEPARTAMENTO_DESTINO}}</p>
        <p class="text-justify my-8">
          Eu, <strong>{{NOME_CANDIDATO}}</strong>, de nacionalidade <strong>{{NACIONALIDADE}}</strong>, <strong>{{ESTADO_CIVIL}}</strong>, de profissão <strong>{{PROFISSAO}}</strong>, residente no <strong>{{ENDERECO}}</strong>, portador do telefone: <strong>{{TELEFONE}}</strong>, venho por meio desta expressar o meu interesse e apresentar a minha candidatura à vaga de <strong>{{VAGA}}</strong> nesta empresa, anexando nesta oportunidade meu currículo, que demonstra minha formação acadêmica e experiência profissional.
        </p>
        <p class="text-justify mb-8">
          Estou motivado a me juntar à sua equipe pelo amor que tenho à minha profissão e pelas oportunidades que a empresa oferece aos seus funcionários.
        </p>
        <p class="text-justify mb-8">Sem mais no momento, submeto-me atenciosamente.</p>
        <p class="text-center my-8">{{LOCAL_DATA}}, {{DATA}}</p>
        <div class="text-center mt-24" style="padding-top: 3rem;">
          <p class="border-t border-black w-2/3 mx-auto"></p>
          <p class="mt-2">(<strong>{{NOME_CANDIDATO}}</strong>)</p>
        </div>
      </div>
    `,fields:[{name:"NOME_EMPRESA_DESTINO",label:"Nome da Empresa Destino",type:"text",required:!0,defaultValue:"YolaSegurança"},{name:"DEPARTAMENTO_DESTINO",label:"Departamento Destino",type:"text",required:!0,defaultValue:"Departamento de Recursos Humanos"},{name:"NOME_CANDIDATO",label:"Nome do Candidato",type:"text",required:!0,defaultValue:"FRANCISCO ANTINANE"},{name:"NACIONALIDADE",label:"Nacionalidade",type:"text",required:!0,defaultValue:"Moçambicana"},{name:"ESTADO_CIVIL",label:"Estado Civil",type:"text",required:!0,defaultValue:"Casado"},{name:"PROFISSAO",label:"Profissão",type:"text",required:!0,defaultValue:"Motorista"},{name:"ENDERECO",label:"Endereço",type:"text",required:!0,defaultValue:"Bairro de Carrupeia, Cidade de Nampula"},{name:"TELEFONE",label:"Telefone",type:"text",required:!0,defaultValue:"868466261"},{name:"VAGA",label:"Vaga Pretendida",type:"text",required:!0,defaultValue:"Motorista"},{name:"LOCAL_DATA",label:"Local",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA",label:"Data",type:"text",required:!0,defaultValue:"aos 06 de Agosto de 2025"}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"cover_letter",name:"Carta de Apresentação para Emprego",type:"client",template:`
      <div class="leading-normal">
        <h1 class="text-xl font-bold text-center mb-10">CARTA DE APRESENTAÇÃO PARA EMPREGO</h1>
        <p class="text-right mb-8">{{LOCALIDADE}}, {{DATA_COMPLETA}}.</p>
        <p class="mb-4">À <strong>{{NOME_EMPRESA}}</strong><br/>Departamento de Recursos Humanos</p>
        <p class="text-justify my-8">
          Por meio desta, venho me candidatar a uma vaga de emprego no quadro de funcionários desta empresa, anexando nesta oportunidade o meu currículo. Acredito que minha experiência profissional e formação acadêmica me conferem as prerrogativas necessárias para contribuir com o crescimento desta empresa.
        </p>
        <p class="text-justify mb-8">
          Posso destacar entre minhas qualidades profissionais a eficiência, dedicação, pontualidade, boa interação com colegas de trabalho, dentre outras que poderei demonstrar caso seja selecionado.
        </p>
        <p class="text-justify mb-8">
          Coloco-me à disposição para contato e eventual solicitação de entrevista. Os meios de contato seguem abaixo.
        </p>
        <p class="my-8">Atenciosamente,</p>
        <div class="mt-16" style="padding-top: 3rem;">
          <p class="mb-12 text-center">Assinatura</p>
          <p class="border-t border-black w-2/3 mx-auto"></p>
          <p class="text-center mt-2"><strong>{{NOME_COMPLETO}}</strong></p>
          <p class="text-center">{{CONTATOS}}</p>
        </div>
      </div>
    `,fields:[{name:"LOCALIDADE",label:"Localidade",type:"text",required:!0,defaultValue:"Nampula"},{name:"DATA_COMPLETA",label:"Data (ex: 06 de Agosto de 2025)",type:"text",required:!0,defaultValue:"06 de Agosto de 2025"},{name:"NOME_EMPRESA",label:"Nome da Empresa",type:"text",required:!0},{name:"NOME_COMPLETO",label:"Seu Nome Completo",type:"text",required:!0},{name:"CONTATOS",label:"Seus Contatos (Endereço - Telefone - E-mail)",type:"text",required:!0}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"cover_letter_public",name:"Carta de Apresentação para Instituição Pública",type:"client",template:`
      <div class="leading-normal">
        <h1 class="text-xl font-bold text-center mb-10">CARTA DE APRESENTAÇÃO</h1>
        <p class="text-right mb-8"><strong>{{localidade}}</strong>, {{data_completa}}</p>
        <p class="mb-4">À<br/><strong>{{nome_instituicao}}</strong><br/>Departamento de Recursos Humanos</p>
        <p class="mb-4"><strong>Assunto:</strong> Candidatura a vaga de emprego</p>
        <p class="text-justify my-8">
          Venho, por meio desta, apresentar a minha candidatura para integrar o quadro de funcionários desta respeitável instituição pública. Anexo, para melhor apreciação, o meu currículo, que reflete a minha formação acadêmica e a experiência profissional adquirida ao longo dos anos.
        </p>
        <p class="text-justify mb-8">
          Coloco-me à disposição para desempenhar com zelo, dedicação e responsabilidade as funções que me forem atribuídas, contribuindo assim para o cumprimento da missão institucional e para o fortalecimento dos serviços prestados ao público.
        </p>
        <p class="text-justify mb-8">
          Estou disponível para fornecer informações adicionais e participar de entrevistas, conforme a conveniência desta instituição.
        </p>
        <p class="my-8">Sem mais, apresento os meus respeitosos cumprimentos.</p>
        <p class="my-8">Atenciosamente,</p>
        <div class="mt-24" style="padding-top: 3rem;">
          <p class="border-t border-black w-2/3 mx-auto"></p>
          <p class="text-center mt-2">(<strong>{{nome_completo}}</strong>)</p>
          <p class="text-center">{{contatos}}</p>
        </div>
      </div>
    `,fields:[{name:"localidade",label:"Localidade",type:"text",required:!0},{name:"data_completa",label:"Data por Extenso",type:"text",required:!0,defaultValue:"____ de __________ de 2025"},{name:"nome_instituicao",label:"Nome da Instituição Pública",type:"text",required:!0},{name:"nome_completo",label:"Seu Nome Completo",type:"text",required:!0},{name:"contatos",label:"Seus Contatos (Endereço – Telefone – E-mail)",type:"text",required:!0}],version:1,active:!0,createdAt:new Date,updatedAt:new Date},{id:"internship_request",name:"Carta de Solicitação de Estágio",type:"client",template:`
      <div class="leading-normal">
        <h1 class="text-xl font-bold text-center mb-10">CARTA DE SOLICITAÇÃO DE ESTÁGIO</h1>
        <p class="text-right mb-8"><strong>{{localidade}}</strong>, {{data_completa}}</p>
        <p class="mb-4">À<br/><strong>{{nome_empresa}}</strong><br/>Departamento de Recursos Humanos</p>
        <p class="mb-4"><strong>Assunto:</strong> Solicitação de Estágio</p>
        <p class="text-justify my-8">
          Venho, por meio desta, solicitar a possibilidade de realizar um estágio <strong>{{tipo_estagio}}</strong> nesta conceituada instituição, com o objetivo de aprimorar meus conhecimentos teóricos e desenvolver habilidades práticas relacionadas à minha área de formação acadêmica.
        </p>
        <p class="text-justify mb-8">
          Sou estudante do curso de <strong>{{nome_curso}}</strong> na <strong>{{nome_instituicao_ensino}}</strong>, e acredito que esta experiência será fundamental para o meu crescimento profissional e pessoal, além de contribuir para a aplicação prática dos conhecimentos adquiridos em sala de aula.
        </p>
        <p class="text-justify mb-8">
          Coloco-me à disposição para fornecer informações adicionais, participar de entrevistas e cumprir as normas estabelecidas por esta instituição no âmbito do estágio.
        </p>
        <p class="my-8">Sem mais para o momento, apresento os meus respeitosos cumprimentos.</p>
        <p class="my-8">Atenciosamente,</p>
        <div class="mt-24" style="padding-top: 3rem;">
          <p class="border-t border-black w-2/3 mx-auto"></p>
          <p class="text-center mt-2">(<strong>{{nome_completo}}</strong>)</p>
          <p class="text-center">{{contatos}}</p>
        </div>
      </div>
    `,fields:[{name:"localidade",label:"Localidade",type:"text",required:!0,defaultValue:"Nampula"},{name:"data_completa",label:"Data por Extenso",type:"text",required:!0,defaultValue:"____ de __________ de 2025"},{name:"nome_empresa",label:"Nome da Empresa ou Instituição",type:"text",required:!0},{name:"tipo_estagio",label:"Tipo de Estágio",type:"select",required:!0,options:["curricular","não curricular"],defaultValue:"curricular"},{name:"nome_curso",label:"Nome do Curso",type:"text",required:!0},{name:"nome_instituicao_ensino",label:"Nome da Instituição de Ensino",type:"text",required:!0},{name:"nome_completo",label:"Seu Nome Completo",type:"text",required:!0},{name:"contatos",label:"Seus Contatos (Endereço – Telefone – E-mail)",type:"text",required:!0}],version:1,active:!0,createdAt:new Date,updatedAt:new Date}].filter(a=>!["loan_declaration","vendor_declaration","commitment_term","honor_declaration","residence_declaration","service_contract","reference_letter"].includes(a.id)),U=B,L=U.map(a=>({...a})),C=(a,r)=>{const n=new Map;return a.forEach(s=>{n.set(s.id,s)}),r.forEach(s=>{const u=s.id??crypto.randomUUID?.()??String(Date.now());n.set(u,{...s,id:u})}),Array.from(n.values())},G=P(a=>({templates:L,generatedDocs:[],templatesLoading:!1,templatesError:null,templatesLoadedOnce:!1,setTemplates:r=>a({templates:r}),loadTemplates:async()=>{a({templatesLoading:!0,templatesError:null});try{const r=await T.list("document_templates"),n=Array.isArray(r?.data)?r?.data??[]:r?.data?[r.data]:[];a(s=>({templates:C(L,n),templatesLoading:!1,templatesLoadedOnce:!0}))}catch(r){console.error("Erro ao carregar templates do Supabase",r),a({templatesError:"Não foi possível carregar os modelos personalizados. Tente novamente mais tarde.",templatesLoading:!1,templatesLoadedOnce:!0})}},createTemplate:async r=>{const n={...r,id:r.id??crypto.randomUUID?.()??String(Date.now()),createdAt:r.createdAt??new Date().toISOString(),updatedAt:r.updatedAt??new Date().toISOString()};try{const s=await T.create("document_templates",n),u=Array.isArray(s?.data)?s?.data?.[0]??n:s?.data??n;return a(c=>({templates:C(c.templates,[u])})),u}catch(s){return console.error("Erro ao criar template no Supabase",s),a(u=>({templates:C(u.templates,[n])})),n}},updateTemplate:(r,n)=>{N.getState().addAuditLog({action:"update",resourceType:"DocumentTemplate",resourceId:r}),a(s=>({templates:s.templates.map(u=>u.id===r?{...u,...n,updatedAt:new Date}:u)}))},addGeneratedDoc:r=>{N.getState().addAuditLog({action:"create",resourceType:"GeneratedDocument",resourceId:r.id}),a(n=>({generatedDocs:[r,...n.generatedDocs]}))},deleteGeneratedDoc:r=>{N.getState().addAuditLog({action:"delete",resourceType:"GeneratedDocument",resourceId:r}),a(n=>({generatedDocs:n.generatedDocs.filter(s=>s.id!==r)}))}})),F=a=>a.type==="section_toggle"?typeof a.defaultValue=="boolean"?a.defaultValue:typeof a.defaultValue=="string"?a.defaultValue.toLowerCase()==="true":!1:a.type==="checklist"||a.type==="list"?Array.isArray(a.defaultValue)?a.defaultValue:typeof a.defaultValue=="string"?[a.defaultValue]:[]:a.defaultValue??"",z=a=>{const r={};return a.fields.forEach(n=>{r[n.name]=F(n)}),r.email_display="",r},v=(a,r,n)=>{let s=a;return r.fields.filter(c=>c.type==="section_toggle").forEach(c=>{const m=c.name.replace(/^section_/,"").replace(/^show_/,"");[{attr:"section",id:m},{attr:"field",id:m},{attr:"field",id:`${m}_block`},{attr:"section",id:`${m}_section`},{attr:"section",id:c.name},{attr:"field",id:c.name}].forEach(({attr:i,id:A})=>{if(!A)return;const h=new RegExp(`data-${i}-id="${A}"(?:\\s+style="display:none;")?`,"g");n[c.name]===!1?s=s.replace(h,`data-${i}-id="${A}" style="display:none;"`):s=s.replace(h,`data-${i}-id="${A}"`)})}),s},$=a=>{const r=a.match(/^\s*([^-–]+)\s*[-–]\s*(.+)$/);if(r){const[,n,s]=r;return`<li><strong>${n.trim()}</strong> – ${s.trim()}</li>`}return`<li>${a}</li>`},I=(a,r)=>a.replace(/{{(.*?)}}/g,(n,s)=>{const u=s.trim();if(u==="email_display")return r.show_email===!1?"display:none;":"";const c=r[u];return Array.isArray(c)?c.every(m=>typeof m=="string")?c.map(m=>$(m)).join(""):c.map(m=>{if(typeof m=="object"&&m){const _=m;if(_.period){const A=`<strong>${_.period}</strong>`,h=Object.entries(_).filter(([y])=>y!=="period").map(([,y])=>y).filter(Boolean);return`<tr>${[A,...h].map(y=>`<td>${y??""}</td>`).join("")}</tr>`}const i=Object.values(_).filter(Boolean);return i.length?`<tr>${i.map(A=>`<td>${A}</td>`).join("")}</tr>`:""}return""}).filter(Boolean).join(""):typeof c=="boolean"?c?"Sim":"Não":c??""}),R=a=>j.sanitize(a),X=()=>{const{templates:a,generatedDocs:r,addGeneratedDoc:n,deleteGeneratedDoc:s,loadTemplates:u,templatesLoadedOnce:c}=G(),[m,_]=O.useState(null),[i,A]=O.useState({}),[h,f]=O.useState(""),[y,M]=O.useState(!1),[w,D]=O.useState(null),[S,V]=O.useState("Documento");O.useEffect(()=>{c||u()},[c,u]),O.useEffect(()=>{a.length&&!m&&_(a[0].id)},[a,m]);const b=O.useMemo(()=>a.find(e=>e.id===m)??null,[a,m]);O.useEffect(()=>{if(b){const e=z(b);A(e);const o=I(b.template,e),d=v(o,b,e);f(R(d)),V(b.name),D(null)}},[b]);const x=(e,o)=>{A(d=>{const p={...d,[e]:o};if(b){const l=I(b.template,p),g=v(l,b,p);f(R(g))}return p})},q=async()=>{if(b){M(!0),D(null);try{const e=I(b.template,i),o=v(e,b,i),d=R(o),p={id:crypto.randomUUID?.()??String(Date.now()),templateId:b.id,templateName:b.name,content:d,createdAt:new Date,data:i};n(p)}catch(e){D(e instanceof Error?e.message:"Não foi possível gerar o documento.")}finally{M(!1)}}},k=e=>{if(e.type==="list"){const o=Array.isArray(i[e.name])?i[e.name]:[];return t.jsxs("div",{className:"space-y-2",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("label",{className:"text-sm font-semibold text-slate-700 dark:text-white/80",children:e.label}),t.jsx("button",{type:"button",onClick:()=>x(e.name,[...o,""]),className:"text-xs text-primary-600 hover:underline",children:"Adicionar"})]}),t.jsxs("div",{className:"space-y-2",children:[o.map((d,p)=>t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx("input",{type:"text",value:d,onChange:l=>{const g=[...o];g[p]=l.target.value,x(e.name,g)},className:"flex-1 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"}),t.jsx("button",{type:"button",onClick:()=>{const l=o.filter((g,E)=>E!==p);x(e.name,l)},className:"text-xs text-red-500 hover:underline",children:"Remover"})]},`${e.name}-${p}`)),o.length===0&&t.jsx("p",{className:"text-xs text-slate-500 dark:text-white/60",children:"Nenhum item. Clique em adicionar."})]})]},e.name)}if(e.type==="repeatable"&&Array.isArray(e.subFields)){const o=Array.isArray(i[e.name])?i[e.name]:[];return t.jsxs("div",{className:"space-y-2",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("label",{className:"text-sm font-semibold text-slate-700 dark:text-white/80",children:e.label}),t.jsx("button",{type:"button",onClick:()=>x(e.name,[...o,{}]),className:"text-xs text-primary-600 hover:underline",children:"Adicionar"})]}),t.jsxs("div",{className:"space-y-3",children:[o.map((d,p)=>t.jsxs("div",{className:"space-y-2 rounded border border-zinc-200 p-3 dark:border-white/10",children:[e.subFields.map(l=>t.jsxs("div",{className:"space-y-1",children:[t.jsx("label",{className:"text-xs font-semibold text-slate-700 dark:text-white/70",children:l.label}),l.type==="select"&&Array.isArray(l.options)?t.jsxs("select",{value:d[l.name]??"",onChange:g=>{const E=[...o];E[p]={...E[p],[l.name]:g.target.value},x(e.name,E)},className:"w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white",children:[t.jsx("option",{value:"",children:"Selecione"}),l.options.map(g=>t.jsx("option",{value:g,children:g},g))]}):t.jsx("input",{type:l.type==="date"?"date":l.type==="number"?"number":"text",value:d[l.name]??"",onChange:g=>{const E=[...o];E[p]={...E[p],[l.name]:g.target.value},x(e.name,E)},className:"w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"})]},`${l.name}-${p}`)),t.jsx("button",{type:"button",onClick:()=>{const l=o.filter((g,E)=>E!==p);x(e.name,l)},className:"text-xs text-red-500 hover:underline",children:"Remover"})]},`${e.name}-${p}`)),o.length===0&&t.jsx("p",{className:"text-xs text-slate-500 dark:text-white/60",children:"Nenhum item. Clique em adicionar."})]})]},e.name)}if(e.type==="textarea")return t.jsxs("div",{className:"space-y-2",children:[t.jsx("label",{className:"text-sm font-semibold text-slate-700 dark:text-white/80",children:e.label}),t.jsx("textarea",{value:i[e.name]??"",onChange:o=>x(e.name,o.target.value),rows:4,className:"w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"})]},e.name);if(e.type==="checklist"&&Array.isArray(e.options)){const o=i[e.name]??[];return t.jsxs("div",{className:"space-y-2",children:[t.jsx("p",{className:"text-sm font-semibold text-slate-700 dark:text-white/80",children:e.label}),t.jsx("div",{className:"space-y-1",children:e.options.map(d=>t.jsxs("label",{className:"flex items-center gap-2 text-sm text-slate-700 dark:text-white/80",children:[t.jsx("input",{type:"checkbox",checked:o.includes(d),onChange:p=>{const l=p.target.checked?[...o,d]:o.filter(g=>g!==d);x(e.name,l)}}),d]},d))})]},e.name)}if(e.type==="section_toggle"){const o=i[e.name]??!1;return t.jsxs("label",{className:"flex items-center gap-2 text-sm text-slate-700 dark:text-white/80",children:[t.jsx("input",{type:"checkbox",checked:o,onChange:d=>x(e.name,d.target.checked)}),e.label]},e.name)}if(e.type==="email"){const o=i.show_email!==!1;return t.jsxs("div",{className:"space-y-2",children:[t.jsxs("div",{className:"flex items-center justify-between",children:[t.jsx("label",{className:"text-sm font-semibold text-slate-700 dark:text-white/80",children:e.label}),t.jsx("button",{type:"button",onClick:()=>{x("show_email",!o)},className:"text-xs text-primary-600 hover:underline",children:o?"Ocultar":"Exibir"})]}),t.jsx("input",{type:"email",value:i[e.name]??"",onChange:d=>x(e.name,d.target.value),className:"w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white",disabled:!o})]},e.name)}return t.jsxs("div",{className:"space-y-2",children:[t.jsx("label",{className:"text-sm font-semibold text-slate-700 dark:text-white/80",children:e.label}),t.jsx("input",{type:e.type==="date"?"date":e.type==="number"?"number":"text",value:i[e.name]??"",onChange:o=>x(e.name,o.target.value),className:"w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white",required:!!e.required})]},e.name)};return t.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"flex items-center gap-2",children:[t.jsx("label",{className:"text-sm font-semibold text-slate-700 dark:text-white/80",children:"Modelo"}),t.jsx("select",{value:m??"",onChange:e=>_(e.target.value||null),className:"rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800",children:a.map(e=>t.jsx("option",{value:e.id,children:e.name},e.id))})]}),b&&t.jsxs("div",{className:"space-y-4 max-h-[70vh] overflow-auto pr-2",children:[t.jsx("h3",{className:"text-lg font-semibold text-slate-900 dark:text-white",children:b.name}),b.fields.map(k),w&&t.jsx("p",{className:"text-sm text-red-500",children:w}),t.jsx("button",{onClick:q,disabled:y,className:"rounded bg-primary-600 px-4 py-2 text-white text-sm font-semibold disabled:opacity-60",children:y?"Gerando...":"Gerar documento"})]})]}),t.jsxs("div",{className:"space-y-4",children:[t.jsxs("div",{className:"rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5",children:[t.jsxs("div",{className:"flex items-center justify-between gap-3",children:[t.jsx("h3",{className:"text-lg font-semibold text-slate-900 dark:text-white",children:"Pré-visualização"}),t.jsx("button",{onClick:()=>{const e=window.open("","_blank","width=900,height=700");e&&(e.document.write(`
                  <html>
                    <head>
                      <title>${S}</title>
                      <style>
                        body { font-family: "Times New Roman", Georgia, serif; line-height: 1.3; font-size: 12px; padding: 40px; }
                        h1, h2, h3, h4 { font-size: 14px; line-height: 1.3; text-transform: uppercase; margin: 8px 0 6px 0; }
                        h1 { text-align: center; font-size: 16px; }
                        p { text-align: justify; }
                        .cv-doc p { text-align: initial; }
                        .signature, .assinatura, .assinaturas, .local, .data { text-align: center; display: block; margin: 6px 0; }
                        .signature hr, .assinatura hr, .assinaturas hr { width: 40%; margin: 12px auto 0 auto; border: 0; border-top: 1px solid #000; }
                        .signature-wrapper { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
                        .signature-wrapper .signature-line { text-align: center; min-width: 40%; }
                        /* Fundo apenas para CV com leve transpar��ncia e desfoque */
                        .cv-doc h2, .cv-doc h3, .cv-doc h4 {
                          background: rgba(217, 217, 217, 0.65);
                          background-color: rgba(217, 217, 217, 0.65);
                          padding: 3px 8px;
                          font-weight: 700;
                          border-bottom: 1px solid #777;
                          display: block;
                          width: 100%;
                          backdrop-filter: blur(3px);
                          -webkit-backdrop-filter: blur(3px);
                        }
                        .dark .cv-doc h2, .dark .cv-doc h3, .dark .cv-doc h4 {
                          background: rgba(15, 23, 42, 0.7) !important;
                          background-color: rgba(15, 23, 42, 0.7) !important;
                          border-bottom-color: #1f2937;
                          color: #fff;
                          backdrop-filter: blur(3px);
                          -webkit-backdrop-filter: blur(3px);
                        }
                        ul { list-style: none; padding-left: 0; margin-left: 0; }
                        ul li { margin-bottom: 4px; padding-left: 0; text-align: justify; }
                        ul li::before { content: none; }
                        [data-section-id="social_skills"] ul { list-style: none; padding-left: 0; margin-left: 0; }
                        [data-section-id="social_skills"] ul li { position: relative; margin-left: 20px; margin-bottom: 6px; padding-left: 6px; }
                        [data-section-id="social_skills"] ul li::before { content: '➢'; position: absolute; left: -14px; top: 0; }
                        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                        th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
                        th { background: none; font-weight: 700; }
                        .dark th { background: none !important; color: #fff; border-color: #444; }
                        .signature, .assinatura, .assinaturas, .local, .data { text-align: center; display: block; margin: 6px 0; }
                        .signature-block { text-align: center; margin: 4px 0; }
                        .signature-block .local, .signature-block .data { display: inline-block; margin: 0 2px; }
                        .signature hr, .assinatura hr, .assinaturas hr { width: 40%; margin: 12px auto 0 auto; border: 0; border-top: 1px solid #000; }
                        .signature-wrapper { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
                        .signature-wrapper .signature-line { text-align: center; min-width: 40%; }
                        .ident-table { border-collapse: collapse; width: 100%; margin-top: 4px; }
                        .ident-table td { border: none; padding: 2px 6px; }
                        .ident-table td.label { width: 180px; font-weight: 700; }
                        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                      </style>
                    </head>
                    <body>${h}</body>
                  </html>
                `),e.document.close(),e.focus(),e.print())},className:"rounded bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700",children:"Imprimir"})]}),t.jsxs("div",{className:"mt-3 min-h-[300px] max-h-[70vh] overflow-auto rounded border border-zinc-200 bg-white p-4 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white",children:[t.jsx("div",{className:"prose prose-slate max-w-none dark:prose-invert",style:{fontFamily:'"Times New Roman", Georgia, serif',lineHeight:1.3,fontSize:"12px"},dangerouslySetInnerHTML:{__html:h}}),t.jsx("style",{children:`
              .prose { font-size: 12px; }
              .prose p { text-align: justify; }
              .prose .cv-doc p { text-align: initial; }
              .prose .signature, .prose .assinatura, .prose .assinaturas, .prose .local, .prose .data {
                text-align: center;
                display: block;
                margin: 6px 0;
              }
              .prose .signature-block { text-align: center; margin: 4px 0; }
              .prose .signature-block .local, .prose .signature-block .data { display: inline-block; margin: 0 2px; }
              .prose .signature hr, .prose .assinatura hr, .prose .assinaturas hr { width: 40%; margin: 12px auto 0 auto; border: 0; border-top: 1px solid #000; }
              .prose .signature-wrapper { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
              .prose .signature-wrapper .signature-line { text-align: center; min-width: 40%; }
              .prose .signature hr,
              .prose .assinatura hr,
              .prose .assinaturas hr {
                width: 40%;
                margin: 12px auto 0 auto;
                border: 0;
                border-top: 1px solid #000;
              }
              .prose .signature-wrapper {
                display: flex;
                justify-content: center;
                gap: 40px;
                flex-wrap: wrap;
              }
              .prose .signature-wrapper .signature-line {
                text-align: center;
                min-width: 40%;
              }
              .prose h1, .prose h2, .prose h3, .prose h4 {
                font-size: 14px;
                line-height: 1.3;
                margin: 8px 0 6px 0;
                text-transform: uppercase;
              }
              .prose h1 { text-align: center; font-size: 16px; }
              /* Cabeçalhos com fundo apenas no CV */
              .cv-doc h2, .cv-doc h3, .cv-doc h4 {
                background: rgba(217, 217, 217, 0.65);
                background-color: rgba(217, 217, 217, 0.65);
                padding: 3px 8px;
                font-weight: 700;
                border-bottom: 1px solid #777;
                display: block;
                width: 100%;
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
              }
              .dark .cv-doc h2, .dark .cv-doc h3, .dark .cv-doc h4 {
                background: rgba(15, 23, 42, 0.7);
                background-color: rgba(15, 23, 42, 0.7);
                border-bottom-color: #1f2937;
                color: #fff;
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
              }
              /* Títulos gerais para outros documentos sem fundo */
              .prose h2:not(.cv-doc h2), .prose h3:not(.cv-doc h3), .prose h4:not(.cv-doc h4) {
                font-weight: 700;
              }
              .prose p { margin: 6px 0; text-align: justify; }
              .prose ul { list-style: none; padding-left: 0; margin-left: 0; }
              .prose ul li { margin-bottom: 4px; padding-left: 0; }
              .prose ul li::before { content: none; }
              .prose [data-section-id="social_skills"] ul { list-style: none; padding-left: 0; margin-left: 0; }
              .prose [data-section-id="social_skills"] ul li { position: relative; margin-left: 20px; margin-bottom: 6px; padding-left: 6px; }
              .prose [data-section-id="social_skills"] ul li::before { content: '➢'; position: absolute; left: -14px; top: 0; }
              .prose table { width: 100%; border-collapse: collapse; margin: 8px 0; }
              .prose th, .prose td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
              .prose th { background: none; color: inherit; font-weight: 700; }
              .prose .ident-table { border-collapse: collapse; width: 100%; margin-top: 4px; }
              .prose .ident-table td { border: none; padding: 2px 6px; }
              .prose .ident-table td.label { width: 180px; font-weight: 700; }
            `})]})]}),t.jsxs("div",{className:"rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5",children:[t.jsx("h3",{className:"text-lg font-semibold text-slate-900 dark:text-white",children:"Histórico"}),t.jsxs("div",{className:"mt-3 space-y-2",children:[r.map(e=>t.jsxs("div",{className:"flex items-center justify-between rounded border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5",children:[t.jsxs("div",{children:[t.jsx("p",{className:"font-semibold text-slate-900 dark:text-white",children:e.templateName}),t.jsx("p",{className:"text-xs text-slate-500 dark:text-white/60",children:new Date(e.createdAt).toLocaleString("pt-PT")})]}),t.jsx("button",{onClick:()=>s(e.id),className:"text-xs text-red-500 hover:underline",children:"Excluir"})]},e.id)),r.length===0&&t.jsx("p",{className:"text-sm text-slate-500 dark:text-white/60",children:"Nenhum documento gerado."})]})]})]})]})},H=()=>t.jsx("main",{className:"h-full w-full overflow-hidden px-6 py-4",children:t.jsx(X,{})}),W=O.memo(H);export{W as default};
