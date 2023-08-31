const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const userRouter = require("./router/user");
const taskRouter = require("./router/task");

const app = express();
const port = process.env.PORT;
const url = process.env.DATABASE;

const connectMongoDB = async () => {
  await mongoose
    .connect(url, { useNewUrlParser: true })
    .then(() => console.log("connected to database"));
};

connectMongoDB();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api", userRouter);
app.use("/api", taskRouter);

app.listen(port, () => console.log(`server is up on port ${port}`));
