const mongoose = require('mongoose');

const projectSchema = mongoose.Schema({
  project_name: {
    type: String,
    required: true,
  },
  project_description: {
    type: String,
    default: "No description"
  },
  project_language: {
    type: String,
    required: true
  },
  project_owner: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  upatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
