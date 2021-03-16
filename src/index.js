const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username == username);

  if (!user) {
    return response.status(404).json({
      error: "user not found",
    });
  }

  request.user = user;
  next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyRegistered = users.find((user) => user.username == username);

  if (!userAlreadyRegistered) {
    const userID = uuidv4();
    users.push({
      id: userID, // precisa ser um uuid
      name,
      username,
      todos: [],
    });

    return response.status(201).json({
      id: userID,
      name,
      username,
      todos: [],
    });
  }

  return response.status(400).json({
    error: `impossible create user ${username} because is already registered`,
  });
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const user = request.user;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const user = request.user;

  user.todos.push({
    id: uuidv4(), // precisa ser um uuid
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  });

  return response.status(201).json(user.todos[user.todos.length - 1]);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const user = request.user;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex((todo) => todo.id == id);

  if (todoIndex < 0) {
    return response.status(404).json({
      error: "is not possible update a non-existing todo",
    });
  }

  user.todos[todoIndex].title = title;
  user.todos[todoIndex].deadline = new Date(deadline);

  return response
    .json({
      title: user.todos[todoIndex].title,
      deadline: user.todos[todoIndex].deadline.toISOString(),
      done: user.todos[todoIndex].done,
    })
    .status(204);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const user = request.user;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex((todo) => todo.id == id);

  if (todoIndex < 0) {
    return response.status(404).json({
      error: "is not possible mark as done a non-existing todo",
    });
  }

  user.todos[todoIndex].done = true;

  return response.json(user.todos[todoIndex]).status(204);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const user = request.user;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex((todo) => todo.id == id);

  if (todoIndex < 0) {
    return response.status(404).json({
      error: "is not possible delete a non-existing todo",
    });
  }

  const deletedTodo = user.todos[todoIndex];

  user.todos.splice(todoIndex, 1);

  return response.sendStatus(204);
});

module.exports = app;
