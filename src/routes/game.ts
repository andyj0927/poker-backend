import { Router } from "express";
import { connection } from "../connection.js";
// import { getPlayerByName, players, games } from "../gameServer.js";
import { v4 as uuidv4 } from "uuid";
// import { Player, PokerTable } from "../poker.js";

const gameRouter: Router = Router();

export default gameRouter;
