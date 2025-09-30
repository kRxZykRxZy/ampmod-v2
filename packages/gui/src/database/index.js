const db = require("./schema").default;

async function checkDatabase() {
  try {
    await db.query("SELECT 1");
    return true;
    } catch (err) {
      return false;
    }
 }

module.exports = { db, checkDatabase };
