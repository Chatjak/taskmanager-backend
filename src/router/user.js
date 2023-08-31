const express = require("express");
const userRouter = express.Router();
const User = require("../model/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
userRouter.post("/user/register", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.send();
  }
});

userRouter.post("/user/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.cookie("token", token, { httpOnly: true, secure: true });
    res.send({ user, token });
  } catch {
    res.status(500).send();
  }
});

userRouter.get("/user/me", auth, async (req, res) => {
  const user = await req.user;
  res.send(user);
});

userRouter.patch("/user/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["email", "password", "name"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "invalid updates" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send();
  }
});

userRouter.post("/user/me/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch {
    res.status(500).send();
  }
});

userRouter.post("/user/me/logoutAll", auth, async (req, res) => {
  req.user.tokens = [];
  await req.user.save();
  res.send();
});

const upload = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|PNG)/)) {
      return cb(new Error("please upload a jpg jpeg or png"));
    }
    cb(undefined, true);
  },
});

userRouter.post(
  "/user/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  }
);

userRouter.delete("/user/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

userRouter.get("/user/me/avatar", auth, async (req, res) => {
  try {
    const user = await req.user;
    if (!user.avatar) {
      throw new Error();
    }
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch {
    res.status(500).send();
  }
});

module.exports = userRouter;
