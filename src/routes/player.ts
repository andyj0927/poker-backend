import { Router } from "express";
import { connection } from "../connection.js";
import { players } from "../gameServer.js";

const playerRouter: Router = Router();

// get player information
playerRouter.get("/name/:name", (req, res) => {
  console.log(`${req.method} ${req.originalUrl}`);
  connection.query(
    `SELECT name, chip_count, best_win FROM players WHERE name = "${req.params.name}"`,
    (error, rows, fields) => {
      if (error) return res.status(500).send(error);
      if (rows.length === 1) res.send(rows);
      else res.status(404).send("NO");
    }
  );
});
// update player
playerRouter.post("/name/:name/chip/:chip", (req, res) => {
  console.log(`${req.method} ${req.originalUrl}`);
  connection.query(`UPDATE players SET chip_count = ${req.params.chip} WHERE name = "${req.params.name}";`);
  res.send("0");
});

// login
playerRouter.post("/login/name/:name/password/:password", (req, res) => {
  console.log(`${req.method} ${req.originalUrl}`);

  connection.query(
    `SELECT * FROM players WHERE name = "${req.params.name}" AND password = "${req.params.password}"`,
    (error, rows, fields) => {
      if (rows.length === 0) {
        res.status(404).send("Not Found");
      } else {
        connection.query(
          `SELECT name, chip_count FROM players WHERE name = "${req.params.name}"`,
          (error, rows, fields) => {
            if (error) res.status(500).send(error);
            else res.send(rows);
          }
        );
      }
    }
  );
});

// logout
playerRouter.post("/logout/name/:name", (req, res) => {
  console.log(`${req.method} ${req.originalUrl}`);
  players.filter((p) => p.name !== req.params.name);
  res.send("0");
});

// signup
playerRouter.post("/signup/name/:name/password/:password", (req, res) => {
  console.log(`${req.method} ${req.originalUrl}`);

  // First if there is a duplicate nickname
  connection.query(`SELECT id FROM players WHERE name = "${req.params.name}"`, (error, rows, fields) => {
    if (rows.length === 0) {
      // If it is a unique name, insert into database
      connection.query(
        `INSERT INTO players VALUE(NULL, "${req.params.name}", "${req.params.password}", 1000, 0);`,
        (error, rows) => {
          if (error) res.status(500).send(error);
          else res.send("0");
        }
      );
    } else {
      // The user provided name already exists in database.
      res.send("1");
    }
  });
});

// delete account
playerRouter.delete("/delete/name/:name", (req, res) => {
  console.log(`${req.method} ${req.originalUrl}`);
  connection.query(`DELETE FROM players WHERE email = "${req.params.name}"`, (error, result) => {
    if (error) res.status(500).send(error);
    else {
      if (result.affectedRows === 1) res.send("YES");
      else res.send("NO");
    }
  });
});

export default playerRouter;
