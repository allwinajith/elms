import db from "../config/db.js";

// Get all leave types
export const getAllLeavesModel = async () => {
  const [data] = await db.query(`SELECT * FROM leave_types`);
  return data;
};

// Get leave type by ID
export const getLeaveByIdModel = async (id) => {
  const [data] = await db.query(`SELECT * FROM leave_types WHERE id = ?`, [id]);
  return data[0];
};

// Create type of Leaves
export const createLeaveModel = async (name, desc) => {
  const [data] = await db.query(
    `INSERT into leave_types (name, description) values (?, ?)`,
    [name, desc]
  );
  return data.insertId;
};

//Check the leave name exists or not
export const leaveIsUnique = async (name) => {
  const [data] = await db.query(`SELECT * from leave_types where name = ?`, [
    name,
  ]);
  return data[0];
};

// Update a leave by ID
export const updateLeaveModel = async (id, name, description, max_days) => {
  const [data] = await db.query(
    `UPDATE leave_types SET name = ?, description = ?, max_days = ? WHERE id = ?`,
    [name, description, max_days, id]
  );
  return data.affectedRows;
};

// Delete a leave by ID
export const deleteLeaveModel = async (id) => {
  const [data] = await db.query(`DELETE FROM leave_types WHERE id = ?`, [id]);
  return data.affectedRows;
};

//Check if leave type exists by ID
export const getLeaveTypeById = async (id) => {
  const [data] = await db.query(`SELECT * FROM leave_types WHERE id = ?`, [id]);
  return data[0];
};

export const getUsedLeaveDays = async (employee_id, leave_type_id, year) => {
  const [rows] = await db.query(
    `SELECT used_days FROM employee_leave_balances WHERE employee_id = ? AND leave_type_id = ? AND year = ?`,
    [employee_id, leave_type_id, year]
  );
  return rows[0] || null;
};

// Get max allowed leave days for the leave type
export const getLeaveTypeMaxDays = async (leave_type_id) => {
  const [rows] = await db.query(
    `SELECT max_days FROM leave_types WHERE id = ?`,
    [leave_type_id]
  );
  return rows[0] || null;
};

// Check if dates are overlapping with other leaves
export const checkOverlappingLeaves = async (
  employee_id,
  start_date,
  end_date
) => {
  const [rows] = await db.query(
    `SELECT id FROM leaves 
         WHERE employee_id = ? 
         AND status IN ('pending', 'approved') 
         AND (start_date <= ? AND end_date >= ?)`,
    [employee_id, end_date, start_date]
  );
  return rows.length > 0;
};

// Insert leave request
export const insertLeaveRequest = async (
  employee_id,
  leave_type_id,
  start_date,
  end_date,
  reason
) => {
  const [result] = await db.query(
    `INSERT INTO leaves (employee_id, leave_type_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)`,
    [employee_id, leave_type_id, start_date, end_date, reason]
  );
  return result.insertId;
};

//GET Leaves By particular emp
export const getLeavesByEmployee = async (employee_id, status) => {
  let query = `
    SELECT 
      l.id, 
      lt.name AS leave_type, 
      l.start_date, 
      l.end_date, 
      l.reason, 
      l.status, 
      l.admin_remarks,
      l.created_at
    FROM leaves l
    JOIN leave_types lt ON l.leave_type_id = lt.id
    WHERE l.employee_id = ?
  `;

  const params = [employee_id];

  if (status) {
    query += " AND l.status = ?";
    params.push(status);
  }

  const [rows] = await db.query(query, params);
  return rows;
};

//Delete Leave request if the status is pending
export const getLeaveById = async (leaveId) => {
  const [data] = await db.query(
    `SELECT id, status, employee_id FROM leaves WHERE id = ?`,
    [leaveId]
  );
  console.log("data = ", data);
  return data[0];
};

// Delete the leave record
export const deleteLeaveById = async (leaveId) => {
  const [result] = await db.query(`DELETE FROM leaves WHERE id = ?`, [leaveId]);
  return result.affectedRows;
};

// Get all leave requests with optional status filter
export const getAllLeaveRequests = async (status) => {
  let query = `
    SELECT 
      l.id,
      l.start_date,
      l.end_date,
      l.reason,
      l.status,
      l.admin_remarks,
      l.created_at,
      e.emp_id as employee_id,
      e.first_name as employee_name,
      lt.name as leave_type
    FROM leaves l
    JOIN employees e ON l.employee_id = e.emp_id
    JOIN leave_types lt ON l.leave_type_id = lt.id
  `;

  const values = [];

  if (status) {
    query += ` WHERE l.status = ?`;
    values.push(status);
  }

  query += ` ORDER BY l.created_at DESC`;

  const [data] = await db.query(query, values);
  return data;
};

