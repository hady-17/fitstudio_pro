import { connectRedis, redis } from './redis.js';
import { supabaseAdmin } from './supabase.js';

async function startWorker() {
  try {
    console.log('🚀 Starting FitStudio Pro Worker...');
    
    // Connect to Redis
    await connectRedis();
    
    console.log('✅ Worker started successfully');
  } catch (error) {
    console.error('❌ Worker startup error:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📍 SIGTERM received, shutting down gracefully...');
  await redis.disconnect();
  process.exit(0);
});
