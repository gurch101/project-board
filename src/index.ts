import { serve } from "bun";
import index from "./index.html";
import db from "./db";
import { createFetchHandler } from "./server";

const apiHandler = createFetchHandler(db);

const server = serve({
  routes: {
    // API Routes for Kanban Board
    "/api/*": apiHandler,

    // Serve index.html for all unrelated routes (SPA fallback)
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
