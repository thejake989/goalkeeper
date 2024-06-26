const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const User = require('./models/user');
const Goal = require('./models/Goal');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const mongoURI = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Test route to verify MongoDB connection
app.get('/test', async (req, res) => {
  try {
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    res.send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/goals', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId;

    const goals = await Goal.find({ userId });
    res.json(goals);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/goals', async (req, res) => {
  const { text } = req.body;
  const token = req.headers.authorization.split(' ')[1];

  if (!text) {
    return res.status(400).json({ error: 'Goal text is required' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId;

    const newGoal = new Goal({ text, userId });
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.put('/goals/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const token = req.headers.authorization.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId;

    const goal = await Goal.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(goal);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
