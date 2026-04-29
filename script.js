// * ==========================================================================
// * 1. VARIÁVEIS GLOBAIS E ELEMENTOS DO DOM
// * ==========================================================================

// * Elementos estruturais principais
const raiz = document.documentElement;
const menu = document.getElementById('menu');
const nav = document.getElementById('nav');
const open = document.getElementById('open');
const btnMenu = document.getElementById('btn-menu');
const btnCapitulos = document.getElementById('btn-capitulos');
const modalCapitulos = document.getElementById('modal-capitulos');

// * Elementos da área de leitura
const tituloEl = document.getElementById('titulo-capitulo');
const conteudoEl = document.getElementById('conteudo-capitulo');

// * Elementos de configurações (Visores e Textos)
const visorFonte = document.getElementById('visor-fonte');
const visorEspaco = document.getElementById('visor-espaco');
const textoTema = document.getElementById('texto-tema-selecionado');
const textoCapMenu = document.getElementById('texto-cap-menu');
const textoCapTopo = document.getElementById('texto-cap-topo');

// * Elementos de listas e dropdowns
const listaCapMenu = document.getElementById('lista-cap-menu');
const listaCapTopo = document.getElementById('lista-cap-topo');
const listaTodosCapitulos = document.getElementById('lista-todos-capitulos');
const dropCapMenu = document.getElementById('drop-cap-menu');
const dropCapTopo = document.getElementById('drop-cap-topo');

// * Botões de navegação de capítulos
const btnAntTopo = document.getElementById('btn-anterior-topo');
const btnProxTopo = document.getElementById('btn-proximo-topo');
const btnAntFundo = document.getElementById('btn-anterior');
const btnProxFundo = document.getElementById('btn-proximo');

// * Estados da Aplicação
let config = { fonte: 18, espaco: 1.6, tema: 'webnovel', capituloAtual: 0 };
let menuAberto = false;
let modalCapitulosAberto = false;
let capitulosJson = [];
let catalogoCompleto = []; // * Armazenará a lista do catalogo.json

// * ==========================================================================
// * 2. CONFIGURAÇÕES DE TEMAS
// * ==========================================================================

// * Temas de cores pré-definidos
const temas = {
    webnovel: { fundo: '#1b1e25', texto: '#a4a7ab', nome: 'Webnovel (Escuro)' },
    claro: { fundo: '#ffffff', texto: '#222222', nome: 'Modo Claro' },
    sepia: { fundo: '#f4ecd8', texto: '#5b4636', nome: 'Sépia' },
    noite: { fundo: '#000000', texto: '#777777', nome: 'Preto Absoluto' }
};

// * ==========================================================================
// * 3. NÚCLEO DO LEITOR (CARREGAMENTO E RENDERIZAÇÃO)
// * ==========================================================================

// ? Função auxiliar para descobrir o nome do arquivo baseado no número do capítulo
function obterNomeArquivoJSON(numeroCapitulo) {
    // ! EXCEÇÃO: O primeiro arquivo agrupa do 160 ao 165
    if (numeroCapitulo >= 160 && numeroCapitulo <= 165) {
        return '160-165.json';
    }
    
    // ? Lógica matemática para o novo padrão (ex: 166-170, 171-175, 181-185)
    // ? Subtraímos 1 para alinhar o agrupamento, dividimos/multiplicamos por 5, e somamos 1
    const inicio = Math.floor((numeroCapitulo - 1) / 5) * 5 + 1;
    const fim = inicio + 4;
    
    return `${inicio}-${fim}.json`;
}

// * Carrega o catálogo principal e prepara o leitor
async function carregarLivro() {
    try {
        // * 1. Carrega o catálogo completo
        const responseCatalogo = await fetch('./capitulos/catalogo.json');
        const dataCatalogo = await responseCatalogo.json();
        catalogoCompleto = dataCatalogo.capitulos;
        
        // * 2. Preenche os menus suspensos com base no catálogo
        const optionsHtml = catalogoCompleto.map((cap, index) => 
            `<li onclick="escolherCapitulo(${index})">${cap.titulo}</li>`
        ).join('');
        
        listaCapMenu.innerHTML = optionsHtml;
        listaCapTopo.innerHTML = optionsHtml;
        listaTodosCapitulos.innerHTML = optionsHtml;

        // * 3. Carrega o capítulo salvo na configuração (ou o primeiro da lista)
        const indexInicial = config.capituloAtual !== undefined ? config.capituloAtual : 0;
        await escolherCapitulo(indexInicial);

    } catch (erro) {
        // ! Tratamento de Erro ao carregar o catálogo
        tituloEl.innerText = "Erro!";
        conteudoEl.innerHTML = "<p>Não foi possível carregar o arquivo catalogo.json. Use um servidor local.</p>";
        console.error("Erro ao carregar o livro:", erro);
    }
}

