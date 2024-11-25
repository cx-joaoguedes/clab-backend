const path = require('path');
const gridFSManager = require('../config/gridfs')
const Scan = require('../models/scan')
const Result = require('../models/result')
const ResultNode = require('../models/result_node')
const cxParsers = require('../utils/parsers/cx')
const snykParsers = require('../utils/parsers/snyk')
const crypto = require('crypto');

const parserList = {
    cx: {
        json: cxParsers.parseCheckmarxJSON,
        sarif: cxParsers.parseCheckmarxSARIF
    },
    snyk: {
        json: snykParsers.parseSnykJSON,
        sarif: snykParsers.parseSnykSARIF
    }
}

const UploadResults = async (req, res) => {
    try {
        const resultsFile = req.file;
        const fileType = path.extname(resultsFile.originalname).toLowerCase().split('.').slice(1)[0];
        const fileBuffer = resultsFile.buffer;
        const fileName = resultsFile.originalname
        const source = req.body.source || 'cx';
        const project_id = req.body.project_id

        if (!resultsFile || !project_id) return res.status(400).send({ error: 'scan file or project_id missing' })

        const handleResponse = await handleResults(source, { fileType, fileBuffer, fileName }, project_id);
        return res.status(200).send(handleResponse);
    } catch (error) {
        console.error('Error parsing results:', error);
        if (error.message.includes("No parser")) return res.status(404).send({ error: 'Parser not found' });
        return res.status(500).send({ error: 'Failed to process the results file.' });
    }
};

const uploadScanSourceGridFS = async (fileData) => {
    const { fileName, fileBuffer } = fileData
    try {
        const bucket = await gridFSManager.getScanFileContentBucket();
        const uploadStream = bucket.openUploadStream(fileName);
        uploadStream.end(fileBuffer);
        return new Promise((resolve, reject) => {
            uploadStream.on('finish', () => resolve(uploadStream.id));
            uploadStream.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error('Error uploading file to GridFS:', error);
        throw error;
    }
};

const uploadResultsAndNodes = async (resultData, scan_id) => {
    const preparedResults = resultData.map(result => ({
        original_query_name: result.original_query_name,
        original_severity: result.original_severity,
        scan_id,
        unique_id: generateUniqueId(result),
        group_id: null,
    }))
    const insertedResults = await Result.insertMany(preparedResults);

    // Prepare nodes for bulk insertion
    const nodes = [];
    resultData.forEach((result, index) => {
        const result_id = insertedResults[index]._id; // Match nodes to the inserted result
        result.nodes.forEach((node) => {
            nodes.push({ ...node, result_id });
        });
    });

    // Bulk insert nodes
    const insertedNodes = await ResultNode.insertMany(nodes);

    return { insertedResults, insertedNodes }
}

const generateUniqueId = (result) => {
    // Normalize and include every bit of data
    const normalizedResult = {
        query_name: result.original_query_name || '',
        severity: result.original_severity || '',
        node_count: (result.nodes || []).length, // Include the number of nodes
        nodes: (result.nodes || []).map((node) => ({
            file_name: node.file_name || '',
            start_line: node.start_line || 0,
            end_line: node.end_line || 0,
            start_column: node.start_column || 0,
            end_column: node.end_column || 0,
            node_name: node.node_name || '',
        })),
    };

    // Sort nodes to ensure consistent order for hashing
    normalizedResult.nodes.sort((a, b) => {
        if (a.file_name !== b.file_name) return a.file_name.localeCompare(b.file_name);
        if (a.start_line !== b.start_line) return a.start_line - b.start_line;
        if (a.start_column !== b.start_column) return a.start_column - b.start_column;
        if (a.end_line !== b.end_line) return a.end_line - b.end_line;
        return a.end_column - b.end_column;
    });

    // Serialize the entire normalized object deterministically
    const serializedData = JSON.stringify(normalizedResult);

    // Generate a SHA-256 hash of the serialized data
    return crypto.createHash('sha256').update(serializedData).digest('hex');
};

const handleResults = async (source, fileData, project_id) => {
    const fileType = fileData.fileType

    const parsers = parserList[source];
    if (!parsers) throw new Error(`No parsers found for source: ${source}`)
    const parser = parsers[fileType]
    if (!parser) throw new Error(`No parser found for extension: ${fileType}`)

    const parsedResults = await parser(fileData.fileBuffer);

    // Upload scan file to GridFS
    const uploadScanId = await uploadScanSourceGridFS(fileData)
    // Create new Scan
    const newScan = await new Scan({ project_id, content_id: uploadScanId, source, type: fileType })
    const uploadedScan = await newScan.save();

    // Parse Results
    const { insertedResults, insertedNodes } = await uploadResultsAndNodes(parsedResults, uploadedScan._id)
    return { insertedResults: insertedResults.length, insertedNodes: insertedNodes.length }
};

module.exports = { UploadResults };
