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
    const btnAdicionar = document.getElementById('adicionar');
    const divLista = document.getElementById('listaProdutos');
    const divStatus = document.getElementById('status');

    // Função para renderizar a lista no popup
    async function atualizarInterface() {
        const dados = await chrome.storage.local.get(['listaProdutos']);
        const produtos = dados.listaProdutos || [];
        
        divLista.innerHTML = '';
        if (produtos.length === 0) {
            divStatus.innerText = "Nenhum produto monitorado.";
            return;
        }
        divStatus.innerText = 🟢 Monitorando ${produtos.length} produto(s)!;

        produtos.forEach((prod, index) => {
            const item = document.createElement('div');
            item.className = 'produto-item';
            item.innerHTML = 
                <div class="produto-info">
                    <strong>${prod.loja.toUpperCase()}</strong> - Alvo: R$ ${prod.alvo}<br>
                    <span style="color:#777;">Último visto: ${prod.ultimoPreco || 'Aguardando...'}</span>
                </div>
                <button class="btn-remover" data-index="${index}">X</button>
            ;
            divLista.appendChild(item);
        });

        // Adiciona evento nos botões de remover
        document.querySelectorAll('.btn-remover').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idx = e.target.getAttribute('data-index');
                produtos.splice(idx, 1);
                await chrome.storage.local.set({ listaProdutos: produtos });
                atualizarInterface();
            });
        });
    }

    // Identifica a loja pelo link
    function descobrirLoja(url) {
        if (url.includes('amazon')) return 'Amazon';
        if (url.includes('mercadolivre')) return 'Mercado Livre';
        if (url.includes('magazineluiza') || url.includes('magalu')) return 'Magalu';
        return 'Outro Site';
    }

    // Ação do botão adicionar
    btnAdicionar.addEventListener('click', async () => {
        const url = inputUrl.value.trim();
        const alvo = parseFloat(inputPreco.value);

        if (!url || isNaN(alvo)) {
            alert("Preencha o link e o preço alvo!");
            return;
        }

        const dados = await chrome.storage.local.get(['listaProdutos']);
        const produtos = dados.listaProdutos || [];

        // Cria o novo objeto do produto
        const novoProduto = {
            id: 'prod_' + Date.now(), // ID único para o produto
            url: url,
            alvo: alvo,
            loja: descobrirLoja(url),
            ultimoPreco: 'Buscando...'
        };

        produtos.push(novoProduto);
        await chrome.storage.local.set({ listaProdutos: produtos });
        
        inputUrl.value = '';
        inputPreco.value = '';
        
        atualizarInterface();
        
        // Avisa o background para testar a lista imediatamente
        chrome.runtime.sendMessage({ acao: "verificar_lista_agora" });
    });

    atualizarInterface();
});