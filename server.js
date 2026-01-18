require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const BOT_TOKEN = process.env.BOT_TOKEN;
const DB = "./db.json";

app.post("/webhook", (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.video) return res.sendStatus(200);

  const data = JSON.parse(fs.readFileSync(DB));
  data.videos.unshift({
    file_id: msg.video.file_id,
    title: msg.caption || "Telegram Video"
  });
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));

  res.sendStatus(200);
});

app.get("/api/videos", async (req, res) => {
  const data = JSON.parse(fs.readFileSync(DB));

  const videos = await Promise.all(
    data.videos.map(async v => {
      const r = await axios.get(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${v.file_id}`
      );
      return {
        title: v.title,
        url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${r.data.result.file_path}`
      };
    })
  );

  res.json(videos);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
