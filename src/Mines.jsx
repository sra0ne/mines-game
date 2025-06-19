import React, { useState, useEffect } from 'react';
import './Mines.css';

function bombGenerator(count) {
  const bombIndices = new Set();
  while (bombIndices.size < count) {
    bombIndices.add(Math.floor(Math.random() * 25));
  }
  return Array.from(bombIndices);
}

function MinesComponent() {
  const [score, setScore] = useState(0);
  const [buttons, setButtons] = useState(Array(25).fill("X"));
  const [disabled, setDisabled] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [bombs, setBombs] = useState(bombGenerator(1));
  const [numMines, setNumMines] = useState(1);
  const [gameOutcome, setGameOutcome] = useState("");



  function handleClick(i) {
    if (buttons[i] !== "X" || disabled) return;

    const newButtons = [...buttons];
    if (bombs.includes(i)) {
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
    if (score === 25 - numMines) {
      setDisabled(true);
      setGameOver(true);
      setGameOutcome("You Win!");
    }
  }, [score, numMines]);

  useEffect(() => {
    if (gameOver) {
      const updatedButtons = [...buttons];
      for (let i = 0; i < updatedButtons.length; i++) {
        if (bombs.includes(i)) {
          updatedButtons[i] = "💣";
        } else if (updatedButtons[i] === "X") {
          updatedButtons[i] = "💎";
        }
      }
      setButtons(updatedButtons);
    }
  }, [gameOver, bombs]);

  /* useEffect(() => {
    console.log(bombs.join(", "));

  }, [bombs]); //debug
  */
  
  function resetGame(newMineCount = numMines) {
    setButtons(Array(25).fill("X"));
    setScore(0);
    setDisabled(false);
    setGameOver(false);
    setBombs(bombGenerator(newMineCount));
    setGameOutcome("");
  }

  function changeMineNo(e) {
    const newCount = parseInt(e.target.value);
    setNumMines(newCount);
    setBombs(bombGenerator(newCount));
    resetGame(newCount);
  }

  return (
    <div className="mine-container">
      <h1 className="mine-title">Mines</h1>
      <label htmlFor="mineSlider">Mines: {numMines}</label>
      <input
        type="range"
        min="1"
        max="24"
        className="mine-number"
        id="mineSlider"
        value={numMines}
        onChange={changeMineNo}
      />

      <div className="mine-grid">
        {buttons.map((value, i) => (
          <button
            key={i}
            className="mine-button"
            onClick={() => handleClick(i)}
            disabled={disabled || value !== "X"}
            style={value === "💣" ? { backgroundColor: "#ff6b6b" } : {}}
          >
            {value}
          </button>
        ))}
      </div>

      <p id="scoreCard">Score: {score}</p>

      {gameOver && (
        <div className="popup">
          <h2>{gameOutcome}</h2>
          <p>Your score is {score}</p>
          <button onClick={() => resetGame(numMines)}>Play Again</button>
        </div>
      )}

      <footer className="footer">
        <p>
          Made with ❤️ by <a href="https://github.com/sra0ne" target="_blank" rel="noopener noreferrer">sravan</a>
        </p>
      </footer>
    </div>
  );
}

export default MinesComponent;
