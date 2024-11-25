const mongoose = require('mongoose');

const resultNodeSchema = mongoose.Schema({
    result_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'results',
        required: true
    },
    file_name: {
        type: String,
        required: true
    },
    start_line: {
        type: Number,
        required: true
    },
    end_line: {
        type: Number,
        required: true
    },
    start_column: {
        type: Number,
        required: true
    },
    end_column: {
        type: Number,
        required: true
    },
    node_name: {
        type: String,
        default: null
    }
});

const resultNode = mongoose.model('ResultNode', resultNodeSchema);

module.exports = resultNode;
