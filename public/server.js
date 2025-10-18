const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const favicon = require("serve-favicon");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(favicon(path.join(__dirname, "favicon.ico")));
app.use(express.static(path.join(__dirname)));
let games = new Map();

//script.js

io.on("connection", (socket) => {
  socket.on("joinGame", (playerName) => {
    let game;

    // Check if there's an existing game with space for more players
    for (let gId of games.keys()) {
      const g = games.get(gId);
      if (g.players.length < g.maxPlayers) {
        game = g;
        break;
      }
    }

    // If no game found, create a new one
    if (!game) {
      const gameId = `game-${Date.now().toString(36) + Math.random().toString(36).substring(2, 15)}`;
      game = new Game(gameId);
      games.set(gameId, game);
    }

    const player = game.playerJoin(socket, playerName);

    // join the socket.io room for this game
    if (player) {
      socket.join(game.id);
      socket.gameId = game.id;

      const playerData = {
        playerName: player.name,
        playerId: player.id,
        hand: player.hand,
      };

      socket.emit("gameJoined", {
        gameId: game.id,
        playerName: player.name,
        playerData: playerData,
      });

      console.log(
        `Player ${player.name} joined game ${game.id} game has ${game.players.length} players.`
      );
    }

    // If the game is now full, start it
    if (game.players.length === game.maxPlayers) {
      const gameData = {
        id: game.id,
        players: game.players.map((p) => ({
          id: p.id,
          name: p.name,
          hand: p.hand,
        })),
        maxPlayers: game.maxPlayers,
      };

      io.to(game.id).emit("gameReady", gameData);
      game.startGame();
    } else {
      socket.emit("waitingForPlayer", { gameId: game.id });
    }

    socket.on("playCard", (card, playerSocketId) => {
      console.log(card);
      game.playCard(card, playerSocketId);
    });

    // Handle player disconnection
    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

function emitToGame(gameId, event, data) {
  io.to(gameId).emit(event, data);
}

class Game {
  constructor(id) {
    this.id = id;
    this.deck = [];
    this.players = [];
    this.maxPlayers = 3;
    this.trump;
    this.currentAttacker = null;
    this.currentDefender = null;
    this.cardsInPlay = [];
    this.cardsAttacking = [];
  }

  createDeck() {
    const Suits = ["hearts", "diamonds", "clubs", "spades"];
    const Ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    for (let Suit of Suits) {
      for (let Rank of Ranks) {
        this.deck.push({
          suit: Suit,
          rank: Rank,
          img: `cards/${Suit}_${Rank}.png`,
        });
      }
    }
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  drawCard() {
    return this.deck.pop();
  }

  // Only deal cards at the start of the game
  dealCards() {
    for (let player of this.players) {
      player.hand = [];
      for (let i = 0; i < 6; i++) {
        player.hand.push(this.drawCard());
      }
      console.log(`Dealt cards to player ${player.name}:`, player.hand);
    }
  }

  getTrump() {
    this.trump = this.deck[this.deck.length - 1].suit;
    console.log(`Trump suit is ${this.trump}`);
  }

  playerJoin(socket, playerName) {
    if (this.players.length < this.maxPlayers) {
      const player = {
        socket: socket,
        name: playerName,
        hand: [],
        id: this.players.length + 1,
      };
      this.players.push(player);
      console.log(`Player ${playerName} joined game ${this.id}`);
      return player;
    }
    return null;
  }

  sendHands() {
    console.log("sending hand");
    this.players.forEach((player) => {
      player.socket.emit("getHand", JSON.stringify(player.hand));
    });
  }

  playCard(card, playerSocketId) {
    if (this.canPlayCard(card, playerSocketId)) {
      emitToGame(this.id, "cardPlayed", card);
      this.cardsInPlay.push(card);
      this.cardsAttacking.push(card);
    }
  }

  canPlayCard(card, playerSocketId) {
    const player = this.players.find((p) => p.socket.id === playerSocketId);
    if (this.cardsInPlay.length === 0 && this.currentAttacker === player) {
      player.socket.emit("canPlay", card);
      return true;
    } else if (this.cardsInPlay.length > 0 && this.currentDefender !== player) {
      for (let playedCard of this.cardsInPlay) {
        if (card.rank === playedCard.rank) {
          player.socket.emit("canPlay", card);
          return true;
        }
      }
    }
    return false;
  }

  // select the first attacker buy who has the lowest trump card. selects the defender as the person next to attacker.
  sentFirstAttackAndDefender() {
    let cardLowest = null;
    for (let player of this.players) {
      for (let card of player.hand) {
        if (card.suit === this.trump) {
          if (!cardLowest || card.rank < cardLowest.rank) {
            cardLowest = card;
            this.currentAttacker = player;
          }
        }
      }
    }
    if (!this.currentAttacker) {
      this.currentAttacker = this.players[0];
    }
    this.currentAttacker.socket.emit("attacker");
    const defenderIndex =
      (this.players.indexOf(this.currentAttacker) + 1) % this.players.length;
    this.currentDefender = this.players[defenderIndex];
    this.currentDefender.socket.emit("defender");
  }

  startGame() {
    console.log(`Game ${this.id} is starting with players:`, this.players);
    this.createDeck();
    this.shuffleDeck();
    this.dealCards();
    this.getTrump();
    this.sendHands();
    this.sentFirstAttackAndDefender();
  }
}

module.exports = app;
