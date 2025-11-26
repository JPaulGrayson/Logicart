import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve LogiGo demo files (must be before Vite middleware)
  app.use("/demo", express.static(path.join(__dirname, "..", "example")));
  app.use("/demo-src", express.static(path.join(__dirname, "..", "src")));
  
  // Serve the test page explicitly
  app.get("/test-antigravity.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "example", "test-antigravity.html"));
  });
  
  // Serve the extension files
  app.get("/extension.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "extension", "extension.html"));
  });

  app.get("/extension.json", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "extension", "extension.json"));
  });

  app.use("/assets", (req, res, next) => {
    const assetPath = path.join(__dirname, "..", "dist", "extension", "assets", req.path);
    res.sendFile(assetPath);
  });

  const httpServer = createServer(app);

  return httpServer;
}
