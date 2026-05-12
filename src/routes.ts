import { Router } from "express";
import { prisma } from "./lib/prisma";

export const routes = Router();

// Demo seeding
routes.post("/api/seed-demo", async (req, res) => {
  try {
    const u1 = await prisma.user.upsert({
      where: { id: "u1" }, // In our fake data we use 'u1', but ID is string UUID. Actually let's just create if not exists
      update: {},
      create: {
        id: "u1",
        email: "alice@example.com",
        passwordHash: "fake",
        role: "admin",
        fullName: "Alice (Admin)"
      }
    });
    
    const u2 = await prisma.user.upsert({
      where: { id: "u2" },
      update: {},
      create: {
        id: "u2",
        email: "bob@example.com",
        passwordHash: "fake",
        role: "user",
        fullName: "Bob (User)"
      }
    });

    const service = await prisma.service.create({
      data: {
        id: "ser-123",
        name: "Test Service",
        description: "A test service for demo",
        category: "Demo",
        price: 100,
        feeStructure: "{}",
        requirements: "[]",
        workflowSteps: "[]",
        createdBy: u1.id
      }
    }).catch(() => {}); // might exist

    await prisma.requisition.upsert({
      where: { id: "req-123" },
      update: {},
      create: {
        id: "req-123",
        userId: "u2",
        serviceId: "ser-123",
        status: "under_review"
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to seed demo" });
  }
});

// Get messages for a specific requisition
routes.get("/api/requisitions/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await prisma.message.findMany({
      where: { requisitionId: id },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true }
        }
      }
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Post a new message
routes.post("/api/requisitions/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, content } = req.body; // In real app, senderId comes from auth token
    
    const message = await prisma.message.create({
      data: {
        requisitionId: id,
        senderId,
        content
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true }
        }
      }
    });
    
    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
});
