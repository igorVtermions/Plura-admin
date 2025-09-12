Plura Talks - Administrador

Base inicial do painel administrativo construída com Next.js (App Router), TypeScript, Tailwind CSS v4 e componentes no padrão shadcn.

## Scripts

Disponíveis via npm:

```bash
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produção
npm start         # servir build de produção
npm run lint      # lint
npm run lint:fix  # lint com correção
npm run format    # formatar com Prettier
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para ver o resultado.

Ponto de entrada da UI em `src/app/page.tsx`.

Este projeto usa [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) para otimizar o carregamento das fontes Geist.

## Estrutura

Pastas principais:

- `src/components/ui`: componentes base (ex.: Button)
- `src/lib`: utilitários (ex.: `cn`)
- `src/app`: rotas App Router e layouts

## Deploy

Pode ser feito via Vercel ou infraestrutura própria. Consulte a documentação do Next.js para detalhes de deploy em produção.
