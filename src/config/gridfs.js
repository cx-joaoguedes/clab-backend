const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

class GridFSManager {
  constructor() {
    this.sourceContentBucket = null;
    this.scanFileContentBucket = null;
  }

  init() {
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error('Mongoose connection is not established. Ensure MongoDB is connected before initializing GridFS.');
    }

    const db = mongoose.connection.db;
    this.sourceContentBucket = new GridFSBucket(db, { bucketName: 'source_content' });
    this.scanFileContentBucket = new GridFSBucket(db, { bucketName: 'scan_file_content' });

    console.log('GridFS buckets initialized successfully.');
  }

  getSourceContentBucket() {
    if (!this.sourceContentBucket) {
      throw new Error('Source Content Bucket is not initialized. Call init() first.');
    }
    return this.sourceContentBucket;
  }

  getScanFileContentBucket() {
    if (!this.scanFileContentBucket) {
      throw new Error('Scan File Content Bucket is not initialized. Call init() first.');
    }
    return this.scanFileContentBucket;
  }
}

const gridFSManager = new GridFSManager();

module.exports = gridFSManager;
