import express, { type ErrorRequestHandler } from "express";
import { Assistants } from "./assistants/index.js";

interface TypedRequestBody<T> extends Express.Request {
  body: T
}

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

app.post("/chat", async (req: TypedRequestBody<{ message: string, threadId?: string }>, res) => {
  let threadId = req.body.threadId;
  if (!threadId) {
    const thread = await assistants.createThread();
    threadId = thread.id;
  }
  await assistants.addMessage(
    threadId,
    req.body.message
  );
  const runResults = await assistants.createRun(threadId);
  res.send({
    data: runResults,
    meta: {
      threadId: threadId
    }
  });
});

app.use(((err, req, res, next) => {
  console.log("Server Error");
  res.status(500).send(err);
}) as ErrorRequestHandler);

export default app;
