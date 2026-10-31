import MinesComponent from "./Mines.jsx";
import Leaderboard from "./Leaderboard.jsx";
import Multiplayer from "./Multiplayer.jsx";
import { Route, Routes } from "react-router";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<MinesComponent />} />
        <Route path="/multiplayer" element={<Multiplayer />} />
        <Route path="/leaderboard/:id" element={<Leaderboard />} />
      </Routes>
    </div>
  );
}

export default App;