// * Busca o JSON respectivo e repassa para a renderização
async function escolherCapitulo(index) {
    if (index < 0 || index >= catalogoCompleto.length) return;

    try {
        const infoCapitulo = catalogoCompleto[index];
        const nomeArquivo = obterNomeArquivoJSON(infoCapitulo.capitulo_numero);
        
        // * Busca APENAS o JSON que contém o capítulo escolhido
        const response = await fetch(`./capitulos/${nomeArquivo}`);
        const data = await response.json();
        
        // * Encontra o conteúdo específico do capítulo dentro do JSON carregado
        const capConteudo = data.capitulos.find(c => c.capitulo_numero === infoCapitulo.capitulo_numero);
        
        if (capConteudo) {
            renderizarCapitulo(index, capConteudo);
            // * Fecha os dropdowns após a escolha
            dropCapMenu.removeAttribute('open');
            dropCapTopo.removeAttribute('open');
        } else {
            throw new Error("Capítulo não encontrado dentro do arquivo fornecido.");
        }
    } catch (erro) {
        // ! Tratamento de Erro na busca do capítulo
        tituloEl.innerText = "Erro ao carregar capítulo!";
        conteudoEl.innerHTML = `<p>Não foi possível carregar o conteúdo. Detalhes: ${erro.message}</p>`;
        console.error("Erro em escolherCapitulo:", erro);
    }
}

// * Atualiza o DOM com o conteúdo do capítulo
function renderizarCapitulo(index, capData) {
    tituloEl.innerText = capData.titulo;
    textoCapMenu.innerText = `Capítulo ${capData.capitulo_numero}`;
    textoCapTopo.innerText = capData.titulo;
    
    // * Processa os parágrafos do texto
    conteudoEl.innerHTML = capData.conteudo.map(p => 
        p.trim() === "" ? "<br><br>" : `<p class="texto-p">${p}</p>`
    ).join('');

    config.capituloAtual = index;

    // * Remove a classe ativa de todos os itens e adiciona apenas no atual
    [listaCapMenu, listaCapTopo, listaTodosCapitulos].forEach(lista => {
        if (!lista) return; // Segurança
        const itens = lista.querySelectorAll('li');
        itens.forEach((li, i) => li.classList.toggle('capitulo-ativo', i === index));
    });

    // * Desativa botões de navegação nos extremos do catálogo
    const ehOPrimeiro = (index === 0);
    const ehOUltimo = (index === catalogoCompleto.length - 1);
    
    btnAntTopo.disabled = ehOPrimeiro; 
    btnAntFundo.disabled = ehOPrimeiro;
    btnProxTopo.disabled = ehOUltimo; 
    btnProxFundo.disabled = ehOUltimo;

    salvarConfiguracoes();
    window.scrollTo(0, 0); // * Volta ao topo após carregar
}

// * ==========================================================================
// * 4. INICIALIZAÇÃO, PREFERÊNCIAS E ARMAZENAMENTO (LOCAL STORAGE)
// * ==========================================================================

function salvarConfiguracoes() { 
    localStorage.setItem('leitorSettings', JSON.stringify(config)); 
}

function iniciarLeitor() {
    const dadosSalvos = localStorage.getItem('leitorSettings');
    if (dadosSalvos) config = Object.assign(config, JSON.parse(dadosSalvos));
    
    aplicarTema(config.tema);
    atualizarFonte(); 
    atualizarEspaco();
    carregarLivro();
}

function aplicarTema(nome) {
    const t = temas[nome];
    raiz.style.setProperty('--cor-de-fundo', t.fundo);
    raiz.style.setProperty('--cor-do-texto', t.texto);
    textoTema.innerText = t.nome;
    config.tema = nome;
    salvarConfiguracoes();
}

function escolherTema(idTema) {
    aplicarTema(idTema);
    document.getElementById('drop-tema').removeAttribute('open');
}

function atualizarFonte() { 
    raiz.style.setProperty('--tamanho-da-fonte', config.fonte + 'px'); 
    visorFonte.innerText = config.fonte; 
    salvarConfiguracoes(); 
}

