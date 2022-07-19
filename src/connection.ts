import { createConnection } from "mysql";
import "dotenv/config";

export const connection = createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "week3",
});
