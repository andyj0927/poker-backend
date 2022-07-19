import { WebSocket } from "ws";

export class Player {
  name: string;
  stack: number;
  bestWin: number;
  websocket: WebSocket;
  card: string; // "1-H" == "Ace of Hearts", "10-D" == "Ten of Diamonds"

  constructor(name: string, stack: number, bestWin: number, card: string, websocket: WebSocket) {
    this.name = name;
    this.stack = stack;
    this.bestWin = bestWin;
    this.card = card;
    this.websocket = websocket;
  }
}

export interface PokerMove {
  gameId: string;

  // the player who made the latest move
  player: number;

  // "RAISE <amount>" | "CALL" | "FOLD" | "EXIT"
  action: string;
}

export class PokerMoveResult {
  player: number;
  status: number; // 0: betting is not over, 1: player1 won, 2: player2 won, 3: draw
  stack1: number;
  bet1: number;
  stack2: number;
  bet2: number;

  constructor(player: number, status: number, stack1: number, bet1: number, stack2: number, bet2: number) {
    this.player = player;
    this.status = status;
    this.stack1 = stack1;
    this.bet1 = bet1;
    this.stack2 = stack2;
    this.bet2 = bet2;
  }
}

// represents the game state
export class PokerGame {
  player1: Player;
  player2: Player;

  // the player who bets first, 1 or 2
  dealer: number;
  round: number;

  stack1: number;
  bet1: number;
  stack2: number;
  bet2: number;

  deck: string[];

  constructor(player1: Player, player2: Player, stack1: number, bet1: number, stack2: number, bet2: number) {
    this.player1 = player1;
    this.player2 = player2;
    this.dealer = 1;
    this.round = 0;

    this.stack1 = stack1;
    this.bet1 = bet1;
    this.stack2 = stack2;
    this.bet2 = bet2;

    this.deck = [
      "1-S",
      "1-H",
      "2-S",
      "2-H",
      "3-S",
      "3-H",
      "4-S",
      "4-H",
      "5-S",
      "5-H",
      "6-S",
      "6-H",
      "7-S",
      "7-H",
      "8-S",
      "8-H",
      "9-S",
      "9-H",
      "10-S",
      "10-H",
    ];

    this.deck = this.deck
      .map((v) => ({ v, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ v }) => v);
  }

  makeMove(move: PokerMove): PokerMoveResult {
    // the player who made the latest move
    let player = move.player;
    let action = move.action;

    // action is "FOLD"
    if (action === "FOLD") {
      this.round++;
      // player 1 folded
      if (player === 1) {
        this.stack2 += this.bet1 + this.bet2;
        if (this.player1.card.split("-")[0] === "10") {
          let lose = Math.min(1000, this.stack1);
          this.stack1 -= lose;
          this.stack2 += lose;
        }
        this.bet1 = 0;
        this.bet2 = 0;
        return new PokerMoveResult(1, 2, this.stack1, this.bet1, this.stack2, this.bet2);
      }
      // player 2 folded
      else {
        this.stack1 += this.bet1 + this.bet2;
        if (this.player2.card.split("-")[0] === "10") {
          let lose = Math.min(1000, this.stack2);
          this.stack2 -= lose;
          this.stack1 += lose;
        }
        this.bet1 = 0;
        this.bet2 = 0;
        return new PokerMoveResult(2, 1, this.stack1, this.bet1, this.stack2, this.bet2);
      }
    }

    // action is "CALL"
    else if (action === "CALL") {
      this.round++;
      let card1 = this.player1.card;
      let card2 = this.player2.card;

      if (player === 1) {
        this.stack1 -= this.bet2 - this.bet1;
        this.bet1 = this.bet2;
      } else {
        this.stack2 -= this.bet1 - this.bet2;
        this.bet2 = this.bet1;
      }

      switch (winner(card1, card2)) {
        case 1:
          this.stack1 += this.bet1 + this.bet2;
          this.bet1 = 0;
          this.bet2 = 0;
          return new PokerMoveResult(player, 1, this.stack1, this.bet1, this.stack2, this.bet2);
        case 2:
          this.stack2 += this.bet1 + this.bet2;
          this.bet1 = 0;
          this.bet2 = 0;
          return new PokerMoveResult(player, 2, this.stack1, this.bet1, this.stack2, this.bet2);
        default:
          this.stack1 += this.bet1;
          this.stack2 += this.bet2;
          this.bet1 = 0;
          this.bet2 = 0;
          return new PokerMoveResult(player, 3, this.stack1, this.bet1, this.stack2, this.bet2);
      }
    }

    // action is "CHECK"
    else if (action === "CHECK") {
      // if the non-dealer checks, it means the dealer checked before, so betting is over
      if (player !== this.dealer) {
        this.round++;
        let card1 = this.player1.card;
        let card2 = this.player2.card;

        switch (winner(card1, card2)) {
          // player 1 won
          case 1:
            this.stack1 += this.bet1 + this.bet2;
            this.bet1 = 0;
            this.bet2 = 0;
            return new PokerMoveResult(player, 1, this.stack1, this.bet1, this.stack2, this.bet2);
          case 2:
            // player 2 won
            this.stack2 += this.bet1 + this.bet2;
            this.bet1 = 0;
            this.bet2 = 0;
            return new PokerMoveResult(player, 2, this.stack1, this.bet1, this.stack2, this.bet2);
          default:
            // draw
            this.stack1 += this.bet1;
            this.stack2 += this.bet2;
            this.bet1 = 0;
            this.bet2 = 0;
            return new PokerMoveResult(player, 3, this.stack1, this.bet1, this.stack2, this.bet2);
        }
      }

      // player 1 checked (first move), betting is not over
      return new PokerMoveResult(player, 0, this.stack1, this.bet1, this.stack2, this.bet2);
    }

    // action is "RAISE <amount>"
    else {
      let amount: number = parseInt(action.split(" ")[1]);
      if (player === 1) {
        this.stack1 -= amount - this.bet1;
        this.bet1 = amount;
      } else {
        this.stack2 -= amount - this.bet2;
        this.bet2 = amount;
      }
      return new PokerMoveResult(player, 0, this.stack1, this.bet1, this.stack2, this.bet2);
    }
  }
}

function winner(card1: string, card2: string): number {
  let n1 = parseInt(card1.split("-")[0]);
  let n2 = parseInt(card2.split("-")[0]);

  if (n1 > n2) return 1;
  else if (n1 < n2) return 2;
  else return 0;
}
