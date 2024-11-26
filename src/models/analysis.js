const mongoose = require('mongoose');

const analysisSchema = mongoose.Schema({
    result_unique_id: {
        type: String,
        ref: 'results',
        required: true
    },
    state: {
        type: "String",
        required: true
    },
    comment: {
        type: "String",
        required: true
    },
    owner: {
        type: "String",
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;
