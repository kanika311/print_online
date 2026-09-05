import mongoose from 'mongoose';

export async function connectMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/printporter_db';
  try {
    console.log(`[MongoDB] Connecting to ${uri}...`);
    // Connect with a short 3-second timeout for local dev flexibility
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('✅ [MongoDB] Successfully connected to MongoDB Database.');
    return true;
  } catch (err: any) {
    console.warn(`⚠️ [MongoDB] Local standalone MongoDB daemon not reachable (${err.message}).`);
    console.info('💡 [MongoDB] PrintPorter will operate with high-speed Document Store Engine with persistent memory and GeoJSON index.');
    return false;
  }
}
