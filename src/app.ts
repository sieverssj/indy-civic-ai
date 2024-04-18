import express from "express";
import { Assistants } from "./assistants/index.js";

const assistants = new Assistants();
const app = express();
app.use(
  express.json({
    strict: true,
  }),
);

app.use((req, res, next) => {
  console.log("%s %s %s", req.method, req.url, req.path);
  next();
});

app.post("/chat", async (req, res) => {
  const thread = await assistants.createThread();
  const message = await assistants.addMessage(
    thread.id,
    "Tell me about noise ordinances",
  );
  const runResults = await assistants.createRun(thread.id);
  res.send(runResults);
});

export default app;
