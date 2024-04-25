import app from "./app.js";
import { ENV } from "./env.js";

console.log(`Listening on port ${ENV.SERVER_PORT}`);
app.listen(ENV.SERVER_PORT);
