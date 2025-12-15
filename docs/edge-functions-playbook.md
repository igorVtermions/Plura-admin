# Plano de Adaptação para Edge Functions

Este guia complementa o `docs/api-map.md` e serve como check-list vivo enquanto o painel passa a consumir exclusivamente Edge Functions do Supabase.

## Objetivos
- Centralizar todas as chamadas de dados via `invokeFunction` definido em `src/services/api.ts`.
- Garantir que cada módulo possua helper dedicado em `src/services/*`, mantendo os componentes React desacoplados do contrato HTTP.
- Validar os fluxos críticos com Jest, conferindo serialização de payloads e normalização de respostas.

## Fluxo de Trabalho
1. **Identificar o endpoint** no `api-map` e verificar se há qualquer resquício do cliente Axios (`api`).
2. **Criar/atualizar o helper** correspondente aproveitando `invokeFunction`. Sempre normalize o payload antes de exportar.
3. **Propagar nos componentes** apenas os helpers adaptados; evite chamadas diretas no JSX.
4. **Cobrir com testes** os cenários de serialização, tratamento de falhas e adaptação de dados.
5. **Registrar eventos globais** (`window.dispatchEvent`) quando a ação puder impactar outras telas (ex.: `session:created`).

## Endpoints Ajustados nesta Iteração
| Área | Função Supabase | O que mudou |
| --- | --- | --- |
| Usuários | `users-users` | `fetchUsers` agora envia filtros (busca/status/paginação) via `invokeFunction`, eliminando o Axios. |
| Instrutores | `user-tutor-list` | Listagem usa Edge Functions, mantendo `action: "list"` e normalizando resposta antes de chegar à UI. |
| Home / Sessões | `user-tutor-list`, `tutor-topics`, `live-chat-room` | A modal de criação de sessão reutiliza os helpers de instrutor e extrai tópicos diretamente da função `tutor-topics`. |

## Testes Automatizados
- Executar `npm test` roda o Jest configurado com `ts-jest`, respeitando os aliases `@/*`.
- Os testes atuais garantem:
  - Serialização correta no `fetchUsers`.
  - Presença de `action`, paginação e filtros em `fetchInstructors`.
  - Normalização resiliente de listas retornadas pelas funções Edge.
- Sempre que um novo endpoint for adicionado, replique o padrão criando casos em `__tests__` perto dos helpers.

## Próximos Passos
- Expandir a cobertura para módulos Mockados (`support`, `network`, `metrics`) assim que os respectivos endpoints forem disponibilizados.
- Integrar monitoramento de erros do Supabase (ex.: Sentry) diretamente nos helpers para facilitar a observabilidade das Edge Functions.
