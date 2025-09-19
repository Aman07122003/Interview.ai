import dotenv from "dotenv";
import db from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

db()

  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("⚙️  Server is running on Port :", process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("MONGODB CONNECTION FAILED!!! ", err);
  });