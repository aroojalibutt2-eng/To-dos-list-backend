require('dotenv').config()
console.log(process.env.MONGO_URI)
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String
})

const User = mongoose.model('User', userSchema)

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected!"))
  .catch((err) => console.log(err))
 const todoSchema = new mongoose.Schema({
  title: String,
done: { type: Boolean, default: false },
  userId: mongoose.Schema.Types.ObjectId,
  priority: { type: String, default: "mid" },
  cat: { type: String, default: "personal" },
  due: { type: String, default: "" },
  ts: { type: Number, default: Date.now }
})

const Todo = mongoose.model('Todo', todoSchema)
// Sare todos lao
app.get('/todos', async (req, res) => {
  const token = req.headers.authorization
  const decoded = jwt.verify(token, "secret123")
  const todos = await Todo.find({ userId: decoded.id })
  res.json(todos)
})

// Naya todo banao
app.post('/todos', async (req, res) => {
  const token = req.headers.authorization
  const decoded = jwt.verify(token, "secret123")
  const todo = await Todo.create({
    title: req.body.title,
    completed: false,
    userId: decoded.id,
    cat: req.body.cat,
    priority: req.body.priority,
    due: req.body.due
  })
  res.json(todo)
})

// Todo complete/incomplete karo
app.patch('/todos/:id', async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {new: true})
  res.json(todo)
})

// Todo delete karo
app.delete('/todos/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id)
  res.json({ message: "Todo deleted!" })
})
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body

  const exists = await User.findOne({ email })
  if (exists) return res.json({ message: "Email already exists!" })

  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ firstName, lastName, email, password: hashed })

  res.json({ message: "Signup successful!" })
})
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user) return res.json({ message: "User not found!" })

  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.json({ message: "Wrong password!" })

  const token = jwt.sign({ id: user._id }, "secret123")

  res.json({ token })
})

app.listen(3000, () => console.log("Server ready!"))