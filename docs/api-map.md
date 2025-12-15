# Mapa de Fluxos de API por módulo

Este documento resume *como* cada área do painel consome APIs, quais endpoints são usados (Supabase edge functions ou REST via Axios) e como os dados fluem até os componentes React.

> Convenções:
> - `invokeFunction` chama funções do Supabase (`src/services/api.ts:34`).
> - `api` é o cliente Axios configurado no mesmo arquivo (`src/services/api.ts:82`).
> - Referências de arquivo seguem o padrão `caminho:linha`.

## 1. Fundamentos de API (`src/services/api.ts`)

- **Inicialização do Supabase**: `createClient` usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Falta de variáveis gera aviso em runtime.
- **Autenticação automática**: `withAuthHeader` injeta `Authorization` com o token persistido no `localStorage` antes de cada `invokeFunction`.
- **Serialização**: `shouldSerializeBody` garante que somente objetos simples sejam convertidos em JSON. `FormData`/`Blob` passam direto.
- **Fallback HTTP**: `api` (Axios) herda o token no header e aborta sessão em 401 removendo o token e redirecionando para `/`.

Sempre que precisar de um novo endpoint:
1. Crie um helper em `src/services/*`.
2. Use `invokeFunction` para funções Supabase (ex.: `"users-login"`).
3. Use `api` para rotas REST (ex.: `"user-tutor-list"`).
4. Consuma o helper dentro dos componentes React via `useEffect`/handlers.

---

## 2. Autenticação (`src/app/auth`)

### 2.1 Login (`components/login-form.tsx:17`)
- **API**: `invokeFunction("users-login" , { method: "POST", body: { email, password } })`.
- **Fluxo**:
  1. `onSubmit` dispara `invokeFunction`.
  2. Token retornado é salvo via `setClientToken`.
  3. Em sucesso, `router.push("/home")`.
  4. Erros caem em mensagens amigáveis (credenciais, exceções).

### 2.2 Registro (`components/register-form.tsx:24`)
- **API**: `invokeFunction("register", { method: "POST", body: { name, email, password, confirmPassword } })`.
- **Após criar**: dispara `invokeFunction("send-pin", { method: "POST", body: { adminId ou email, via: "email" } })`.
- **Uso**: Em caso de sucesso, direciona o usuário para `/verify` preenchendo `email` e `adminId` na querystring.

### 2.3 Recuperação/Reset (`components/forgot-password-form.tsx` & `reset-password-form.tsx`)
- **APIs**: `invokeFunction("password-reset", ...)` e variantes `send-pin`.
- **Fluxo**: formulários coletam email/código, persistem estado local de carregamento e exibem toasts conforme respostas.

### 2.4 Verificação (`components/verify-pin-form.tsx`)
- **API**: `invokeFunction("verify-pin", { method: "POST", body: { email, pin, adminId } })`.
- **Reuso**: componente recebe `email`/`adminId` via props (página `src/app/verify/page.tsx:7`) extraídas da URL ou `searchParams`.

---

## 3. Home (`src/app/home`)

### 3.1 `RoomsControl` (`components/rooms-control.tsx`)
- **APIs**:
  - `invokeFunction("room-admin")` → salas com contexto administrativo.
  - *Fallback* `invokeFunction("users-live-chat-rooms")` caso a primeira falhe.
- **Fluxo**:
  1. `useEffect` inicial chama `fetchRooms`.
  2. Resposta é normalizada com `adaptRoom`, convertendo chaves heterogêneas para `RoomUI`.
  3. `categorizeRooms` separa sessões em `live` e `soon`. Atualização ocorre a cada 30s e quando `window` emite `session:created`.
  4. Cards (`LiveRoomCard`/`SoonRoomCard`) recebem os dados adaptados.
- **Interações**: `toggleReminder`, `goPage` e `handleJoin` são puramente locais; API só ocorre durante carregamento ou refresh manual.

### 3.2 Modais
- **CreateSessionModal** (`components/create-session-modal.tsx`) hoje não chama API real; estrutura pronta para acionar Supabase quando o endpoint existir.
- **CreateInstructorModal** (`src/app/instructors/components/create-instructor-modal.tsx`) é reusado na Home (ver seção 4.3).

