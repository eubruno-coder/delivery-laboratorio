# Delivery — Laboratório de integração

Ambiente de **homologação** para testar envio de pedidos entre dois dispositivos. Não é a versão de produção.

## Publicação
Em GitHub → Settings → Pages, configure **Deploy from a branch**, branch **main**, diretório **/(root)**. Aguarde a URL `https://eubruno-coder.github.io/delivery-laboratorio/` ficar disponível.

## Teste
1. No Supabase [delivery-saas](https://supabase.com/dashboard/project/naunzqclhsgwkmkdfmql), abra **Settings → API Keys** e copie **somente a chave publishable** (prefixo `sb_publishable_`). Nunca insira service_role ou secret.
2. Acesse o laboratório em ambos os dispositivos. Cole a chave publishable quando solicitado pela primeira vez em cada navegador.
3. Crie uma conta **fictícia** e confirme seu e-mail caso o Supabase solicite. Acesse a mesma conta nos dois dispositivos.
4. Abra **Painel** no computador e **Enviar pedido** no celular.
5. Envie um pedido de teste. O painel assina eventos Realtime e consulta os pedidos; também sincroniza a cada 10 segundos.

## Limitações
- O envio exige login em ambos os dispositivos; ainda não é checkout público.
- Use dados fictícios exclusivamente. Não compartilhe senhas ou chaves secretas.
- Esta fase inclui mudança de status com trilha de auditoria, mas não inclui pagamentos ou integrações do cardápio V0.3.
- Sem comprovação de teste entre dispositivos, o funcionamento deve ser considerado **pendente de validação**.
- Chave publishable é pública por design; as restrições efetivas são JWT, autorização da Edge Function, SQL e RLS.

## Arquivos
- `index.html`: interface Kanban responsiva com áreas enviar e painel.
- `app.js`: Auth Supabase, API `delivery-demo`, consulta de catálogo/pedidos e Realtime.

Código-fonte original: branch `feature/pedidos-realtime-poc` do repositório `menu_lanchonete`.

**Observação de implantação:** a Edge Function permite a origem GitHub Pages do proprietário e localhost; não expor novas origens sem revisar CORS e autenticação.
## Gestão de pedidos — V0.2
- O painel permite **Recebido → Preparando → Pronto → Concluído** para pedidos de retirada. Pedidos de entrega passam por **Saiu para entrega** antes de concluídos.
- Cancelamento permitido somente enquanto recebido ou preparando.
- A API `delivery-demo` valida o JWT; a função SQL `demo_change_order_status` confere vínculo com a loja, transição permitida e status anterior esperado, sob bloqueio de linha, e grava o histórico na mesma transação.
- O painel escuta eventos INSERT e UPDATE de `orders` e sincroniza novamente após uma ação.
- **Pendente de homologação manual:** clique nos botões de um pedido fictício, acompanhe a atualização em outro dispositivo e confira o histórico. Não afirmar produção pronta antes desse teste.

## Painel V0.3 — Kanban operacional
- Colunas simultâneas: Recebidos, Preparando, Prontos, Em entrega e Finalizados; pedidos cancelados não são exibidos no quadro, mas permanecem no banco e histórico.
- Busca por número e nome, ordenação por data, indicadores e modal com detalhes/histórico.
- Ações de status seguem a validação transacional do servidor da V0.2; nenhum status é alterado apenas no navegador.
- Realtime e sincronização de contingência a cada 10 segundos continuam ativos.
- O checkout segue autenticado e limitado ao laboratório. Sem dados reais, pagamentos ou integração com o produto principal.
- **Validação necessária:** após publicação do GitHub Pages, testar login, envio, colunas, transições, detalhes e sincronização entre dispositivos.
