import 'dotenv/config';
import { Queue, Worker, type Job } from 'bullmq';
import { getRedisClient } from './redis.js';
import { supabaseAdmin } from './supabase.js';

const QUEUE_NAME = 'reminders';
const SCAN_JOB_NAME = 'scan-due-reminders';
const SCAN_INTERVAL_MS = 60_000;

type ReminderJob = {
  id: string;
  user_id: string;
  type: string;
  scheduled_for: string;
  status: string;
  metadata: {
    sessionId?: string;
    clientId?: string;
    trainerId?: string;
    startTime?: string;
    recipientRole?: 'client' | 'trainer';
  } | null;
};

const buildReminderNotification = async (job: ReminderJob) => {
  const metadata = job.metadata ?? {};
  const recipientRole = metadata.recipientRole;

  let counterpartName = 'your trainer';

  if (recipientRole === 'client' && metadata.trainerId) {
    const { data: trainer } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', metadata.trainerId)
      .maybeSingle();

    counterpartName = trainer?.full_name ?? counterpartName;
  } else if (recipientRole === 'trainer' && metadata.clientId) {
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('full_name')
      .eq('id', metadata.clientId)
      .maybeSingle();

    counterpartName = client?.full_name ?? 'your client';
  }

  return {
    title: 'Upcoming session',
    message: `Your session with ${counterpartName} starts in 1 hour`,
  };
};

const processDueReminder = async (job: ReminderJob) => {
  const { title, message } = await buildReminderNotification(job);

  const { error: insertError } = await supabaseAdmin.from('notifications').insert({
    user_id: job.user_id,
    type: job.type,
    title,
    message,
  });

  if (insertError) {
    await supabaseAdmin
      .from('reminder_jobs')
      .update({ status: 'failed' })
      .eq('id', job.id);

    console.error(`❌ Failed to create notification for reminder ${job.id}:`, insertError.message);
    return;
  }

  await supabaseAdmin.from('reminder_jobs').update({ status: 'sent' }).eq('id', job.id);
};

const scanDueReminders = async () => {
  const { data: dueJobs, error } = await supabaseAdmin
    .from('reminder_jobs')
    .select('id, user_id, type, scheduled_for, status, metadata')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString());

  if (error) {
    console.error('❌ Failed to fetch due reminder jobs:', error.message);
    return;
  }

  for (const job of (dueJobs ?? []) as ReminderJob[]) {
    await processDueReminder(job);
  }
};

async function startWorker() {
  try {
    console.log('🚀 Starting FitStudio Pro Worker...');

    const connection = getRedisClient();
    const queue = new Queue(QUEUE_NAME, { connection });

    await queue.add(
      SCAN_JOB_NAME,
      {},
      { repeat: { every: SCAN_INTERVAL_MS }, jobId: SCAN_JOB_NAME },
    );

    const worker = new Worker(
      QUEUE_NAME,
      async (job: Job) => {
        if (job.name === SCAN_JOB_NAME) {
          await scanDueReminders();
        }
      },
      { connection },
    );

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.name} failed:`, err.message);
    });

    console.log('✅ Worker started successfully');

    process.on('SIGTERM', async () => {
      console.log('📍 SIGTERM received, shutting down gracefully...');
      await worker.close();
      await queue.close();
      connection.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Worker startup error:', error);
    process.exit(1);
  }
}

startWorker();