---

## 4. Usuários (`src/app/users` + `src/services/users.ts`)

### 4.1 Serviço (`src/services/users.ts`)
- `fetchUsers(params)` → `api({ method: "GET", url: "users-users" })`. Normaliza `data` e `meta`.
- `banUser(userId, payload)` / `unbanUser` → `invokeFunction("user-update-profile", { method: "PATCH", body: {...} })`.
- `fetchUserProfile(userId)` → `invokeFunction("user-profile", { method: "GET", body: { userId } })`.
- `fetchUserSessionsAdmin` → `invokeFunction("room-history", { method: "GET", body: { userId } })`.
- `fetchFollowers` / `fetchFollowing` → `invokeFunction("user-follow", { direction: "followers|following" })`.
- Helpers `normalizeFollowUser`, `mapFollowResponse` e `resolveStatus` convertem os payloads em `UserCardUser`.

### 4.2 Lista (`pages/users-page.tsx:22`)
- **Carregamento**: `useEffect` responde a `filter`, `debouncedSearch` e `page`.
- **Passos**:
  1. Monta `params` e chama `fetchUsers`.
  2. `ensureUsersArray` (dentro do arquivo) aplica `adaptUser`.
  3. Atualiza `users` e `meta`. Falhas zeram a lista e exibem `setError`.
- **Ações**:
  - `handleBan`/`handleUnban` chamam `banUser`/`unbanUser`, controlando estados `banningIds`/`unbanningIds` para desabilitar botões e disparar toasts.
  - `UserCard` recebe callbacks e abre modais de banimento/remoção.

### 4.3 Perfil (`pages/user-profile-page.tsx`)
- **Carregamento**: `useEffect` observa `userId` e dispara `fetchUserProfile`.
- **Composição**:
  - `UserHero`: exibe dados básicos, permite abrir `UserDetailsModal`.
  - `UserStats`, `UserReportsSection`, `UserActivitySection`: recebem dados normalizados e interagem com `fetchFollowers`/`fetchFollowing` conforme o usuário clica em “Ver todos”.
- **Sessões**: `fetchUserSessionsAdmin` popula histórico de salas diretamente no componente de atividade.

---

## 5. Instrutores (`src/app/instructors` + `src/services/tutor.ts`)

### 5.1 Serviço (`src/services/tutor.ts`)
- **Lista**: `fetchInstructors(params)` usa `api` contra `user-tutor-list?action=list`. Adaptação fica em `normalizeListResponse`.
- **Perfil completo**: `fetchInstructorProfile(id)` chama `invokeFunction("tutor", { method: "GET", body: { tutorId: id } })` e passa a resposta para `adaptInstructorProfilePayload`.
- **Sessões de um instrutor**: `fetchTutorSessionsAdmin` usa `invokeFunction("list-live-chat-room-by-tutor", { tutorId })` e retorna `live`, `upcoming`, `finished`.
- **Seguidores**: `fetchInstructorFollowers` chama `invokeFunction("tutor-follow", { tutorId, page, perPage })`, processando arrays via `collectFollowersArray`.
- **Atualização**: `updateInstructor` envia `PUT tutor` e opcionalmente `POST tutor-photo` (multipart).
- **Remoção**: `deleteInstructor` simplifica para `invokeFunction("tutor", { method: "DELETE", body: { tutorId } })`.

### 5.2 Listagem e Perfil (`pages/instructors-page.tsx` & `pages/instructor-profile-page.tsx`)
- **Lista**:
  1. Hooks controlam `search`, `status`, `page`.
  2. `useEffect` consulta `fetchInstructors`.
  3. `InstructorCard` exibe dados adaptados, com botões para navegar ao perfil ou abrir `EditInstructorModal`.
- **Perfil**:
  - Carrega dados com `fetchInstructorProfile` e repassa para `InstructorHero`, `InstructorStats` e `InstructorActivitySection`.
  - Modal `InstructorFollowersModal` usa `fetchInstructorFollowers` paginado.

