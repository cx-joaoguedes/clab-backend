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
  upload_state: {
    type: String,
    required: true,
    default: "pending"
  },
  file_count: {
    type: Number,
    default: 0
  },
  dir_count: {
    type: Number,
    default: 0
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
