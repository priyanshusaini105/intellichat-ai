import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.post("/api/chat/message", (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, error: "Please enter a message" });
  }

  // Placeholder echo response; replace with real LLM integration.
  res.json({
    success: true,
    data: {
      reply: "Thanks for your message. This placeholder backend is running.",
    },
  });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
