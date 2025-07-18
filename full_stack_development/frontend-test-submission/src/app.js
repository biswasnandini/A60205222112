import React, { useState } from "react";
import { Box, Button, TextField, Typography, Card, CardContent } from "@mui/material";
import { Log } from "./logger/logger";

const BACKEND_URL = "http://localhost:3001"; // or where your backend runs

function App() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [shortcode, setShortcode] = useState("");
  const [validity, setValidity] = useState("");
  const [stats, setStats] = useState(null);
  const [fetchCode, setFetchCode] = useState("");
  const [error, setError] = useState("");

  // Submit new short URL
  const handleShorten = async () => {
    setError("");
    if (!/^https?:\/\//.test(url)) {
      setError("URL must start with http:// or https://");
      await Log("frontend", "warn", "component", "User submitted invalid URL");
      return;
    }
    try {
      await Log("frontend", "info", "component", "Shorten URL form submitted");
      const response = await fetch(`${BACKEND_URL}/shorturls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          shortcode: shortcode || undefined,
          validity: validity || undefined
        })
      });
      const data = await response.json();
      if (response.ok) {
        setShortUrl(`${window.location.origin}/s/${data.shortUrl}`);
        await Log("frontend", "info", "component", `Shortened URL: ${data.shortUrl}`);
      } else {
        setError(data.error || "Backend error");
        await Log("frontend", "error", "handler", `Shorten error: ${data.error}`);
      }
    } catch (err) {
      setError("Network error");
      await Log("frontend", "error", "handler", `Exception: ${err.message}`);
    }
  };

  // Fetch stats
  const handleStatsFetch = async () => {
    setError("");
    setStats(null);
    if (!fetchCode) {
      setError("Enter a shortcode");
      await Log("frontend", "warn", "component", "Stats fetch: no shortcode");
      return;
    }
    try {
      await Log("frontend", "info", "component", `Stats fetch for ${fetchCode}`);
      const res = await fetch(`${BACKEND_URL}/shorturls/${fetchCode}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        await Log("frontend", "info", "component", `Stats data fetched for ${fetchCode}`);
      } else {
        setError(data.error || "Not found");
        await Log("frontend", "warn", "handler", `Stats fetch error: ${data.error}`);
      }
    } catch (e) {
      setError("Network error");
      await Log("frontend", "error", "handler", `Exception: ${e.message}`);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 600, m: "auto" }}>
      <Typography variant="h4" gutterBottom>
        URL Shortener
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            label="Paste URL"
            fullWidth
            value={url}
            onChange={e => setUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Custom Shortcode (optional)"
            fullWidth
            value={shortcode}
            onChange={e => setShortcode(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Validity (Expiration, optional, yyyy-mm-dd)"
            fullWidth
            value={validity}
            onChange={e => setValidity(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleShorten}>Shorten</Button>
          {shortUrl && (
            <Typography sx={{ mt: 2 }}>Short URL: <b>{shortUrl}</b></Typography>
          )}
        </CardContent>
      </Card>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">URL Statistics</Typography>
          <TextField
            label="Shortcode"
            fullWidth
            value={fetchCode}
            onChange={e => setFetchCode(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" onClick={handleStatsFetch}>Fetch Stats</Button>
          {stats && (
            <Box sx={{ mt: 2 }}>
              <b>Original URL:</b> {stats.originalUrl}<br/>
              <b>Created At:</b> {stats.createdAt && new Date(stats.createdAt).toLocaleString()}<br/>
              {stats.expiresAt && (<><b>Expires At:</b> {new Date(stats.expiresAt).toLocaleString()}<br/></>)}
              <b>Visits:</b> {stats.stats?.visits}
            </Box>
          )}
        </CardContent>
      </Card>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
}

export default App;