### 5.3 Criação (`components/create-instructor-modal.tsx`)
- Já descrito parcialmente (seção 3.2), mas foco no **envio**:
  1. `invokeFunction("tutor", { method: "POST", body })` cria o instrutor.
  2. Se houver arquivo, monta `FormData` e chama `invokeFunction("tutor-photo", { method: "POST", body: fd })`.
  3. Eventos `window.dispatchEvent(new CustomEvent("tutor:created"))` notificam outras telas.

---

## 6. Rede (Network) (`src/app/network`)

### 6.1 Serviço (`src/services/network.ts`)
- `fetchLiveChatRooms()` usa `invokeFunction("users-live-chat-rooms", { method: "GET" })` para buscar as salas diretamente na tabela `LiveChatRoom`. O helper já adapta o payload para `{ id, title, instructor: { name }, participants_count }` antes de entregar ao React.
- Para aplicar filtros diferentes (ex.: `status=soon`, `topics`), basta enviar query params extras via `invokeFunction` seguindo o contrato da edge function.
- Qualquer erro ao chamar a função Supabase é lançado e tratado pelo componente que usar o helper.

### 6.2 Página (`pages/index.tsx`)
- `useNetworkPage` chama `fetchLiveChatRooms` no `useEffect` inicial, salva o array em `rooms` e cuida de `loading`/`error` (`src/app/network/pages/index.tsx:56`). A paginação é local (`PAGE_SIZE = 6`) e controlada por `currentPage`.
- `NetworkPage` consome o hook para renderizar `ChatCard`s e, ao clicar em “Entrar”, abre `ChatView` com mensagens iniciais montadas em memória. O seletor “Filtrar por” ainda não dispara API; para separar “Ao vivo”/“Em espera”, basta repetir a chamada passando `status` diferente e atualizar `rooms`.
- `participants` e mensagens são mockados apenas para UX; o dado de salas vem do backend real.

---

## 7. Suporte (`src/app/support`)

### 7.1 Dashboard de Suporte (`pages/index.tsx`)
- Atualmente renderiza contagens e cards mockados.
- Estrutura de paginação (`page`, `goPage`, `pageAnimating`) já pronta para substituir `chats` por um payload real (ex.: `invokeFunction("support-chats")`).

### 7.2 Chat (`pages/[id]/support-chat-page.tsx`)
- Mock de conversa local; modal `Modal` pode ser alimentado por `useEffect` chamando `invokeFunction("support-chat-detail", { chatId })`.
- Hooks `useParams` e `useState` já isolam o `id` e controlam as interações do usuário.

---

## 8. Métricas (`src/app/metrics/pages/index.tsx`)

- Totalmente estático no momento, mas os componentes (`Card`, `Button`) já estão organizados para receber dados de um hook.
- Sugestão: criar `useMetricsDashboard` que chame um endpoint consolidado (ex.: `api.get("/metrics/overview")`) e substitua os arrays `revenueCards`, `subscriptionCards`, etc.

---

## 9. Not Found & Utilidades

- **NotFoundPage** (`src/app/not-found/pages/index.tsx`) não chama APIs, apenas consome `Link` e `Image`.
- **Supabase helpers**: arquivos em `supabase/` (`teste-function.ts` consulta perfis; `teste-bucket.ts` ilustra upload no bucket `profile-photos`) servem como referência para novas edge functions consumidas via `invokeFunction`.

---

## 10. Checklist para novos endpoints

1. **Defina o contrato** (payload/resposta) e adicione um helper em `src/services/*`.
2. **Escolha o cliente**:
   - Supabase Edge → `invokeFunction("nome", { method, body })`.
   - REST aprovado → `api({ method, url, params/body })`.
3. **Normalize a resposta** no helper (arrays, meta, status).
4. **Atualize o componente** para chamar o helper em `useEffect` ou handlers, controlando `loading`/`error`.
5. **Propague eventos globais** (`window.dispatchEvent`) quando a criação/edição precisar recarregar outras telas (ex.: `session:created`, `tutor:created`).

Seguindo esse fluxo, todos os módulos — de Autenticação a Suporte — mantêm chamadas consistentes, com estados previsíveis e componentes desacoplados da implementação real das APIs.
