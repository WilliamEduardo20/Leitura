//TODO - Variáveis globais
const menu = document.getElementById('menu');
const btnMenu = document.getElementById('btn-menu');
const raiz = document.documentElement;

const visorFonte = document.getElementById('visor-fonte');
const visorEspaco = document.getElementById('visor-espaco');
const tituloEl = document.getElementById('titulo-capitulo');
const conteudoEl = document.getElementById('conteudo-capitulo');

const textoTema = document.getElementById('texto-tema-selecionado');
const textoCapMenu = document.getElementById('texto-cap-menu');
const textoCapTopo = document.getElementById('texto-cap-topo');
const listaCapMenu = document.getElementById('lista-cap-menu');
const listaCapTopo = document.getElementById('lista-cap-topo');

const dropCapMenu = document.getElementById('drop-cap-menu');
const dropCapTopo = document.getElementById('drop-cap-topo');

const btnAntTopo = document.getElementById('btn-anterior-topo');
const btnProxTopo = document.getElementById('btn-proximo-topo');
const btnAntFundo = document.getElementById('btn-anterior');
const btnProxFundo = document.getElementById('btn-proximo');

let config = { fonte: 18, espaco: 1.6, tema: 'webnovel', capituloAtual: 0 };
let menuAberto = false;
let capitulosJson = [];

//* - Temas de cores pré-definidos
const temas = {
    webnovel: { fundo: '#1b1e25', texto: '#a4a7ab', nome: 'Webnovel (Escuro)' },
    claro: { fundo: '#ffffff', texto: '#222222', nome: 'Modo Claro' },
    sepia: { fundo: '#f4ecd8', texto: '#5b4636', nome: 'Sépia' },
    noite: { fundo: '#000000', texto: '#777777', nome: 'Preto Absoluto' }
};

// Fecha os dropdowns ao clicar fora
document.addEventListener('click', (e) => {
    document.querySelectorAll('.dropdown-custom').forEach(drop => {
        if (!drop.contains(e.target)) drop.removeAttribute('open');
    });
});

// Eventos para rolar a lista até o capítulo atual quando o dropdown é aberto
function rolarParaCapituloAtivo(dropdown, lista) {
    if (dropdown.open) {
        const itemAtivo = lista.querySelector('.capitulo-ativo');
        if (itemAtivo) {
            // Centraliza o item ativo na caixa de rolagem
            lista.scrollTop = itemAtivo.offsetTop - (lista.offsetHeight / 2) + (itemAtivo.offsetHeight / 2);
        }
    }
}

dropCapMenu.addEventListener('toggle', () => rolarParaCapituloAtivo(dropCapMenu, listaCapMenu));
dropCapTopo.addEventListener('toggle', () => rolarParaCapituloAtivo(dropCapTopo, listaCapTopo));

function escolherCapitulo(index) {
    renderizarCapitulo(index);
    dropCapMenu.removeAttribute('open');
    dropCapTopo.removeAttribute('open');
}

function escolherTema(idTema) {
    aplicarTema(idTema);
    document.getElementById('drop-tema').removeAttribute('open');
}

let catalogoCompleto = []; // Armazenará a lista do catalogo.json

// Função auxiliar para descobrir o nome do ficheiro baseado no número do capítulo
function obterNomeArquivoJSON(numeroCapitulo) {
    // Excepção para o seu primeiro ficheiro que agrupa do 160 ao 165
    if (numeroCapitulo >= 160 && numeroCapitulo <= 165) {
        return '160-165.json';
    }
    
    // Lógica matemática para o novo padrão (ex: 166-170, 171-175, 181-185)
    // Subtraímos 1 para alinhar o agrupamento, dividimos/multiplicamos por 5, e somamos 1
    const inicio = Math.floor((numeroCapitulo - 1) / 5) * 5 + 1;
    const fim = inicio + 4;
    
    return `${inicio}-${fim}.json`;
}

async function carregarLivro() {
    try {
        // 1. Carrega o catálogo completo
        const responseCatalogo = await fetch('./capitulos/catalogo.json');
        const dataCatalogo = await responseCatalogo.json();
        catalogoCompleto = dataCatalogo.capitulos;
        
        // 2. Preenche os menus suspensos (drop-cap-todo) com base no catálogo
        const optionsHtml = catalogoCompleto.map((cap, index) => 
            `<li onclick="escolherCapitulo(${index})">${cap.titulo}</li>`
        ).join('');
        
        listaCapMenu.innerHTML = optionsHtml;
        listaCapTopo.innerHTML = optionsHtml;

        // 3. Carrega o capítulo salvo na configuração (ou o primeiro da lista)
        const indexInicial = config.capituloAtual !== undefined ? config.capituloAtual : 0;
        await escolherCapitulo(indexInicial);

    } catch (erro) {
        tituloEl.innerText = "Erro!";
        conteudoEl.innerHTML = "<p>Não foi possível carregar o arquivo catalogo.json. Use um servidor local.</p>";
        console.error("Erro ao carregar o livro:", erro);
    }
}

