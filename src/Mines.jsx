import React, { useState } from 'react';
import './Mines.css';

const bomb = Math.floor(Math.random() * 25);

function MinesComponent() {
  const [score, setScore] = useState(0);
  const [buttons, setButtons] = useState(Array(25).fill("X"));
  const [disabled, setDisabled] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  function handleClick(i) {
    if (buttons[i] !== "X" || disabled) return;

    const newButtons = [...buttons];
    if (i === bomb) {
      newButtons[i] = "💣";
      setButtons(newButtons);
      setDisabled(true);
      setGameOver(true);
    } else {
      newButtons[i] = "💎";
      setButtons(newButtons);
      setScore(score + 1);
    }
  }

  function resetGame() {
    setButtons(Array(25).fill("X"));
    setScore(0);
    setDisabled(false);
    setGameOver(false);
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
            {(i + 1) % 5 === 0 && <br key={`br-${i}`} />}
          </React.Fragment>
        ))}
      </div>
      <p id="scoreCard">Score: {score}</p>
      {gameOver && (
        <div className="popup">
          <h2>Game Over</h2>
          <p>Your score is {score}</p>
          <button onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default MinesComponent;