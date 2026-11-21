import crypto from "node:crypto";
import type { SpreadsheetLocation } from "../types/domain.js";
import { errorMessage } from "../types/errors.js";
import { processUserLeads, type LeadProcessingProgress } from "./leadProcessingService.js";

type JobStatus = "queued" | "running" | "completed" | "failed";
type JobResult = Awaited<ReturnType<typeof processUserLeads>>;

export interface LeadProcessingJob {
  jobId: string;
  status: JobStatus;
  currentLead: number;
  totalLeads: number;
  draftsCreated: number;
  failed: number;
  error?: string;
  result?: JobResult;
}

interface StoredLeadProcessingJob extends LeadProcessingJob {
  userId: string;
  finishedAt?: number;
}

const JOB_RETENTION_MS = 60 * 60 * 1000;
const jobs = new Map<string, StoredLeadProcessingJob>();

function pruneFinishedJobs(): void {
  const expireBefore = Date.now() - JOB_RETENTION_MS;
  for (const [jobId, job] of jobs) {
    if (job.finishedAt !== undefined && job.finishedAt < expireBefore) jobs.delete(jobId);
  }
}

async function runJob(job: StoredLeadProcessingJob, spreadsheet: SpreadsheetLocation): Promise<void> {
  job.status = "running";
  try {
    job.result = await processUserLeads(job.userId, spreadsheet, (progress: LeadProcessingProgress) => {
      job.currentLead = progress.currentLead;
      job.totalLeads = progress.totalLeads;
      job.draftsCreated = progress.draftsCreated;
      job.failed = progress.failed;
    });
    job.status = "completed";
  } catch (error) {
    job.error = errorMessage(error);
    job.status = "failed";
    console.error(`Lead processing job ${job.jobId} failed: ${job.error}`);
  } finally {
    job.finishedAt = Date.now();
  }
}

export function startLeadProcessingJob(userId: string, spreadsheet: SpreadsheetLocation): string {
  pruneFinishedJobs();
  const activeJob = [...jobs.values()].find((job) => (
    job.userId === userId && (job.status === "queued" || job.status === "running")
  ));
  if (activeJob) return activeJob.jobId;

  const jobId = crypto.randomUUID();
  const job: StoredLeadProcessingJob = {
    jobId,
    userId,
    status: "queued",
    currentLead: 0,
    totalLeads: 0,
    draftsCreated: 0,
    failed: 0,
  };
  jobs.set(jobId, job);
  setImmediate(() => { void runJob(job, spreadsheet); });
  return jobId;
}

export function getLeadProcessingJob(userId: string, jobId: string): LeadProcessingJob | undefined {
  pruneFinishedJobs();
  const job = jobs.get(jobId);
  if (!job || job.userId !== userId) return undefined;
  const { userId: _userId, finishedAt: _finishedAt, ...snapshot } = job;
  return snapshot;
}