// Nova função assíncrona que cuida de baixar o JSON respectivo e repassar para a renderização
async function escolherCapitulo(index) {
    if (index < 0 || index >= catalogoCompleto.length) return;

    try {
        const infoCapitulo = catalogoCompleto[index];
        const nomeArquivo = obterNomeArquivoJSON(infoCapitulo.capitulo_numero);
        
        // Busca APENAS o JSON que contém o capítulo escolhido
        const response = await fetch(`./capitulos/${nomeArquivo}`);
        const data = await response.json();
        
        // Encontra o conteúdo específico do capítulo dentro do JSON carregado
        const capConteudo = data.capitulos.find(c => c.capitulo_numero === infoCapitulo.capitulo_numero);
        
        if (capConteudo) {
            renderizarCapitulo(index, capConteudo);
        } else {
            throw new Error("Capítulo não encontrado dentro do arquivo fornecido.");
        }
    } catch (erro) {
        tituloEl.innerText = "Erro ao carregar capítulo!";
        conteudoEl.innerHTML = `<p>Não foi possível carregar o conteúdo. Detalhes: ${erro.message}</p>`;
        console.error("Erro em escolherCapitulo:", erro);
    }
}

// A função de renderizar agora recebe o índice (para gerenciar botões e menu) e os dados diretos
function renderizarCapitulo(index, capData) {
    tituloEl.innerText = capData.titulo;
    textoCapMenu.innerText = `Capítulo ${capData.capitulo_numero}`;
    textoCapTopo.innerText = capData.titulo;
    
    // Processa os parágrafos
    conteudoEl.innerHTML = capData.conteudo.map(p => 
        p.trim() === "" ? "<br><br>" : `<p class="texto-p">${p}</p>`
    ).join('');

    config.capituloAtual = index;

    // Remove a classe ativa de todos e adiciona apenas no atual
    [listaCapMenu, listaCapTopo].forEach(lista => {
        const itens = lista.querySelectorAll('li');
        itens.forEach((li, i) => li.classList.toggle('capitulo-ativo', i === index));
    });

    // Desativa botões de navegação nos extremos do catálogo
    const ehOPrimeiro = (index === 0);
    const ehOUltimo = (index === catalogoCompleto.length - 1);
    
    btnAntTopo.disabled = ehOPrimeiro; 
    btnAntFundo.disabled = ehOPrimeiro;
    btnProxTopo.disabled = ehOUltimo; 
    btnProxFundo.disabled = ehOUltimo;

    salvarConfiguracoes();
    window.scrollTo(0, 0);
}

function salvarConfiguracoes() { localStorage.setItem('leitorSettings', JSON.stringify(config)); }

function iniciarLeitor() {
    const dadosSalvos = localStorage.getItem('leitorSettings');
    if (dadosSalvos) config = Object.assign(config, JSON.parse(dadosSalvos));
    
    aplicarTema(config.tema);
    atualizarFonte(); atualizarEspaco();
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

btnMenu.onclick = () => {
    menuAberto = !menuAberto;
    menu.classList.toggle('menu-escondido', !menuAberto);
    btnMenu.innerText = menuAberto ? "✕ Fechar" : "⚙️ Ajustes";
};

const voltarCap = () => escolherCapitulo(config.capituloAtual - 1);
const avancarCap = () => escolherCapitulo(config.capituloAtual + 1);

btnAntTopo.onclick = voltarCap; btnAntFundo.onclick = voltarCap;
btnProxTopo.onclick = avancarCap; btnProxFundo.onclick = avancarCap;

function atualizarFonte() { raiz.style.setProperty('--tamanho-da-fonte', config.fonte + 'px'); visorFonte.innerText = config.fonte; salvarConfiguracoes(); }
function atualizarEspaco() { raiz.style.setProperty('--espacamento-entre-linhas', config.espaco); visorEspaco.innerText = config.espaco.toFixed(1); salvarConfiguracoes(); }

document.getElementById('fonte-mais').onclick = () => { if(config.fonte < 40) { config.fonte += 2; atualizarFonte(); } };
document.getElementById('fonte-menos').onclick = () => { if(config.fonte > 12) { config.fonte -= 2; atualizarFonte(); } };
document.getElementById('espaco-mais').onclick = () => { if(config.espaco < 3.0) { config.espaco += 0.2; atualizarEspaco(); } };
document.getElementById('espaco-menos').onclick = () => { if(config.espaco > 1.0) { config.espaco -= 0.2; atualizarEspaco(); } };

iniciarLeitor();

document.getElementById('btn-topo').addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Rolagem suave
    });
});