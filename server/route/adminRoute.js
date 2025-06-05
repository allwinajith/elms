import express from "express";
import {
  fetchAdmins,
  addAdmin,
  changeAdminPassword,
} from "../controller/adminController.js";

const adminRoutes = express.Router();

adminRoutes.get("/", fetchAdmins);
adminRoutes.post("/", addAdmin);
adminRoutes.put("/changePassword/", changeAdminPassword);

export default adminRoutes;
