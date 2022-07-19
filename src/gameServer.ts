import { WebSocketServer, WebSocket } from "ws";
import qs from "qs";
import { v4 as uuidv4 } from "uuid";
import { IncomingMessage, Server } from "http";
import { connection } from "./connection.js";
import { Player, PokerGame, PokerMove, PokerMoveResult } from "./poker.js";

export let players: Player[] = [];
export let games = new Map<string, PokerGame>();

function getTwoCards(): string[] {
  let suits = ["S", "H"];
  let n1 = Math.floor(Math.random() * 10) + 1;
  let s1 = suits[Math.floor(Math.random() * 4)];
  let n2: number;
  let s2: string;

  do {
    n2 = Math.floor(Math.random() * 10) + 1;
    s2 = suits[Math.floor(Math.random() * 4)];
  } while (n1 == n2 || s1 == s2);

  return [`${n1}-${s1}`, `${n2}-${s2}`];
}

export default async (expressServer: Server) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: "/websockets",
  });

  expressServer.on("upgrade", (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  // websocket connection is established when a player joins a table
  websocketServer.on("connection", (websocketConnection: WebSocket, connectionRequest: IncomingMessage) => {
    // /websockets?name={name}&chipCount={chipCount}
    const [_path, params]: string[] = connectionRequest?.url?.split("?") as string[];
    const connectionParams: qs.ParsedQs = qs.parse(params);

    let name: string = connectionParams["name"] as string;
    let chipCount: number = parseInt(connectionParams["stack"] as string);

    // create a new player, don't give him card yet
    players.push(new Player(name, chipCount, 0, "", websocketConnection));

    // make odd numberth player wait
    if (players.length % 2 === 1) {
      websocketConnection.send(`{ "type": "waiting" }`);
    }
    // if even numberth player joins, pop two players and make a game
    else {
      const player1 = players[0];
      const player2 = players[1];

      // give players a card each

      let game = new PokerGame(player1, player2, player1.stack - 100, 100, player2.stack - 100, 100);
      player1.card = game.deck[0];
      player2.card = game.deck[1];
      let gameId: string = uuidv4();

      games.set(gameId, game);

      player1.websocket.send(
        `{
  "type": "gameStart", 
  "gameId": "${gameId}",
  "player": 1,
  "dealer": ${game.dealer},
  "card": "${player1.card}", 
  "opponent": { 
    "name": "${player2.name}", 
    "stack": ${player2.stack}, 
    "card": "${player2.card}"
  }
}`
      );

      player2.websocket.send(
        `{
  "type": "gameStart", 
  "gameId": "${gameId}",
  "player": 2, 
  "dealer": ${game.dealer},
  "card": "${player2.card}", 
  "opponent": { 
    "name": "${player1.name}", 
    "stack": ${player1.stack}, 
    "card": "${player1.card}"
  } 
}`
      );

      players.splice(0, 2);
    }

    // handle messages
    websocketConnection.on("message", (message) => {
      /**
       * {
       *   "gameId": uuid,
       *   "player": 1 or 2,
       *   "action": string
       * }
       */
      let move: PokerMove = JSON.parse(message.toString());
      let gameId: string = move["gameId"];
      let game: PokerGame = games.get(gameId) as PokerGame;

      let moveResult: PokerMoveResult = games.get(gameId)?.makeMove(move) as PokerMoveResult;
      let round = game.round;

      let status: number = moveResult.status;
      game.player1.websocket.send(`{ "type": "moveResult", "moveResult": ${JSON.stringify(moveResult)} }`);
      game.player2.websocket.send(`{ "type": "moveResult", "moveResult": ${JSON.stringify(moveResult)} }`);

      // if any of the players lose all money
      if (game.stack1 <= 100 || game.stack2 <= 100) {
        connection.query(`UPDATE players SET chip_count = ${game.stack1} WHERE name = "${game.player1.name}"`);
        connection.query(`UPDATE players SET chip_count = ${game.stack2} WHERE name = "${game.player2.name}"`);

        setTimeout(function () {
          game.player1.websocket.send(`{ "type": "exit" }`);
        }, 2000);
        setTimeout(function () {
          game.player2.websocket.send(`{ "type": "exit" }`);
        }, 2000);
        games.delete(gameId);
        return;
      }

      // betting is over
      if (status !== 0 && round < 10) {
        game.dealer = 3 - game.dealer;

        game.bet1 = 100;
        game.bet2 = 100;
        game.stack1 -= 100;
        game.stack2 -= 100;

        game.player1.card = game.deck[2 * game.round];
        game.player2.card = game.deck[2 * game.round + 1];
        console.log(game.round);

        setTimeout(function () {
          game.player1.websocket.send(
            `{
  "type": "newGame", 
  "dealer": ${game.dealer},
  "card": "${game.player1.card}",
  "stack": ${game.stack1},
  "bet": ${game.bet1},
  "opponent": {
    "stack": ${game.stack2},
    "card": "${game.player2.card}",
    "bet": ${game.bet2}
  }
}`
          );
        }, 2000);
        setTimeout(function () {
          game.player2.websocket.send(
            `{
  "type": "newGame", 
  "dealer": ${game.dealer},
  "card": "${game.player2.card}",
  "stack": ${game.stack2},
  "bet": ${game.bet2},
  "opponent": {
    "stack": ${game.stack1},
    "card": "${game.player1.card}",
    "bet": ${game.bet1}
  }
}`
          );
        }, 2000);
      }
      if (round === 10) {
        // end the game and close connection
        connection.query(`UPDATE players SET chip_count = ${game.stack1} WHERE name = "${game.player1.name}"`);
        connection.query(`UPDATE players SET chip_count = ${game.stack2} WHERE name = "${game.player2.name}"`);

        setTimeout(function () {
          game.player1.websocket.send(`{ "type": "exit" }`);
        }, 2000);
        setTimeout(function () {
          game.player2.websocket.send(`{ "type": "exit" }`);
        }, 2000);
        games.delete(gameId);
        return;
      }
    });

    // websocket connection is closed when a player exists a game
    // reason is the name of the player that just disconnected
    websocketConnection.on("close", (code, reason) => {
      console.log(`${reason.toString()} has disconnected!`);
      players = players.filter((p) => p.name !== reason.toString());
    });
  });

  return websocketServer;
};
