# LeadFlow frontend

The LeadFlow client uses React, Vite, TypeScript, Tailwind CSS, and Oxlint.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

TypeScript is configured with strict checking. Run `npm run typecheck` to check the
frontend before creating a production build.

## TypeScript checks

Run `npm run typecheck` to check the frontend types before building with `npm run build`.
