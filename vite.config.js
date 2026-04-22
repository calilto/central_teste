import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Injetar envs no processo para que as funções do /api as encontrem
  process.env.SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    plugins: [
      react(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url.startsWith('/api/') && !req.url.includes('_utils')) {
              try {
                // Limpar URL e encontrar arquivo
                const url = new URL(req.url, `http://${req.headers.host}`);
                const apiPath = url.pathname;
                const filePath = path.join(process.cwd(), apiPath + '.js');

                if (fs.existsSync(filePath)) {
                  // Mock de res.status().json() para compatibilidade com Vercel
                  res.status = (code) => {
                    res.statusCode = code;
                    return res;
                  };
                  res.json = (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  };

                  // Mock de req.body
                  let body = '';
                  req.on('data', chunk => { body += chunk; });
                  await new Promise(resolve => req.on('end', resolve));
                  req.body = body; // Será parseado pelo readJson do _utils

                  // Importar e executar
                  const { default: handler } = await server.ssrLoadModule(filePath);
                  await handler(req, res);
                  return;
                }
              } catch (err) {
                console.error(`Erro na API Local (${req.url}):`, err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
                return;
              }
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
      strictPort: false,
      host: true,
    },
  };
})
