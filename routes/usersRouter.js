const { Router } = require("express");
const usersController = require("../controllers/usersController.js")
const usersRouter = Router()
const { validateUser } = require("../lib/validator.js");

usersRouter.get("/", usersController.home);
usersRouter.get("/sign-up", usersController.getSignUp);
usersRouter.post("/sign-up", validateUser, usersController.postSignUp);
usersRouter.get("/log-in", usersController.getLogIn);
usersRouter.post("/log-in", usersController.postLogIn);
usersRouter.get("/log-out", usersController.getLogOut);
usersRouter.get("/user-folder/:id", usersController.getFiles)
usersRouter.post("/up-files/:id", usersController.postFiles[0],usersController.postFiles[1]);
usersRouter.post("/share-files/:id", usersController.postShareFiles)
usersRouter.get("/shared-files/:id", usersController.getShareFiles)

module.exports = usersRouter;