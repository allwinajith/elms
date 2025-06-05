import bcrypt from "bcryptjs";
import {
  getAdmin,
  postAdmin,
  findAdminByUsername,
  getCredentials,
  updatePassword,
} from "../model/adminModel.js";

export const fetchAdmins = async (req, res) => {
  try {
    const admins = await getAdmin();
    res.status(200).json(admins);
  } catch (error) {
    console.error("Error Fetching Admin : ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existing = await findAdminByUsername(username);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const adminId = await postAdmin(username, password_hash, salt);
    res.status(201).json({ message: "Admin created", adminId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changeAdminPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "All fields are required" });
  const userId = req.body.id;

  try {
    // 1. Verify current password (Model)
    const user = await getCredentials(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ error: "Current password is incorrect" });

    // 2. Hash new password (Conroller)
    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    // 3. Update password (Model)
    const affectedRows = await updatePassword(userId, newHash, salt);
    if (affectedRows === 0) throw new Error("Update failed");

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Password change failed" });
  }
};
