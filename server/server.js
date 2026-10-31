const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
if (uri) {
  mongoose
    .connect(uri)
    .then(() => console.log("MongoDB database connection established successfully"))
    .catch((err) => console.error("MongoDB connection error:", err.message));
} else {
  console.log("No MONGO_URI provided in environment. Running without persistent database.");
}

const Score = require("./model");
app.post("/api/scores", async (req, res) => {
  try {
    const { name, time, level } = req.body;
    const newScore = new Score({ name, time, level });
    await newScore.save();
    res.status(201).json(newScore);
  } catch (error) {
    res.status(500).json("Error: " + error);
  }
});

app.get("/api/scores/:level", async (req, res) => {
  try {
    const level = req.params.level;
    const scores = await Score.find({ level: level })
      .sort({ time: 1 })
      .limit(10);
    res.json(scores);
  } catch (error) {
    res.status(500).json("Error: " + error);
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function generateBombs(count = 3) {
  const bombIndices = new Set();
  const safeCount = Math.min(Math.max(1, count), 24);
  while (bombIndices.size < safeCount) {
    bombIndices.add(Math.floor(Math.random() * 25));
  }
  return Array.from(bombIndices);
}

const matchmakingQueue = [];
const activeMatches = new Map();

function broadcastOnlineCount() {
  io.emit("online_count", io.engine.clientsCount);
}

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);
  broadcastOnlineCount();

  socket.emit("online_count", io.engine.clientsCount);

  socket.on("find_match", ({ playerName, numMines }) => {
    const existingIndex = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
    if (existingIndex !== -1) {
      matchmakingQueue.splice(existingIndex, 1);
    }

    while (matchmakingQueue.length > 0) {
      const opponentData = matchmakingQueue.shift();
      const opponentSocket = io.sockets.sockets.get(opponentData.socketId);

      if (opponentSocket && opponentSocket.connected && opponentData.socketId !== socket.id) {
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const mines = Number(numMines) || 3;

        const match = {
          id: matchId,
          numMines: mines,
          bombs: generateBombs(mines),
          board: Array(25).fill("X"),
          turn: Math.random() < 0.5 ? socket.id : opponentData.socketId,
          players: [
            {
              id: opponentData.socketId,
              name: opponentData.playerName,
              score: 0,
              rematchReady: false,
            },
            {
              id: socket.id,
              name: playerName?.trim() || "Player 2",
              score: 0,
              rematchReady: false,
            },
          ],
          status: "playing",
          winner: null,
        };

        activeMatches.set(matchId, match);
        socket.join(matchId);
        opponentSocket.join(matchId);

        io.to(matchId).emit("match_found", {
          matchId,
          numMines: match.numMines,
          board: match.board,
          players: match.players,
          currentTurn: match.turn,
        });
        return;
      }
    }

    matchmakingQueue.push({
      socketId: socket.id,
      playerName: playerName?.trim() || "Player 1",
      numMines: Number(numMines) || 3,
    });

    socket.emit("searching_match");
  });

  socket.on("cancel_match", () => {
    const idx = matchmakingQueue.findIndex((p) => p.socketId === socket.id);
    if (idx !== -1) {
      matchmakingQueue.splice(idx, 1);
    }
    socket.emit("match_cancelled");
  });

  socket.on("make_move", ({ matchId, tileIndex }) => {
    const match = activeMatches.get(matchId);
    if (!match || match.status !== "playing") return;
    if (match.turn !== socket.id) {
      return socket.emit("error_msg", "It's not your turn!");
    }
    if (tileIndex < 0 || tileIndex >= 25 || match.board[tileIndex] !== "X") {
      return;
    }

    const currentPlayer = match.players.find((p) => p.id === socket.id);
    const opponent = match.players.find((p) => p.id !== socket.id);
    const isBomb = match.bombs.includes(tileIndex);

    if (isBomb) {
      match.board[tileIndex] = "💣";
      match.status = "finished";
      match.winner = opponent ? opponent.name : "Opponent";

      const fullBoard = [...match.board];
      for (let i = 0; i < 25; i++) {
        if (match.bombs.includes(i)) {
          fullBoard[i] = "💣";
        } else if (fullBoard[i] === "X") {
          fullBoard[i] = "💎";
        }
      }
      match.board = fullBoard;

      io.to(matchId).emit("game_over", {
        board: fullBoard,
        bombs: match.bombs,
        players: match.players,
        winner: match.winner,
        winnerId: opponent ? opponent.id : null,
        reason: `${currentPlayer.name} hit a bomb!`,
      });
    } else {
      match.board[tileIndex] = "💎";
      currentPlayer.score += 1;

      const totalDiamondsNeeded = 25 - match.numMines;
      const diamondsRevealed = match.board.filter((t) => t === "💎").length;

      if (diamondsRevealed === totalDiamondsNeeded) {
        match.status = "finished";
        let winnerName = "Tie";
        let winnerId = null;
        if (match.players[0].score > match.players[1].score) {
          winnerName = match.players[0].name;
          winnerId = match.players[0].id;
        } else if (match.players[1].score > match.players[0].score) {
          winnerName = match.players[1].name;
          winnerId = match.players[1].id;
        }
        match.winner = winnerName;

        const fullBoard = [...match.board];
        for (let i = 0; i < 25; i++) {
          if (match.bombs.includes(i)) fullBoard[i] = "💣";
        }
        match.board = fullBoard;

        io.to(matchId).emit("game_over", {
          board: fullBoard,
          bombs: match.bombs,
          players: match.players,
          winner: winnerName,
          winnerId,
          reason: "All diamonds revealed! Highest score wins!",
        });
      } else {
        match.turn = opponent ? opponent.id : socket.id;
        io.to(matchId).emit("board_updated", {
          board: match.board,
          players: match.players,
          currentTurn: match.turn,
          lastMove: {
            player: currentPlayer.name,
            tileIndex,
            result: "💎",
          },
        });
      }
    }
  });

  socket.on("request_rematch", ({ matchId }) => {
    const match = activeMatches.get(matchId);
    if (!match) return;

    const player = match.players.find((p) => p.id === socket.id);
    if (player) {
      player.rematchReady = true;
    }

    const allReady = match.players.length === 2 && match.players.every((p) => p.rematchReady);
    if (allReady) {
      match.bombs = generateBombs(match.numMines);
      match.board = Array(25).fill("X");
      match.status = "playing";
      match.winner = null;
      match.players.forEach((p) => {
        p.score = 0;
        p.rematchReady = false;
      });
      match.turn = match.players[Math.floor(Math.random() * 2)].id;

      io.to(matchId).emit("rematch_started", {
        board: match.board,
        players: match.players,
        currentTurn: match.turn,
      });
    } else {
      io.to(matchId).emit("rematch_requested", {
        requestedBy: player ? player.name : "Opponent",
      });
    }
  });

  const cleanupPlayer = (socketId) => {
    const qIndex = matchmakingQueue.findIndex((p) => p.socketId === socketId);
    if (qIndex !== -1) {
      matchmakingQueue.splice(qIndex, 1);
    }

    for (const [matchId, match] of activeMatches.entries()) {
      const leavingPlayerIndex = match.players.findIndex((p) => p.id === socketId);
      if (leavingPlayerIndex !== -1) {
        const leavingPlayer = match.players[leavingPlayerIndex];
        io.to(matchId).emit("opponent_left", {
          message: `${leavingPlayer.name} left the match.`,
        });
        activeMatches.delete(matchId);
      }
    }
  };

  socket.on("leave_match", () => {
    cleanupPlayer(socket.id);
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    cleanupPlayer(socket.id);
    broadcastOnlineCount();
  });
});

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
