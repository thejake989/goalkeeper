const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your_jwt_secret';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/goaltracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
});

// Define User schema and model
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    goals: [
        {
            text: String,
            completed: { type: Boolean, default: false },
            dateCompleted: Date
        }
    ]
});

const User = mongoose.model('User', UserSchema);

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ error: 'Token is missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Register route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.json({ message: 'User registered' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get goals route
app.get('/goals', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json(user.goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add goal route
app.post('/goals', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.goals.push(req.body);
        await user.save();
        res.json(user.goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update goal route
app.put('/goals/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const goal = user.goals.id(req.params.id);
        goal.completed = req.body.completed;
        goal.dateCompleted = req.body.dateCompleted;
        await user.save();
        res.json(user.goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete goal route
app.delete('/goals/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        user.goals.id(req.params.id).remove();
        await user.save();
        res.json(user.goals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
