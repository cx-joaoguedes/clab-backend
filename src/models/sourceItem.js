const mongoose = require('mongoose');

const sourceItemSchema = mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  item_name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['file','dir'],
    required: true
  },
  parent: {
    type: String,
    default: null
  },
  size: {
    type: Number,
    required: true
  },
  extension: {
    type: String,
    default: null
  }
});

const SourceItem = mongoose.model('SourceItem', sourceItemSchema);

module.exports = SourceItem;
