// React Frontend Code
import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/reviews`, {
        params: { page: url },
      });
      setReviews(response.data.reviews);
    } catch (err) {
      setError("Failed to fetch reviews. Please check the URL or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Product Reviews Extractor</h1>
        <input
          type="text"
          placeholder="Enter product page URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={fetchReviews} disabled={loading || !url}>
          {loading ? "Fetching..." : "Fetch Reviews"}
        </button>
        {error && <p className="error">{error}</p>}
        <div className="reviews-container">
          {reviews.length > 0 && (
            <div>
              <h2>Extracted Reviews</h2>
              <ul>
                {reviews.map((review, index) => (
                  <li key={index} className="review-item">
                    <h3>{review.title}</h3>
                    <p><strong>Reviewer:</strong> {review.reviewer}</p>
                    <p><strong>Rating:</strong> {review.rating} ⭐</p>
                    <p>{review.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
