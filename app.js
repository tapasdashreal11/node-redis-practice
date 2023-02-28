import express from "express";
import axios from "axios";
import redis from "redis";
import responseTime from "response-time";

const app = express();
app.use(responseTime());

const redisClient = redis.createClient({
  host: "localhost",
  port: 6379,
});
//this is the default setting even if you do not pass anything

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

app.get("/rockets", async (req, res, next) => {
  try {
    const cachedData = await redisClient.get("rockets");
    if (cachedData) {
      console.log("using cached data");
      res.send(JSON.parse(cachedData));
      return;
    }
    const response = await axios.get("https://api.spacexdata.com/v4/rockets");
    const saveResult = await redisClient.set(
      "rockets",
      JSON.stringify(response.data),
      { EX: 5 }
    );
    console.log("new data cached", saveResult);
    res.send(response.data);
  } catch (error) {
    res.send(error.message);
  }
});

app.get("/rockets/:rocket_id", async (req, res, next) => {
  try {
    const { rocket_id } = req.params;
    const cachedData = await redisClient.get(rocket_id);
    if (cachedData) {
      console.log("using cached data");
      res.send(JSON.parse(cachedData));
      return;
    }
    const response = await axios.get(
      `https://api.spacexdata.com/v3/rockets/${rocket_id}`
    );
    const saveResult = await redisClient.set(
      rocket_id,
      JSON.stringify(response.data),
      { EX: 5 }
    );
    console.log("new data cached", saveResult);
    res.send(response.data);
  } catch (error) {
    res.send(error.message);
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
