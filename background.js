chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checarPrecosLoop', { periodInMinutes: 5 });
  console.log("Alarme multissites de 5 minutos criado!");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checarPrecosLoop') {
    executarMonitoramentoGeral();
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.acao === "verificar_lista_agora") {
    executarMonitoramentoGeral();
  }
});

async function executarMonitoramentoGeral() {
  const dados = await chrome.storage.local.get(['listaProdutos']);
  const produtos = dados.listaProdutos || [];
  if (produtos.length === 0) return;

  // Percorre cada produto da lista
  for (let i = 0; i < produtos.length; i++) {
    let prod = produtos[i];
    
    try {
      const resposta = await fetch(prod.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const htmlTexto = await resposta.text();
      let precoAtual = null;

      // Regex dinâmico dependendo da loja
      if (prod.loja === 'Amazon') {
        const match = htmlTexto.match(/<span class="a-price-whole">([0-9.,&nbsp;]+)/);
        if (match && match[1]) {
          precoAtual = parseFloat(match[1].replace(/[.&nbsp;,]/g, '').trim());
        }
      } else if (prod.loja === 'Mercado Livre') {
        // Regex adaptado para a estrutura clássica de preço do Mercado Livre
        const match = htmlTexto.match(/<span class="andes-money-amount__fraction">([0-9.]+)/);
        if (match && match[1]) {
          precoAtual = parseFloat(match[1].replace(/[.]/g, '').trim());
        }
      }

      // Se encontrou o preço de forma válida
      if (precoAtual && !isNaN(precoAtual)) {
        produtos[i].ultimoPreco = "R$ " + precoAtual.toLocaleString('pt-BR');

        // Dispara notificação usando o ID ÚNICO do produto (Impede um site de apagar o outro!)
        if (precoAtual <= parseFloat(prod.alvo)) {
          chrome.notifications.create('alerta_' + prod.id, {
            type: 'basic',
            iconUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=128&h=128&fit=crop',
            title:  "PREÇO BAIXOU NA "+ prod.loja.toUpperCase(),
            message: "O produto atingiu R$ " +  precoAtual.toLocaleString('pt-BR')+" Clique para abrir",
            priority: 2
          });
        }
      } else {
        produtos[i].ultimoPreco = 'Preço não identificado.';
      }
    } catch (erro) {
      console.error("Erro ao checar item: ", prod.loja, erro);
    }
  }

  // Atualiza a lista com os novos preços vistos
  await chrome.storage.local.set({ listaProdutos: produtos });
}

// Abre o link correto do produto que foi clicado na notificação
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const dados = await chrome.storage.local.get(['listaProdutos']);
  const produtos = dados.listaProdutos || [];
  
  // Extrai o ID do produto de dentro do ID da notificação (ex: alerta_prod_123456)
  const prodId = notificationId.replace('alerta_', '');
  const produtoClicado = produtos.find(p => p.id === prodId);
  
  if (produtoClicado && produtoClicado.url) {
    chrome.tabs.create({ url: produtoClicado.url });
  }
});