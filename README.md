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
- Esta fase não inclui mudança de status, pagamentos ou integrações do cardápio V0.3.
- Sem comprovação de teste entre dispositivos, o funcionamento deve ser considerado **pendente de validação**.
- Chave publishable é pública por design; as restrições efetivas são JWT, autorização da Edge Function, SQL e RLS.

## Arquivos
- `index.html`: interface simples com áreas enviar e painel.
- `app.js`: Auth Supabase, API `delivery-demo`, consulta de catálogo/pedidos e Realtime.

Código-fonte original: branch `feature/pedidos-realtime-poc` do repositório `menu_lanchonete`.

**Observação de implantação:** a Edge Function usa lista de origens permitidas; a nova origem de homologação precisa ser explicitamente admitida antes do teste.