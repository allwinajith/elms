import express from "express";
import {
  createLeave,
  deleteLeave,
  deleteLeaveRequest,
  fetchLeaves,
  getAllLeavesForAdmin,
  getEmployeeLeaves,
  getLeaveBalances,
  getLeaveReports,
  handleLeaveApprovalOrRejection,
  initLeaveBalances,
  submitLeaveRequest,
  updateLeave,
} from "../controller/leaveController.js";

const leaveRoute = express.Router();

leaveRoute.get("/", fetchLeaves);
leaveRoute.post("/", createLeave);
leaveRoute.put("/:id", updateLeave);
leaveRoute.delete("/:id", deleteLeave);

leaveRoute.post("/employee/leaves", submitLeaveRequest);
leaveRoute.get("/employee/leaves/", getEmployeeLeaves);
leaveRoute.delete("/pendingrqst/:id", deleteLeaveRequest);
leaveRoute.get("/admin/leaves", getAllLeavesForAdmin);
leaveRoute.put("/admin/leaves/:id", handleLeaveApprovalOrRejection);
leaveRoute.get("/employee/balances/:id", getLeaveBalances);
leaveRoute.post("/admin/balances/init", initLeaveBalances);
leaveRoute.get("/admin/reports/leaves", getLeaveReports);

export default leaveRoute;
