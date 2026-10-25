const pool = require("./src/db/postgres");

async function main() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database"
    );
    console.log("PostgreSQL connected successfully!");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

main();
