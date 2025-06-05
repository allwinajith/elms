import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import adminRoutes from "./route/adminRoute.js";
import leaveRoute from "./route/leaveRoute.js";

const port = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/leave", leaveRoute);

app.use("", (req, res) => {
  res.send("Route not found. Please check the URL and try again.");
});

app.listen(port, () => console.log("Server is running on the port ", port));
