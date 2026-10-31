import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import toast from "react-hot-toast";
import { Link } from "react-router";
import "./Multiplayer.css";

function Multiplayer() {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem("mines_player_name") || "";
  });
  const [numMines, setNumMines] = useState(3);
  const [onlineCount, setOnlineCount] = useState(1);

  const [gameState, setGameState] = useState("lobby");
  const [matchId, setMatchId] = useState("");
  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState(Array(25).fill("X"));
  const [currentTurn, setCurrentTurn] = useState("");
  const [gameOutcome, setGameOutcome] = useState("");
  const [outcomeReason, setOutcomeReason] = useState("");
  const [rematchRequested, setRematchRequested] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (gameState === "searching") {
      setSearchTimer(0);
      interval = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const onOnlineCount = (count) => {
      setOnlineCount(count || 1);
    };

    const onSearchingMatch = () => {
      setGameState("searching");
    };

    const onMatchCancelled = () => {
      setGameState("lobby");
      toast("Matchmaking cancelled");
    };

    const onMatchFound = (data) => {
      setMatchId(data.matchId);
      setNumMines(data.numMines);
      setBoard(data.board);
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      setGameState("playing");
      setRematchRequested(false);
      setGameOutcome("");
      setOutcomeReason("");
      toast.success("Opponent found! Match started!");
    };

    const onBoardUpdated = (data) => {
      setBoard(data.board);
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      if (data.lastMove) {
        toast(`${data.lastMove.player} found a diamond! 💎`, {
          duration: 1500,
        });
      }
    };

    const onGameOver = (data) => {
      setBoard(data.board);
      setPlayers(data.players);
      setGameState("finished");

      const myId = socket.id;
      if (data.winnerId === myId) {
        setGameOutcome("You Win!");
      } else if (data.winner === "Tie") {
        setGameOutcome("It's a Tie!");
      } else {
        setGameOutcome("Game Over!");
      }
      setOutcomeReason(data.reason || "");
    };

    const onRematchRequested = ({ requestedBy }) => {
      toast(`${requestedBy} requested a rematch! Click Rematch to accept.`);
    };

    const onRematchStarted = (data) => {
      setBoard(data.board);
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      setGameState("playing");
      setRematchRequested(false);
      setGameOutcome("");
      setOutcomeReason("");
      toast.success("Rematch started!");
    };

    const onOpponentLeft = ({ message }) => {
      toast.error(message || "Opponent disconnected.");
      setGameState("finished");
      setGameOutcome("Player Left");
      setOutcomeReason(message || "Opponent left the match.");
    };

    const onErrorMsg = (msg) => {
      toast.error(msg);
    };

    socket.on("online_count", onOnlineCount);
    socket.on("searching_match", onSearchingMatch);
    socket.on("match_cancelled", onMatchCancelled);
    socket.on("match_found", onMatchFound);
    socket.on("board_updated", onBoardUpdated);
    socket.on("game_over", onGameOver);
    socket.on("rematch_requested", onRematchRequested);
    socket.on("rematch_started", onRematchStarted);
    socket.on("opponent_left", onOpponentLeft);
    socket.on("error_msg", onErrorMsg);

    return () => {
      socket.off("online_count", onOnlineCount);
      socket.off("searching_match", onSearchingMatch);
      socket.off("match_cancelled", onMatchCancelled);
      socket.off("match_found", onMatchFound);
      socket.off("board_updated", onBoardUpdated);
      socket.off("game_over", onGameOver);
      socket.off("rematch_requested", onRematchRequested);
      socket.off("rematch_started", onRematchStarted);
      socket.off("opponent_left", onOpponentLeft);
      socket.off("error_msg", onErrorMsg);
    };
  }, []);

  const saveName = (name) => {
    setPlayerName(name);
    localStorage.setItem("mines_player_name", name);
  };

  const handleFindMatch = (e) => {
    if (e) e.preventDefault();
    if (!playerName.trim()) {
      return toast.error("Please enter your nickname first!");
    }
    socket.emit("find_match", { playerName: playerName.trim(), numMines });
    setGameState("searching");
  };

  const handleCancelSearch = () => {
    socket.emit("cancel_match");
    setGameState("lobby");
  };

  const handleTileClick = (index) => {
    if (gameState !== "playing") return;
    if (currentTurn !== socket.id) {
      return toast.error("Wait for your turn!");
    }
    if (board[index] !== "X") return;

    socket.emit("make_move", { matchId, tileIndex: index });
  };

  const handleRequestRematch = () => {
    setRematchRequested(true);
    socket.emit("request_rematch", { matchId });
  };

  const handleLeaveMatch = () => {
    socket.emit("leave_match");
    setGameState("lobby");
    setMatchId("");
    setPlayers([]);
    setBoard(Array(25).fill("X"));
    setGameOutcome("");
    setOutcomeReason("");
    setRematchRequested(false);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const myPlayer = players.find((p) => p.id === socket.id);
  const opponent = players.find((p) => p.id !== socket.id);
  const isMyTurn = currentTurn === socket.id;

  return (
    <div className="mp-container">
      <div className="mp-header-nav">
        <Link to="/" className="mp-back-link">
          Solo Mode
        </Link>
        <div className="mp-online-pill">
          <span>{onlineCount} {onlineCount === 1 ? "Player" : "Players"} Online</span>
        </div>
      </div>

      <h1 className="mine-title">Mines 1v1 Battle</h1>

      {gameState === "lobby" && (
        <div className="mp-lobby-card">
          <div className="mp-input-group">
            <label className="mp-label">Your Nickname</label>
            <input
              type="text"
              placeholder="e.g. Sravan"
              className="name-box mp-full-input"
              value={playerName}
              onChange={(e) => saveName(e.target.value)}
              maxLength={15}
            />
          </div>

          <div className="mp-slider-group">
            <div className="mp-slider-header">
              <span>Mine Count</span>
              <strong className="mp-mine-val">{numMines} Mines</strong>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={numMines}
              onChange={(e) => setNumMines(parseInt(e.target.value))}
              id="mineSlider"
            />
          </div>

          <button className="mp-btn mp-btn-find" onClick={handleFindMatch}>
            Find Random Match
          </button>
        </div>
      )}

      {gameState === "searching" && (
        <div className="mp-waiting-card">
          <div className="mp-radar-wrap">
            <div className="mp-radar-pulse"></div>
            <div className="mp-radar-pulse mp-radar-pulse-2"></div>
            <div className="mp-radar-center"></div>
          </div>

          <h2>Searching for an Opponent...</h2>
          <p className="mp-timer-display">{formatTimer(searchTimer)}</p>
          <p className="mp-subtext">
            Pairing you with another player looking for a match...
          </p>

          <button className="mp-btn mp-btn-outline" onClick={handleCancelSearch}>
            Cancel
          </button>
        </div>
      )}

      {(gameState === "playing" || gameState === "finished") && (
        <div className="mp-game-view">
          <div className="mp-scoreboard">
            <div
              className={`mp-player-card ${
                currentTurn === myPlayer?.id ? "turn-active" : ""
              }`}
            >
              <div className="mp-player-info">
                <span className="mp-player-name">
                  {myPlayer?.name || "You"} (You)
                </span>
                <span className="mp-player-score">
                  Gems: <strong>{myPlayer?.score || 0}</strong>
                </span>
              </div>
            </div>

            <div className="mp-vs-badge">VS</div>

            <div
              className={`mp-player-card ${
                currentTurn === opponent?.id ? "turn-active" : ""
              }`}
            >
              <div className="mp-player-info">
                <span className="mp-player-name">
                  {opponent?.name || "Opponent"}
                </span>
                <span className="mp-player-score">
                  Gems: <strong>{opponent?.score || 0}</strong>
                </span>
              </div>
            </div>
          </div>

          {gameState === "playing" && (
            <div
              className={`mp-turn-banner ${
                isMyTurn ? "my-turn" : "opponent-turn"
              }`}
            >
              {isMyTurn ? (
                <span><strong>Your Turn!</strong> Pick a hidden tile.</span>
              ) : (
                <span>Waiting for <strong>{opponent?.name || "opponent"}</strong> to move...</span>
              )}
            </div>
          )}

          <div className="mine-grid mp-grid">
            {board.map((value, i) => {
              const isRevealed = value !== "X";
              const isBomb = value === "💣";
              const canClick =
                gameState === "playing" && isMyTurn && !isRevealed;

              return (
                <button
                  key={i}
                  className={`mine-button mp-button ${
                    isRevealed ? "revealed" : ""
                  } ${isBomb ? "bomb-hit" : ""}`}
                  onClick={() => handleTileClick(i)}
                  disabled={!canClick}
                  style={isBomb ? { backgroundColor: "#ff6b6b" } : {}}
                >
                  {value}
                </button>
              );
            })}
          </div>

          <div className="mp-match-meta">
            <span>Mines hidden: <strong>{numMines}</strong></span>
            <button className="mp-leave-btn" onClick={handleLeaveMatch}>
              Leave Match
            </button>
          </div>

          {gameState === "finished" && (
            <div className="popup mp-popup">
              <h2>{gameOutcome}</h2>
              <p className="mp-outcome-reason">{outcomeReason}</p>

              <div className="mp-final-scores">
                <p>
                  <strong>{myPlayer?.name} (You):</strong> {myPlayer?.score} 💎
                </p>
                <p>
                  <strong>{opponent?.name || "Opponent"}:</strong>{" "}
                  {opponent?.score} 💎
                </p>
              </div>

              <div className="mp-popup-actions">
                <button
                  className="play-again-button"
                  onClick={handleRequestRematch}
                  disabled={rematchRequested}
                >
                  {rematchRequested ? "Waiting for Opponent..." : "Request Rematch"}
                </button>
                <button
                  className="mp-btn mp-btn-find"
                  onClick={handleFindMatch}
                >
                  Find New Opponent
                </button>
                <button
                  className="mp-btn mp-btn-outline"
                  onClick={handleLeaveMatch}
                >
                  Back to Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="footer">
        <p>
         Made with ❤️ by{" "}
          <a
            href="https://github.com/sra0ne"
            target="_blank"
            rel="noopener noreferrer"
          >
            sravan
          </a>
        </p>
      </footer>
    </div>
  );
}

export default Multiplayer;
