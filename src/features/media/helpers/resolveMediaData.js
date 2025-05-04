const mongoose = require('mongoose');
const Media = require('@src/models/media');

/**
 * Resolves an array of media ObjectIds into their full data
 * @param {Array} objectIds - Array of ObjectIds or media objects
 * @returns {Promise<Array>} Array of resolved media data
 */
const resolveMediaData = async (objectIds) => {
  if (!Array.isArray(objectIds) || objectIds.length === 0) {
    console.log('No media IDs to resolve or invalid input');
    return [];
  }

  try {
    console.log(`Attempting to resolve ${objectIds.length} media items`);
    
    // This is the critical issue - 'Media' model is defined with uppercase, 
    // but MongoDB collection names are lowercase by default
    // The actual collection name will be 'medias' (lowercase and pluralized)
    
    // Direct database query to check collection name
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    // Get correct collection name based on the model
    const mediaCollectionName = Media.collection.name;
    console.log('Media collection name from model:', mediaCollectionName);
    
    // Convert any ObjectIds to strings for consistent handling
    const idStrings = objectIds.map(id => id.toString());
    
    // Convert strings back to ObjectIds for the query
    const objectIdArray = idStrings.map(id => new mongoose.Types.ObjectId(id));
    
    // Query the database with the proper ObjectIds
    const mediaData = await Media.find({ 
      '_id': { $in: objectIdArray } 
    }).select('tmdb_id media_type title vote_average release_date poster_path');
    
    console.log(`Successfully resolved ${mediaData.length} out of ${objectIds.length} media items`);
    
    // If we still got nothing, try direct database access
    if (mediaData.length === 0) {
      console.log('Attempting direct database access...');
      
      // Try with the actual collection name from mongoose model
      const mediaCollection = db.collection(mediaCollectionName);
      const rawResults = await mediaCollection.find({
        '_id': { $in: objectIdArray }
      }).limit(10).toArray();
      
      console.log(`Direct DB query found ${rawResults.length} documents`);
      
      if (rawResults.length > 0) {
        // Return the raw results if we found them
        console.log('Using raw results instead of mongoose results');
        return rawResults;
      } else {
        // Check if any IDs exist in ANY collection
        console.log('Checking for IDs in any collection...');
        
        // Try a few common variations of collection names
        const possibleCollectionNames = ['media', 'medias', 'Media', 'Medias'];
        
        for (const collName of possibleCollectionNames) {
          if (collectionNames.includes(collName)) {
            console.log(`Trying collection: ${collName}`);
            const tempColl = db.collection(collName);
            const tempResults = await tempColl.find({
              '_id': { $in: objectIdArray.slice(0, 3) }
            }).limit(3).toArray();
            
            if (tempResults.length > 0) {
              console.log(`Found ${tempResults.length} results in ${collName} collection!`);
              
              // Get all results from this collection
              const allResults = await tempColl.find({
                '_id': { $in: objectIdArray }
              }).toArray();
              
              return allResults;
            }
          }
        }
      }
    }
    
    return mediaData;
  } catch (error) {
    console.error('Error resolving media data:', error.message);
    console.error('Error stack:', error.stack);
    return [];
  }
};

module.exports = resolveMediaData;