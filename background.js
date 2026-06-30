// Cria o alarme para rodar a cada 30 minutos ao instalar/iniciar
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('checarPrecoAmazon', { periodInMinutes: 5 });
  console.log("Alarme de monitoramento criado!");
});

// Escuta o alarme do sistema
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checarPrecoAmazon') {
    executarMonitoramento();
  }
});

// Escuta cliques imediatos vindos do popup.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.acao === "verificar_agora") {
    executarMonitoramento();
  }
});

// Função principal que roda em segundo plano
async function executarMonitoramento() {
  const dados = await chrome.storage.local.get(['prodUrl', 'prodPrecoAlvo']);
  if (!dados.prodUrl || !dados.prodPrecoAlvo) return;

  try {
    const resposta = await fetch(dados.prodUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const htmlTexto = await resposta.text();

    // Regex para capturar o preço no HTML bruto da Amazon
    const regexPreco = /<span class="a-price-whole">([0-9.,&nbsp;]+)/;
    const match = htmlTexto.match(regexPreco);

    if (match && match[1]) {
      let precoLimpo = match[1].replace(/[.&nbsp;,]/g, '').trim();
      let precoAtual = parseFloat(precoLimpo);

      if (!isNaN(precoAtual)) {
        // CORREÇÃO AQUI: Junção de texto correta
        await chrome.storage.local.set({ ultimoPreco: "R$ " + precoAtual.toLocaleString('pt-BR') });

        // SE O PREÇO FOR MENOR OU IGUAL AO ALVO -> DISPARA NOTIFICAÇÃO!
        if (precoAtual <= parseFloat(dados.prodPrecoAlvo)) {
          chrome.notifications.create('alertaPreco', {
            type: 'basic',
            iconUrl: 'icon.png',
            title: '🔥 PREÇO BAIXOU!',
            message: "O PS5 está a custar R$ " + precoAtual.toLocaleString('pt-BR') + "! Clique para abrir a Amazon.",
            priority: 2
          });
        }
      }
    } else {
      await chrome.storage.local.set({ ultimoPreco: 'Preço não localizado na página.' });
    }
  } catch (erro) {
    console.error("Erro ao monitorar em segundo plano:", erro);
  }
}

// Abre a página se o utilizador clicar na notificação do sistema
chrome.notifications.onClicked.addListener(async () => {
  const dados = await chrome.storage.local.get(['prodUrl']);
  if (dados.prodUrl) {
    chrome.tabs.create({ url: dados.prodUrl });
  }
});