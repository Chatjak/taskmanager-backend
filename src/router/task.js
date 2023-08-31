const express = require("express");
const taskRouter = express.Router();
const Task = require("../model/task");
const auth = require("../middleware/auth");

taskRouter.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    user_id: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch {
    res.status(400).send();
  }
});

//GET /tasks?completed=false or true
//GET /tasks?limit=index
//GET /tasks?sortBy=createdAt:desc ? asc

taskRouter.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .then(() => res.send(req.user.tasks))
      .catch((error) => res.status(404).send(error));
  } catch {
    res.status(500).send();
  }
});

taskRouter.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["content", "description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "invalid updates" });
  }
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch {
    res.status(400).send();
  }
});

taskRouter.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send();
  } catch {
    res.status(500).send();
  }
});

module.exports = taskRouter;
