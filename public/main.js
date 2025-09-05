const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const favicon = require("serve-favicon");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(favicon(path.join(__dirname, "favicon.ico")));
app.use(express.static(path.join(__dirname, "loadingScreen")));

let games = new Map();

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

    if (player) {
      socket.join(game.id);

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
  });
});

io.on("disconnect", (socket) => {
  console.log(`Socket ${socket.id} disconnected`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "loadingScreen", "index.html"));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

module.exports = app;

class Game {
  constructor(id) {
    this.id = id;
    this.deck = [];
    this.players = [];
    this.maxPlayers = 2;
    this.trump;
  }

  createDeck() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    for (let suit of suits) {
      for (let rank of ranks) {
        const card = new Card(suit, rank, `${suit}_${rank}.png`);
        this.deck.push(card);
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

  startGame() {
    console.log(`Game ${this.id} is starting with players:`, this.players);
    this.createDeck();
    this.shuffleDeck();
    this.dealCards();
    this.getTrump();
  }
}

class Card {
  constructor(suit, rank, img) {
    this.suit = suit;
    this.rank = rank;
    this.img = img;
  }
}
