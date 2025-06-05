import {
  createLeaveModel,
  deleteLeaveModel,
  getAllLeavesModel,
  getLeaveByIdModel,
  getLeaveTypeById,
  leaveIsUnique,
  updateLeaveModel,
  getUsedLeaveDays,
  getLeaveTypeMaxDays,
  checkOverlappingLeaves,
  insertLeaveRequest,
  getLeavesByEmployee,
  getLeaveById,
  deleteLeaveById,
  getAllLeaveRequests,
  getLeaveDetailsById,
  getOrCreateEmployeeLeaveBalance,
  updateLeaveStatus,
  updateUsedLeaveDays,
  initializeYearlyLeaveBalances,
  fetchLeaveReports,
  fetchEmployeeLeaveBalances,
  isValidEmployeeId,
} from "../model/leaveModel.js";

export const fetchLeaves = async (req, res) => {
  try {
    const data = await getAllLeavesModel();
    res.status(200).json({
      success: true,
      message: "Leave types fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get leave type by ID
export const fetchLeaveById = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getLeaveByIdModel(id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave type fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching leave by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createLeave = async (req, res) => {
  const { name, description = "" } = req.body;
  try {
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name field should not be empty",
      });
    }
    const checkIsUnique = await leaveIsUnique(name);
    if (checkIsUnique) {
      return res.status(409).json({
        message: "Name already exists, So please try with some other name",
      });
    }
    const data = await createLeaveModel(name, description);
    return res.status(200).json({
      success: true,
      message: "Data inserted successfully",
      id: data,
    });
  } catch (error) {
    console.error("Leave creation error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const updateLeave = async (req, res) => {
  const { id } = req.params;
  const { name, description = "", max_days } = req.body;

  try {
    const existing = await getLeaveTypeById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    const updated = await updateLeaveModel(id, name, description, max_days);
    if (updated === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes made to the leave type",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave type updated successfully",
    });
  } catch (error) {
    console.error("Update leave error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete leave type
export const deleteLeave = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await getLeaveTypeById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    await deleteLeaveModel(id);
    return res.status(200).json({
      success: true,
      message: "Leave type deleted successfully",
    });
  } catch (error) {
    console.error("Delete leave error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//Creating leave request
export const submitLeaveRequest = async (req, res) => {
  const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;
  const year = new Date(start_date).getFullYear();

  if (!employee_id || !leave_type_id || !start_date || !end_date || !reason) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const start = new Date(start_date);
    const end = new Date(end_date);
    const daysRequested = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (daysRequested <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range",
      });
    }

    const balanceRow = await getUsedLeaveDays(employee_id, leave_type_id, year);
    const usedDays = balanceRow ? balanceRow.used_days : 0;

    const leaveType = await getLeaveTypeMaxDays(leave_type_id);
    const maxDays = leaveType ? leaveType.max_days : 0;

    if (usedDays + daysRequested > maxDays) {
      return res.status(400).json({
        success: false,
        message: `Leave request exceeds remaining balance. Available: ${
          maxDays - usedDays
        } days.`,
      });
    }

    const isOverlapping = await checkOverlappingLeaves(
      employee_id,
      start_date,
      end_date
    );
    if (isOverlapping) {
      return res.status(409).json({
        success: false,
        message:
          "Leave request overlaps with existing approved/pending request",
      });
    }

    const requestId = await insertLeaveRequest(
      employee_id,
      leave_type_id,
      start_date,
      end_date,
      reason
    );

    return res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: { requestId },
    });
  } catch (err) {
    console.error("Error while submitting leave request:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Get Leaves of particular employees
export const getEmployeeLeaves = async (req, res) => {
  try {
    const employee_id = req.user.id;
    const { status } = req.query;

    if (!employee_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const leaves = await getLeavesByEmployee(employee_id, status);

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (err) {
    console.error("Error fetching employee leaves:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaves",
    });
  }
};

//Delete Pending Leave Request
export const deleteLeaveRequest = async (req, res) => {
  const leaveId = req.params.id;
  const employeeId = req.body.employee_id;
  console.log("Body ", req.body);

  try {
    const leave = await getLeaveById(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leave.employee_id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this leave request",
      });
    }

    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leave requests can be cancelled",
      });
    }

    const rowsDeleted = await deleteLeaveById(leaveId);

    if (rowsDeleted === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete leave request",
      });
    }

    res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
    });
  } catch (err) {
    console.error("Error deleting leave request:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllLeavesForAdmin = async (req, res) => {
  const { status } = req.query; // Optional: ?status=pending

  try {
    const validStatuses = ["pending", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter. Use pending, approved, or rejected.",
      });
    }

    const leaves = await getAllLeaveRequests(status);

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (err) {
    console.error("Error fetching admin leave data:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//Handle leave Approval
export const handleLeaveApprovalOrRejection = async (req, res) => {
  debugger;
  const { id } = req.params;
  const { status, adminRemarks } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res
      .status(400)
      .json({ message: "Status must be 'approved' or 'rejected'" });
  }

  try {
    const leave = await getLeaveDetailsById(id);

    if (!leave) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be updated" });
    }

    if (status === "approved") {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const year = new Date().getFullYear();
      const balance = await getOrCreateEmployeeLeaveBalance(
        leave.employee_id,
        leave.leave_type_id,
        year
      );

      if (balance.used_days + days > leave.max_days) {
        return res.status(400).json({
          message: "Leave exceeds allowed quota",
        });
      }

      console.log("Updating leave balance for:", {
        employeeId: leave.employee_id,
        leaveTypeId: leave.leave_type_id,
        year,
        days,
      });

      await updateUsedLeaveDays(
        leave.employee_id,
        leave.leave_type_id,
        year,
        days
      );
    }

    await updateLeaveStatus({ id, status, adminRemarks });

    return res.status(200).json({
      message: `Leave has been ${status}`,
      success: true,
    });
  } catch (err) {
    console.error("Leave approval/rejection error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getLeaveBalances = async (req, res) => {
  const employeeId = req.params.id;
  const year = new Date().getFullYear();

  try {
    const data = await isValidEmployeeId(employeeId);
    console.log(data);
    const balances = await fetchEmployeeLeaveBalances(employeeId, year);
    return res.status(200).json({ balances });
  } catch (err) {
    console.error("Balance Fetch Error:", err);
    return res.status(500).json({ message: "Failed to fetch balances" });
  }
};

export const initLeaveBalances = async (req, res) => {
  const year = new Date().getFullYear();

  try {
    await initializeYearlyLeaveBalances(year);
    return res
      .status(200)
      .json({ message: `Balances initialized for year ${year}` });
  } catch (err) {
    console.error("Init Balances Error:", err);
    return res.status(500).json({ message: "Initialization failed" });
  }
};

export const getLeaveReports = async (req, res) => {
  try {
    const report = await fetchLeaveReports(req.query);
    return res.status(200).json({ report });
  } catch (err) {
    console.error("Report Fetch Error:", err);
    return res.status(500).json({ message: "Error fetching leave report" });
  }
};
