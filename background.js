chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('verificar_precos_alarme', { periodInMinutes: 5 });
  console.log('⏰ Alarme de monitoramento configurado.');
});

chrome.alarms.onAlarm.addListener((alarme) => {
  if (alarme.name === 'verificar_precos_alarme') {
    executarMonitoramentoGeral();
  }
});

chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
  if (mensagem.acao === "verificar_lista_agora") {
    executarMonitoramentoGeral();
  }
});

async function executarMonitoramentoGeral() {
  const dados = await chrome.storage.local.get(['listarProdutos']);
  const produtos = dados.listarProdutos || [];
  
  if (produtos.length === 0) return;

  for (let i = 0; i < produtos.length; i++) {
    let prod = produtos[i];
    
    try {
      const resposta = await fetch(prod.url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
      });
      const htmlTexto = await resposta.text();
      let precoAtual = null;

      if (prod.loja === 'Amazon') {
        const match = htmlTexto.match(/<span class="a-price-whole">([0-9.,&nbsp;]+)/);
        if (match && match[1]) {
          precoAtual = parseFloat(match[1].replace(/[.&nbsp;,]/g, '').trim());
        }
      } 
      else if (prod.loja === 'Mercado Livre') {
        let matchOg = htmlTexto.match(/meta[^>]*property="og:price:amount"[^>]*content="([^"]+)"/);
        let matchMeta = htmlTexto.match(/<meta[^>]*itemprop="price"[^>]*content="([^"]+)"/i);
        let matchJson = htmlTexto.match(/"price"\s*:\s*"?([0-9.]+)"?/i);
        let matchClasse = htmlTexto.match(/<span class="[a-zA-Z0-9_-]*money-amount__fraction"[^>]*>([0-9.]+)/);

        if (matchMeta && matchMeta[1]) {
          precoAtual = parseFloat(matchMeta[1]);
        } else if (matchJson && matchJson[1]) {
          precoAtual = parseFloat(matchJson[1]);
        } else if (matchClasse && matchClasse[1]) {
          precoAtual = parseFloat(matchClasse[1].replace(/[.]/g, '').trim());
        }
      }

      if (precoAtual && !isNaN(precoAtual)) {
        produtos[i].ultimoPreco = "R$ " + precoAtual.toLocaleString('pt-BR');

        if (precoAtual <= parseFloat(prod.alvo)) {
          // CORRIGIDO: String limpa usando concatenação simples para evitar o SyntaxError
          const idNotificacao = 'alerta_' + prod.id;

          chrome.notifications.create(idNotificacao, {
            type: 'basic',
            iconUrl: 'icon.png', 
            title: '🔥 PREÇO BAIXOU NA ' + prod.loja.toUpperCase() + '!',
            message: 'O produto atingiu R$ ' + precoAtual.toLocaleString('pt-BR') + '! Clique para abrir.',
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

  await chrome.storage.local.set({ listarProdutos: produtos });
}

// Abre o link correto do produto que foi clicado na notificação
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const dados = await chrome.storage.local.get(['listarProdutos']);
  const produtos = dados.listarProdutos || [];
  
  // Extrai o ID do produto de dentro do ID da notificação (ex: alerta_prod_123456)
  const prodId = notificationId.replace('alerta_', '');
  const produtoClicado = produtos.find(p => p.id === prodId);
  
  if (produtoClicado && produtoClicado.url) {
    chrome.tabs.create({ url: produtoClicado.url });
  }
});