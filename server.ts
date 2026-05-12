import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import helmet from "helmet";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for dev
  app.use(express.json());

  // Create HTTP server instead of listening directly on Express app
  const server = http.createServer(app);

  // Configure Socket.IO
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Messaging specific room (e.g. joined by requisition ID)
    socket.on("join_requisition", (requisitionId) => {
      socket.join(`requisition_${requisitionId}`);
      console.log(`Socket ${socket.id} joined room requisition_${requisitionId}`);
    });

    // Real-time collaboration cursor/updates
    socket.on("collab_update", (data) => {
      // Broadcast to others in the same room
      socket.to(`requisition_${data.requisitionId}`).emit("collab_update", data);
    });

    socket.on("send_message", (data) => {
      // Broadcast to room
      io.to(`requisition_${data.requisitionId}`).emit("new_message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const { routes } = await import("./src/routes");
  app.use(routes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
