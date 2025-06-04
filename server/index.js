import express from "express";
import cors from "cors";
const port = 3000;

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("This is a testing route");
});

app.use("", (req, res) => {
  res.send("Route not found. Please check the URL and try again.");
});

app.listen(port, () => console.log("Server is running on the port ", port));
