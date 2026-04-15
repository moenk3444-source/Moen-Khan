import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/contact", (req, res) => {
    const { name, email, phone, message } = req.body;
    
    // In a real app, you'd use a service like Resend, SendGrid, or Mailgun here.
    // For now, we'll log the contact request and return a success response.
    console.log("New Contact Request:", { name, email, phone, message });
    
    // Simulate a delay
    setTimeout(() => {
      res.json({ 
        success: true, 
        message: "Your message has been received. Sarah Khan will contact you shortly." 
      });
    }, 1000);
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
