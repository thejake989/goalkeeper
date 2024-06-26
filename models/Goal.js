const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  text: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completed: { type: Boolean, default: false },
  dateCompleted: { type: Date }
});

module.exports = mongoose.model('Goal', GoalSchema);
