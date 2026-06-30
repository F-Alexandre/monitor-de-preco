// document.getElementById('verificar').addEventListener('click', async()=>{
//     const[tab] = await chrome.tabs.query({active: true,currentWindow:true});
   
//     if(!tab) return;

//     chrome.scripting.executeScript({
//         target:{tabId: tab.id},
//         func:pegarPrecoDaPagina
//     },
//         (results)=>{
//             if(results && results[0] && results[0].result){
//                 document.getElementById('preco').innerText = results[0].result;
//             }else{
//                 document.getElementById('preco').innerText = "Não Encontrado";
//             }
//         });
// });

// function pegarPrecoDaPagina(){
//     const seletores =[
//         '.a-price-whole',
//         '#priceblock_ourprice',
//         '.price-tag-amount',
//         '[data-testid="price-value"]'
//     ];

//     for(let seletor of seletores){
//         const elemento =document.querySelector(seletor);
//         if(elemento && elemento.innerText.trim() !== ""){
//             return "R$"+ elemento.innerText.trim();
//         }
//     }
//     return null;
// }

document.addEventListener('DOMContentLoaded', async () => {
    const inputUrl = document.getElementById('url');
    const inputPreco = document.getElementById('precoAlvo');
    const btnSalvar = document.getElementById('salvar');
    const divStatus = document.getElementById('status');

    // Carrega os dados salvos anteriormente (se existirem)
    const dados = await chrome.storage.local.get(['prodUrl', 'prodPrecoAlvo', 'ultimoPreco']);
    if (dados.prodUrl) {
        inputUrl.value = dados.prodUrl;
        inputPreco.value = dados.prodPrecoAlvo;
        const precoExibir = dados.ultimoPreco ? dados.ultimoPreco : 'Aguardando checagem...';
        divStatus.innerHTML = '🟢 Monitorando!<br>Último preço visto: ' + precoExibir;
    }

    // Salva as novas configurações e faz a busca direta
    btnSalvar.addEventListener('click', async () => {
        const url = inputUrl.value.trim();
        const precoAlvo = parseFloat(inputPreco.value);

        if (!url || isNaN(precoAlvo)) {
            divStatus.innerText = "❌ Preencha o link e o preço alvo!";
            return;
        }

        divStatus.innerText = "💾 Salvando e buscando preço atual...";

        // Faz a busca do preço diretamente pelo popup para evitar o erro de conexão
        try {
            const resposta = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const htmlTexto = await resposta.text();

            // Regex para capturar o preço no HTML bruto da Amazon
            const regexPreco = /<span class="a-price-whole">([0-9.,&nbsp;]+)/;
            const match = htmlTexto.match(regexPreco);

            let precoVisto = 'Preço não localizado na página.';
            
            if (match && match[1]) {
                let precoLimpo = match[1].replace(/[.&nbsp;,]/g, '').trim();
                let precoAtual = parseFloat(precoLimpo);
                if (!isNaN(precoAtual)) {
                    precoVisto = "R$ " + precoAtual.toLocaleString('pt-BR');
                }
            }

            // Grava tudo diretamente no armazenamento local
            await chrome.storage.local.set({
                prodUrl: url,
                prodPrecoAlvo: precoAlvo,
                ultimoPreco: precoVisto
            });

            divStatus.innerHTML = '🟢 Monitorando!<br>Último preço visto: ' + precoVisto;

        } catch (erro) {
            console.error(erro);
            divStatus.innerText = "❌ Erro ao conectar com o site.";
        }
    });
});