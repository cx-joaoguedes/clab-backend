const mongoose = require('mongoose');

const scanSchema = mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    content_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'scan_file_content.files',
        required: true
    },
    source: {
        type: 'String',
        required: true
    },
    type: {
        type: 'String',
        required: true
    }
});

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;
