import crypto from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex"); // Generate a random salt
  const hashed = crypto.scryptSync(password, salt, 64).toString("hex"); // Hash password with salt
  return `${hashed}.${salt}`; // Return hashed password in "hashed.salt" format
}

console.log("Hashed Admin Password:", hashPassword("admin_password"));