function atualizarEspaco() { 
    raiz.style.setProperty('--espacamento-entre-linhas', config.espaco); 
    visorEspaco.innerText = config.espaco.toFixed(1); 
    salvarConfiguracoes(); 
}

// * Inicializa o leitor ao carregar o script
iniciarLeitor();

// * ==========================================================================
// * 5. CONTROLES DE INTERFACE E EVENTOS (LISTENERS)
// * ==========================================================================

// * Controle de Fonte e Espaçamento
document.getElementById('fonte-mais').onclick = () => { if(config.fonte < 40) { config.fonte += 2; atualizarFonte(); } };
document.getElementById('fonte-menos').onclick = () => { if(config.fonte > 12) { config.fonte -= 2; atualizarFonte(); } };
document.getElementById('espaco-mais').onclick = () => { if(config.espaco < 3.0) { config.espaco += 0.2; atualizarEspaco(); } };
document.getElementById('espaco-menos').onclick = () => { if(config.espaco > 1.0) { config.espaco -= 0.2; atualizarEspaco(); } };

// * Navegação Linear de Capítulos
const voltarCap = () => escolherCapitulo(config.capituloAtual - 1);
const avancarCap = () => escolherCapitulo(config.capituloAtual + 1);
btnAntTopo.onclick = voltarCap; btnAntFundo.onclick = voltarCap;
btnProxTopo.onclick = avancarCap; btnProxFundo.onclick = avancarCap;

// * Voltar ao Topo Suave
document.getElementById('btn-topo').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// * Comportamento dos Dropdowns Customizados
// * Fecha os dropdowns ao clicar fora deles
document.addEventListener('click', (e) => {
    document.querySelectorAll('.dropdown-custom').forEach(drop => {
        if (!drop.contains(e.target)) drop.removeAttribute('open');
    });
});

// ? Rolagem automática dentro das listas dropdown
function rolarParaCapituloAtivo(dropdown, lista) {
    if (dropdown.open) {
        const itemAtivo = lista.querySelector('.capitulo-ativo');
        if (itemAtivo) {
            // * Centraliza o item ativo na caixa de rolagem
            lista.scrollTop = itemAtivo.offsetTop - (lista.offsetHeight / 2) + (itemAtivo.offsetHeight / 2);
        }
    }
}

dropCapMenu.addEventListener('toggle', () => rolarParaCapituloAtivo(dropCapMenu, listaCapMenu));
dropCapTopo.addEventListener('toggle', () => rolarParaCapituloAtivo(dropCapTopo, listaCapTopo));

// * ==========================================================================
// * 6. CONTROLE DOS MENUS LATERAIS (NAV E MODAIS)
// * ==========================================================================

// * Toggle da NavBar lateral
open.addEventListener('click', () => {
    nav.classList.toggle('fechado');
});

// * Toggle do Menu de Configurações
btnMenu.onclick = () => {
    menuAberto = !menuAberto;
    menu.classList.toggle('menu-escondido', !menuAberto);
    
    // * Se o menu de Capítulos estiver aberto, fecha ele para não sobrepor
    if (menuAberto && modalCapitulosAberto) {
        modalCapitulosAberto = false;
        modalCapitulos.classList.add('menu-escondido');
    }

    // * Atualiza o visual do botão
    if (menuAberto) {
        btnMenu.innerHTML = '<i class="bi bi-x-lg"></i><p>Fechar</p>';
    } else {
        btnMenu.innerHTML = `<i class="bi bi-gear"></i><p>Configurações</p>`;
    }
};

// * Toggle do Modal de Capítulos
btnCapitulos.onclick = () => {
    modalCapitulosAberto = !modalCapitulosAberto;
    modalCapitulos.classList.toggle('menu-escondido', !modalCapitulosAberto);
    
    // * Se o menu de Configurações estiver aberto, fecha ele
    if (modalCapitulosAberto && menuAberto) {
        menuAberto = false;
        menu.classList.add('menu-escondido');
        btnMenu.innerHTML = `<i class="bi bi-gear"></i><p>Configurações</p>`;
    }
    
    // * Faz a lista rolar automaticamente até o capítulo atual após a animação (400ms)
    if (modalCapitulosAberto) {
        setTimeout(() => {
            const itemAtivo = listaTodosCapitulos.querySelector('.capitulo-ativo');
            if (itemAtivo) {
                listaTodosCapitulos.scrollTop = itemAtivo.offsetTop - (listaTodosCapitulos.offsetHeight / 2) + (itemAtivo.offsetHeight / 2);
            }
        }, 400); 
    }
};