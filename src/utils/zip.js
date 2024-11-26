const SourceItem = require('../models/SourceItem');
const gridFSManager = require('../config/gridfs')
const { uploadFileToGridFS, uploadStreamToGridFS } = require('./gridfs')
const path = require('path')
const ObjectId = require('mongoose').Types.ObjectId
const CHUNK_SIZE = 100
const CONCURRENCY_LIMIT = 10
const stream = require('stream');

const normalizePath = (inputPath) => {
    return path
        .normalize(inputPath)
        .replace(/\\/g, '/')
        .replace(/\/+$/, '')
}

const getPathData = (sourcePath) => {
    const entryPath = normalizePath(sourcePath);
    const parentPath = normalizePath(path.dirname(entryPath));
    const nameParts = entryPath.split('/').filter(Boolean);

    return { entryPath, parentPath, nameParts }
}

const updateRecord = async (record, attributes) => {
    for (const [attribute, value] of Object.entries(attributes)) {
        record[attribute] = value;
    }
    await record.save();
}

const traverseAndUpload = async (zip, project_id, io, socketRoom, existingProject) => {
    const bucket = await gridFSManager.getSourceContentBucket();
    const projectId = new ObjectId(project_id);
    const zipEntries = zip.getEntries();

    const sourceBuffer = [];
    const fileUploadQueue = [];

    const totalEntries = zipEntries.length;
    let processedEntries = 0;

    // Notify the client that processing has started
    io.to(socketRoom).emit('start', {
        total: totalEntries,
    });

    await updateRecord(existingProject, { 'upload_state': 'processing' })

    for (const entry of zipEntries) {
        const { entryPath, parentPath, nameParts } = getPathData(entry.entryName);
        const type = entry.isDirectory ? 'dir' : 'file';
        const sourceItem = {
            project_id: projectId,
            item_name: nameParts.pop(),
            path: entryPath,
            type,
            parent: parentPath === '.' ? null : parentPath,
            size: entry.header.size,
            extension: path.extname(entryPath).toLowerCase().split('.').slice(1)[0] || null,
        };
        sourceBuffer.push(sourceItem);

        if (type === 'file') {
            const fileStream = new stream.PassThrough();
            fileStream.end(entry.getData());
            const contentMetadata = { project_id: projectId, path: entryPath };
            fileUploadQueue.push(async () => {
                try {
                    await uploadStreamToGridFS(entryPath, fileStream, contentMetadata, bucket);
                } catch (error) {
                    console.error('File upload error:', error);
                } finally {
                    processedEntries++;
                    io.to(socketRoom).emit('progress', {
                        total: totalEntries,
                        processed: processedEntries,
                        percentage: (processedEntries / totalEntries) * 100
                    });
                }
            });
        } else {
            processedEntries++;
            io.to(socketRoom).emit('progress', {
                total: totalEntries,
                processed: processedEntries,
                percentage: (processedEntries / totalEntries) * 100
            });
        }
    }

    try {
        // Perform file uploads with limited concurrency
        const uploadResults = await processWithConcurrency(fileUploadQueue, CONCURRENCY_LIMIT);

        // Batch insert metadata into MongoDB
        const insertedSources = [];
        for (let i = 0; i < sourceBuffer.length; i += CHUNK_SIZE) {
            const chunk = sourceBuffer.slice(i, i + CHUNK_SIZE);
            const insertedChunk = await SourceItem.insertMany(chunk);
            insertedSources.push(...insertedChunk);
        }

        const file_count = uploadResults.length
        const dir_count = insertedSources.length - file_count

        // Notify the client of successful completion
        io.to(socketRoom).emit('complete', {
            sourceItemCount: insertedSources.length,
            gfsCount: uploadResults.length,
        });

        await updateRecord(existingProject, { 'upload_state': 'done', file_count, dir_count })

    } catch (error) {
        console.error('Processing error:', error);
        io.to(socketRoom).emit('error', {
            message: 'An error occurred during the upload process.',
            error: error.message || 'Unknown error',
        });
    } finally {
        // Clean up and close the WebSocket room
        io.to(socketRoom).disconnectSockets();
    }
};



// Custom concurrency handler
const processWithConcurrency = async (tasks, limit) => {
    const results = [];
    const executing = new Set();

    for (const task of tasks) {
        const promise = task().then(result => {
            executing.delete(promise);
            return result;
        });
        results.push(promise);
        executing.add(promise);

        if (executing.size >= limit) {
            await Promise.race(executing); // Wait for one task to complete before adding more
        }
    }

    await Promise.all(executing); // Wait for all remaining tasks to finish
    return results;
};

module.exports = {
    traverseAndUpload: traverseAndUpload
};
