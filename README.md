Plura Talks - Administrador

Base do painel administrativo em React + Vite, TypeScript, Tailwind CSS v4 e componentes no padrão shadcn.

## Scripts

Disponíveis via npm:

```bash
npm run dev      # ambiente de desenvolvimento (Vite)
npm run build    # build de produção (gera dist/)
npm run preview  # servir o build localmente
```

Abra http://localhost:5173 no navegador para ver o resultado em desenvolvimento.

## Estrutura

Pastas principais:

- `src/App.tsx`: rotas com React Router e layout principal
- `src/main.tsx`: bootstrap da aplicação
- `src/components`: componentes compartilhados (layout, ui, etc.)
- `src/features`: páginas e módulos por domínio (auth, home, support, ...)
- `public/`: assets estáticos (favicons, svgs)

Aliases de importação:

- `@/*` aponta para `src/*` (configurado em `vite.config.ts` e `tsconfig.json`).

## Estilos

- Tailwind CSS v4 com PostCSS (ver `postcss.config.js`).
- Estilos globais em `src/app/globals.css`.

## Variáveis de ambiente

- Use o prefixo `VITE_` para expor ao front-end.
- Exemplo: `VITE_API_URL` consumida em `src/services/api.ts`.
- Crie um `.env` na raiz (ex.: `VITE_API_URL=https://...`).

## Favicon

- O favicon utilizado é `public/favicon.ico` (referenciado em `index.html`).

## Deploy

- Build: `npm ci && npm run build` → saída em `dist/`.
- Qualquer serviço de estáticos (incluindo Lovable) pode servir a pasta `dist/`.

