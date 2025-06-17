import React from 'react';
import { useState, useEffect } from 'react';
import './Mines.css';

function bombGenerator() {
  const b = Math.floor(Math.random() * 25);
  return b;
}


function MinesComponent() {
  const [score, setScore] = useState(0);
  const [buttons, setButtons] = useState(Array(25).fill("X"));
  const [disabled, setDisabled] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [bomb, setBomb] = useState(bombGenerator());
  const [gameOutcome, setGameOutcome] = useState("");
  //console.log("Bomb is at: ", bomb); debug

  function handleClick(i) {
    if (buttons[i] !== "X" || disabled) return;

    const newButtons = [...buttons];
    if (i === bomb) {
      newButtons[i] = "💣";
      setButtons(newButtons);
      setDisabled(true);
      setGameOver(true);
      setGameOutcome("Game Over!");
    } else {
      newButtons[i] = "💎";
      setButtons(newButtons);
      setScore(score + 1);
    }
  }
  useEffect(() => {
    if (score === 24) {
      setGameOver(true);
      setDisabled(true);
      setGameOutcome("You Win!");
    }
  }, [score]);

  function resetGame() {
    setButtons(Array(25).fill("X"));
    setScore(0);
    setDisabled(false);
    setGameOver(false);
    setBomb(bombGenerator());
    setGameOutcome("");
  }

  return (

    <div className="mine-container">
      <h1 className="mine-title">Mines</h1>
      <div className="mine-grid">
        {Array.from({ length: 25 }, (_, i) => (
          <React.Fragment key={i}>
            <button
              className="mine-button"
              onClick={() => handleClick(i)}
              disabled={disabled || buttons[i] !== "X"}
              style={buttons[i] === "💣" ? { backgroundColor: "#ff6b6b" } : {}}
            >
              {buttons[i]}
            </button>

          </React.Fragment>
        ))}
      </div>
      <p id="scoreCard">Score: {score}</p>

      {gameOver && (
        <div className="popup">
          <h2>{gameOutcome}</h2>
          <p>Your score is {score}</p>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default MinesComponent;