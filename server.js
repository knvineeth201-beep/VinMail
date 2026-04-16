const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// 1. Connect to MongoDB (Replace with your own Connection String)
mongoose.connect('mongodb+srv://vinmail:vineeth@cluster0.ttykelf.mongodb.net/?appName=Cluster0')
    .then(() => console.log("Connected to Database"))
    .catch(err => console.log(err));

// 2. Data Models
const UserSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: { type: String, unique: true },
    password: { type: String }
});

const EmailSchema = new mongoose.Schema({
    sender: String,
    recipient: String,
    subject: String,
    body: String,
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);
const Email = mongoose.model('Email', EmailSchema);

// 3. API Routes
// Register
app.post('/api/register', async (req, res) => {
    const { name, phone, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = await User.create({ name, phone, email, password: hashedPassword });
        res.status(201).json({ message: "User Created" });
    } catch (e) {
        res.status(400).json({ message: "Email already exists" });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid Credentials" });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, 'SECRET_KEY');
    res.json({ token, user: { name: user.name, email: user.email } });
});

// Send Email
app.post('/api/send', async (req, res) => {
    const { sender, recipient, subject, body } = req.body;
    await Email.create({ sender, recipient, subject, body });
    res.json({ message: "Sent Successfully" });
});

// Get Inbox
app.get('/api/emails/:email', async (req, res) => {
    const emails = await Email.find({ recipient: req.params.email }).sort({ timestamp: -1 });
    res.json(emails);
});

app.listen(5000, () => console.log("Server running on port 5000"));