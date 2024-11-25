const mongoose = require('mongoose');

const resultSchema = mongoose.Schema({
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
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'query_groups',
        default: null
    }
});

const Result = mongoose.model('Result', resultSchema);

module.exports = Result;
