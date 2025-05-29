import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  const PORT = Number(env.VITE_WEB_PORT ?? 3000);
  const HOST = env.VITE_WEB_HOSTNAME || 'localhost';

  return defineConfig({
    plugins: [react(), svgr()],
    css: { postcss: './postcss.config.cjs' },
    server: { host: HOST, port: PORT },
    define: { '__APP_VERSION__': JSON.stringify(process.env.npm_package_version) },
    build: {
      target: 'esnext',
      outDir: './dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      },
    },
  });
};
