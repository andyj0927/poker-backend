import express, { Express } from "express";
import playerRouter from "./routes/player.js";
import gameRouter from "./routes/game.js";
import websockets from "./gameServer.js";

const app: Express = express();
const port: number = 80;

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}\n\n`);
});

websockets(server);

app.use("/player", playerRouter);
app.use("/game", gameRouter);
