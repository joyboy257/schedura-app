import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Queue from 'bull';
import { processPostPublishing } from './processors/post-processor';
import { processAnalyticsFetch } from './processors/analytics-processor';
import { processTokenRefresh } from './processors/token-processor';

// Load environment variables
config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize queues
const postQueue = new Queue('post-publishing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const analyticsQueue = new Queue('analytics-fetch', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const tokenQueue = new Queue('token-refresh', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Process jobs
postQueue.process(async (job) => {
  return processPostPublishing(job, prisma);
});

analyticsQueue.process(async (job) => {
  return processAnalyticsFetch(job, prisma);
});

tokenQueue.process(async (job) => {
  return processTokenRefresh(job, prisma);
});

// Error handling
postQueue.on('error', (error) => {
  console.error('Post queue error:', error);
});

analyticsQueue.on('error', (error) => {
  console.error('Analytics queue error:', error);
});

tokenQueue.on('error', (error) => {
  console.error('Token queue error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await Promise.all([
    postQueue.close(),
    analyticsQueue.close(),
    tokenQueue.close(),
    prisma.$disconnect(),
  ]);
  process.exit(0);
});

console.log('Worker service started successfully'); 