Uma extensão para o navegador Microsoft Edge (Manifest V3) desenvolvida para monitorar preços de produtos em segundo plano e disparar notificações nativas do sistema operacional quando o valor atinge ou fica abaixo do preço alvo definido.

## ✨ Funcionalidades

- Suporte Multissites: Monitoramento simultâneo de links da Amazon, Mercado Livre e outros e-commerces.
- Painel Dinâmico: Interface popup que permite adicionar, visualizar e remover produtos de uma lista de monitoramento em tempo real.
- Execução em Segundo Plano: Utiliza um *Service Worker* (Trabalho de Serviço) e alarmes do navegador que rodam silenciosamente a cada 5 minutos.
- Notificações Independentes: Cada produto gera um alerta visual e sonoro isolado, evitando que a notificação de uma loja apague a de outra.
- Redirecionamento ao Clicar: Clicar na notificação do Windows abre automaticamente a aba do produto correspondente no navegador.

---

## 📂 Estrutura do Projeto

Os arquivos devem estar localizados diretamente na raiz da pasta do projeto:

```text
📁 monitort-ps5
   ├── manifest.json      # Configurações e permissões da extensão
   ├── icon.png           # Icone das notificações
   ├── popup.html         # Interface visual do painel da extensão
   ├── popup.js           # Lógica de inserção, remoção e busca inicial
   ├── background.js      # Robô (Service Worker) que roda em segundo plano
   └── README.md          # Documentação do projeto
```
