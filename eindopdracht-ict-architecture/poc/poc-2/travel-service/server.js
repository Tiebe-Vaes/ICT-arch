const express = require("express");
const redis = require("redis");

const app = express();

const client = redis.createClient({
  url: "redis://redis:6379",
});

client.connect();

app.get("/trip/:id", async (req, res) => {
  const id = req.params.id;

  const cached = await client.get(id);

  if (cached) {
    console.log("Cache hit");

    return res.json(JSON.parse(cached));
  }

  console.log("Cache miss");

  const response = await fetch(`http://mock-api:3000/trip/${id}`);

  const data = await response.json();

  await client.set(id, JSON.stringify(data), {
    EX: 60,
  });

  res.json(data);
});

app.listen(8080);
