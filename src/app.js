require("dotenv").config();

const express = require("express");
const routes = require("./routes/index");
const { errorMiddleware } = require("./middlewares/error.middleware");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.use("/api", routes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
