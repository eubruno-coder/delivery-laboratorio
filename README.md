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

## Painel V0.3 — cores operacionais
- Recebidos: laranja com pulso suave contínuo e indicação NOVO; preparando: azul; prontos: verde; em entrega: roxo; finalizados: verde acinzentado; cancelados: vermelho.
- Fundo, borda, texto e ações dos cards acompanham a paleta de cada etapa. Animação respeita a preferência de movimento reduzido do dispositivo.
- Checkbox **Mostrar cancelados** exibe ou oculta a sexta coluna, sem apagar pedidos.
- Homologação pendente: validar cores, movimento, alternância da coluna cancelados e transições em navegador real.

## V0.4 — configurações de entrega (fase 1)
- Aba **Taxas de entrega**: endereço de origem descritivo, taxa fixa, valor por km, limite de atendimento e habilitação por loja.
- Configurações persistidas em `public.delivery_settings` com RLS; escrita somente para owner/manager do estabelecimento.
- Prévia calculada no PostgreSQL por `public.delivery_fee_preview(uuid,integer)` em centavos, com arredondamento do adicional por quilômetro para cima.
- **Atenção:** distância de teste informada manualmente não é confiável para cobrança. A função é apenas uma simulação autenticada; ainda falta integrar roteamento confiável no backend, geocodificação, persistência de orçamento e cálculo definitivo no checkout.
- Nenhum rastreamento de entregadores ou clientes será implementado.
- **Teste manual pendente:** entrar na conta, salvar valores, atualizar a página, confirmar persistência e testar distância dentro/fora do limite. Não utilizar dados pessoais reais.
- Migração aplicada no projeto Supabase como `delivery_settings_and_internal_fee_preview_v04`. Exportar SQL e manter versionamento das migrações antes de produção.

## V0.4 — pedido de entrega de teste
- Na aba Enviar pedido de teste, selecionar Retirada ou Entrega (simulação).
- Entrega usa distância fictícia informada pelo operador; a prévia consulta `delivery_fee_preview` e a gravação chama Edge Function `delivery-demo` ação `submit_delivery_test`, que executa RPC service-role-only `demo_submit_delivery`.
- O servidor recalcula a taxa com os parâmetros da loja, salva `fulfillment_type='delivery'`, `delivery_fee_cents` e `total_cents` atomicamente, com idempotência.
- Somente para laboratório autenticado. **Não reutilizar a distância do cliente para cobrança real**: ainda falta roteamento e validação do destino no backend.
- Homologação manual pendente em navegador: habilitar loja, consultar taxa, enviar pedido, verificar total e status.
