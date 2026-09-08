import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router";
import toast from "react-hot-toast";
import "./Leaderboard.css";

function Leaderboard() {
  const { id } = useParams();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/scores/${id}`);
        setScores(res.data);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
        toast.error("Failed to load scores");
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [id]);

  if (loading) {
    return <p className="no-scores">Loading leaderboard...</p>;
  }

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard – Level {id}</h1>

      {scores.length === 0 ? (
        <p className="no-scores">No scores yet for this level.</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={s._id}>
                <td>{i + 1}</td>
                <td>{s.name}</td>
                <td>{s.time}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Link to={"/"}>
        <button className="back-button">Back to Game</button>
      </Link>
    </div>
  );
}

export default Leaderboard;