// Get leave by ID with necessary join info
export const getLeaveDetailsById = async (id) => {
  const [data] = await db.query(
    `
    SELECT l.*, lt.max_days
    FROM leaves l
    JOIN leave_types lt ON l.leave_type_id = lt.id
    WHERE l.id = ?
  `,
    [id]
  );
  return data[0];
};

// Get or create employee_leave_balance record for the current year
export const getOrCreateEmployeeLeaveBalance = async (
  employeeId,
  leaveTypeId,
  year
) => {
  const [existing] = await db.query(
    `
    SELECT * FROM employee_leave_balances 
    WHERE employee_id = ? AND leave_type_id = ? AND year = ?
  `,
    [employeeId, leaveTypeId, year]
  );

  if (existing.length === 0) {
    await db.query(
      `
    INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, used_days)
    VALUES (?, ?, ?, 0)
  `,
      [employeeId, leaveTypeId, year]
    );

    const [inserted] = await db.query(
      `
    SELECT * FROM employee_leave_balances 
    WHERE employee_id = ? AND leave_type_id = ? AND year = ?
  `,
      [employeeId, leaveTypeId, year]
    );

    return inserted[0];
  }

  return existing[0];
};

// Update the leave request
export const updateLeaveStatus = async ({ id, status, adminRemarks }) => {
  await db.query(
    `
    UPDATE leaves 
    SET status = ?, admin_remarks = ?, admin_updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `,
    [status, adminRemarks, id]
  );
};

// Update used leave days
export const updateUsedLeaveDays = async (
  employeeId,
  leaveTypeId,
  year,
  daysToAdd
) => {
  console.log("Top of updateUsedLeaveDays");
  await db.query(
    `
    UPDATE employee_leave_balances
    SET used_days = used_days + ?
    WHERE employee_id = ? AND leave_type_id = ? AND year = ?
  `,
    [daysToAdd, employeeId, leaveTypeId, year]
  );
  console.log("End of updateUsedLeaveDays");
};

export const isValidEmployeeId = async (id) => {
  const [data] = await db.query(`select * from employee where id = ?`, [id]);
  return data;
};

export const fetchEmployeeLeaveBalances = async (employeeId, year) => {
  const [rows] = await db.query(
    `
    SELECT lt.id AS leave_type_id, lt.name AS leave_type, lt.max_days,
           IFNULL(elb.used_days, 0) AS used_days,
           (lt.max_days - IFNULL(elb.used_days, 0)) AS remaining_days
    FROM leave_types lt
    LEFT JOIN employee_leave_balances elb
      ON elb.leave_type_id = lt.id AND elb.employee_id = ? AND elb.year = ?
  `,
    [employeeId, year]
  );
  return rows;
};

export const initializeYearlyLeaveBalances = async (year) => {
  const [employees] = await db.query(`SELECT id FROM employees`);
  const [leaveTypes] = await db.query(`SELECT id FROM leave_types`);

  const values = [];
  for (const emp of employees) {
    for (const type of leaveTypes) {
      values.push([emp.id, type.id, year]);
    }
  }

  return db.query(
    `
    INSERT IGNORE INTO employee_leave_balances (employee_id, leave_type_id, year)
    VALUES ?
  `,
    [values]
  );
};

export const fetchLeaveReports = async ({
  employee_id,
  year,
  leave_type_id,
  status,
}) => {
  const conditions = [];
  const values = [];

  if (employee_id) {
    conditions.push("l.employee_id = ?");
    values.push(employee_id);
  }
  if (leave_type_id) {
    conditions.push("l.leave_type_id = ?");
    values.push(leave_type_id);
  }
  if (status) {
    conditions.push("l.status = ?");
    values.push(status);
  }
  if (year) {
    conditions.push("YEAR(l.start_date) = ?");
    values.push(year);
  }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  const [rows] = await db.query(
    `
    SELECT l.*, e.name AS employee_name, lt.name AS leave_type
    FROM leaves l
    JOIN employees e ON e.id = l.employee_id
    JOIN leave_types lt ON lt.id = l.leave_type_id
    ${whereClause}
    ORDER BY l.start_date DESC
  `,
    values
  );

  return rows;
};
