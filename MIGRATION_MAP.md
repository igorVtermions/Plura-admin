# Mapa de Migração: API Local para Supabase Edge Functions

Este documento rastreia a migração de cada endpoint da API REST antiga (baseada em Axios) para as novas Supabase Edge Functions.

**Status:**
-   `Pendente`: A migração ainda não foi iniciada.
-   `Em Andamento`: A refatoração está sendo feita.
-   `Concluído`: A refatoração foi concluída e a funcionalidade foi verificada.
-   `Bloqueado`: Há um problema que impede a migração.

| Arquivo no Frontend | Endpoint Antigo (Local) | Método HTTP | Edge Function (Supabase) | Status da Migração | Notas |
| ------------------- | ----------------------- | ----------- | ------------------------ | ------------------ | ----- |
| `features/home/components/rooms-control.tsx` | `/admin/live-chat-rooms` | `GET` | `room-admin`? | Pendente | |
| `features/home/components/rooms-control.tsx` | `/users/live-chat-rooms` | `GET` | `users-live-chat-rooms` | Pendente | |
| `features/users/api.ts` | `/admin/users` | `GET` | `users-users`? | Pendente | |
| `features/users/api.ts` | `/admin/users/{userId}/ban` | `POST` | `user-auth`? ou endpoint específico de ban? | Pendente | |
| `features/users/api.ts` | `/admin/users/{userId}` | `PATCH` | `user-update-profile`? | Pendente | |
| `features/users/api.ts` | `/admin/users/{userId}/unban` | `POST` | `user-auth`? ou endpoint específico de unban? | Pendente | |
| `features/users/api.ts` | `/admin/users/{userId}` | `GET` | `user-profile` | Pendente | |
| `features/users/api.ts` | `/admin/users/{userId}/sessions` | `GET` | `list-live-chat-room-by-tutor`? | Pendente | |
| `features/users/api.ts` | `/users/{userId}/followers` | `GET` | `user-follow`? | Pendente | |
| `features/users/api.ts` | `/users/{userId}/following` | `GET` | `user-follow`? | Pendente | |
| `features/instructors/api.ts` | `/tutors` | `GET` | `user-tutor-list` | Pendente | |
| `features/instructors/api.ts` | `/tutors/{id}` | `GET` | `tutor`? | Pendente | |
| `features/instructors/api.ts` | `/api/admin/tutors/{tutorId}/sessions` | `GET` | `list-live-chat-room-by-tutor`? | Pendente | |
| `features/instructors/api.ts` | `/admin/tutors/{tutorId}/sessions` | `GET` | `list-live-chat-room-by-tutor`? | Pendente | |
| `features/instructors/api.ts` | `/tutors/{tutorId}/followers` | `GET` | `tutor-follow`? | Pendente | |
| `features/instructors/api.ts` | `/tutors/{tutorId}` | `PUT` | `tutor`? | Pendente | |
| `features/instructors/api.ts` | `/tutors/{tutorId}/photo` | `POST` | `tutor-photo` | Pendente | Envio de arquivo |
| `features/instructors/api.ts` | `/tutors/{id}` | `DELETE` | `tutor`? | Pendente | |
| `features/auth/components/verify-pin-form.tsx` | `/admin/pin/verify` | `POST` | `verify-pin` | Concluído | |
| `features/auth/components/verify-pin-form.tsx` | `/admin/pin/resend` | `POST` | `resend-pin` | Concluído | |
| `features/auth/components/forgot-password-form.tsx` | `/admin/password/forgot` | `POST` | `users-forgot-password` | Concluído | |
| `features/auth/components/register-form.tsx` | `/admin/register` | `POST` | `register` | Concluído | |
| `features/auth/components/register-form.tsx` | `/admin/pin/send` | `POST` | `send-pin` | Concluído | |
| `features/auth/components/login-form.tsx` | `/admin/login` | `POST` | `users-login` | Concluído | |
| `features/auth/components/reset-password-form.tsx` | `/admin/password/verify` | `POST` | `users-verify-reset-pin` | Concluído | |
| `features/auth/components/reset-password-form.tsx` | `/admin/password/reset` | `POST` | `users-reset-password` | Concluído | |
| `components/session/CreateSessionModal.tsx` | `/tutors` | `GET` | `user-tutor-list` | Pendente | |
| `components/session/CreateSessionModal.tsx` | `/tutors/topics/available` | `GET` | `tutor-topics` | Pendente | |
| `components/session/CreateSessionModal.tsx` | `/admin/live-chat-rooms` | `POST` | `live-chat-room`? | Pendente | |
| `components/layout/header.tsx` | `/admin/me` | `GET` | `users-me` | Concluído | |
| `components/layout/header.tsx` | `/admin/logout` | `POST` | `supabase.auth.signOut()` | Concluído | Substituído por chamada local do cliente |
| `components/instructor/CreateInstructorModal.tsx` | `/tutors/{tutorId}` | `PUT` | `tutor`? ou `user-update-profile`? | Pendente | |
| `components/instructor/CreateInstructorModal.tsx` | `/tutors/{tutorId}/photo` | `POST` | `tutor-photo` | Pendente | Envio de arquivo |
| `components/instructor/CreateInstructorModal.tsx` | `/tutors` | `POST` | `tutor` | Pendente | |
| `components/layout/Notifications.tsx` | `/admin/notifications` | `GET` | `users-notifications` | Pendente | |

