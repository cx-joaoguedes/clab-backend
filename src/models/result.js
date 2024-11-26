const mongoose = require('mongoose');

const resultSchema = mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'projects',
        required: true
    },
    scan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scans',
        required: true
    },
    unique_id: {
        type: "String",
        required: true
    },
    original_query_name: {
        type: "String",
        required: true
    },
    original_severity: {
        type: "String",
        required: true
    },
    node_count: {
        type: "Number",
        required: true,
        default: 0
    },
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'query_groups',
        default: null
    }
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
