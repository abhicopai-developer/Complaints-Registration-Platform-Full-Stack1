import { sendOTPEmail } from "./services/email.js";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";

async function test() {
  try {
    console.log("Testing email...");
    await sendOTPEmail("devvpatel2015@gmail.com", "123456");
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Email failed:", err.message);
  }

  try {
    console.log("Testing DB connection...");
    const res = await db.select().from(users).limit(1);
    console.log("DB successful, found", res.length, "users");
  } catch (err) {
    console.error("DB failed:", err);
  }
}

test();
