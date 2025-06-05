import db from "../config/db.js";

// Fetching all the admins
export const getAdmin = async () => {
  const [data] = await db.query("select * from admin");
  console.log(data);
  return data;
};

//Finding the admin based on userName
export const findAdminByUsername = async (username) => {
  const [rows] = await db.query("SELECT * FROM admin WHERE username = ?", [
    username,
  ]);
  return rows;
};
  
//Adding the admin
export const postAdmin = async (username, password_hash, salt) => {
  const [result] = await db.query(
    "insert into admin (username, password_hash, salt) values (?, ?, ?)",
    [username, password_hash, salt]
  );
  return result.insertId;
};

export const getCredentials = async (id) => {
  const [result] = await db.query(
    "select password_hash from admin where id = ? ",
    [id]
  );
  console.log("result of getCredentials : ", result);
  return result[0];
};

export const updatePassword = async (id, newHash, newSalt) => {
  const result = await db.query(
    "update admin set password_hash = ?, salt = ? where id = ?",
    [newHash, newSalt, id]
  );
  console.log("result of updatePassword : ", result);
  return result.affectedRows;
};
  
