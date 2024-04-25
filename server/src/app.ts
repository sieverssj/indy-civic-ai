import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { Operator } from "./assistants/index.js";

interface TypedRequestBody<T> extends Express.Request {
  body: T;
}

const operator = new Operator();
const app = express();
app.use(cors());
app.use(
  express.json({
    strict: true,
  }),
);

app.use((req, res, next) => {
  console.log("%s %s %s", req.method, req.url, req.path);
  next();
});

app.post(
  "/chat",
  async (
    req: TypedRequestBody<{ message: string; threadId?: string }>,
    res,
  ) => {
    let threadId = req.body.threadId;
    if (!threadId) {
      const thread = await operator.createThread();
      threadId = thread.id;
    }
    await operator.addMessage(threadId, req.body.message);
    const runResults = await operator.createRun(threadId);
    res.send({
      data: runResults,
      meta: {
        threadId: threadId,
      },
    });
  },
);

app.use(((err, req, res, next) => {
  console.log("Server Error");
  res.status(500).send(err);
}) as ErrorRequestHandler);

export default app;
