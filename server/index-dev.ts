import fs from "node:fs";
import { type Server } from "node:http";
import path from "node:path";

import type { Express } from "express";
import { nanoid } from "nanoid";
import { createServer as createViteServer, createLogger } from "vite";

import runApp from "./app";
import { log } from "./app";

import viteConfig from "../vite.config";

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Debug middleware to log all incoming requests
  app.use((req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/proxy') || url.startsWith('/api/') || url.startsWith('/remote')) {
      log(`[DEBUG] Request: ${req.method} ${url}`);
    }
    next();
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip SPA handling for API routes, proxy, and other backend endpoints
    // These are handled by Express routes registered in registerRoutes()
    if (url.startsWith('/api/') || 
        url.startsWith('/proxy') || 
        url.startsWith('/remote') ||
        url.startsWith('/embed') ||
        url === '/remote.js' ||
        url === '/logigo-sw.js') {
      log(`[DEBUG] Skipping SPA for: ${url}`);
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  await runApp(setupVite);
})();
