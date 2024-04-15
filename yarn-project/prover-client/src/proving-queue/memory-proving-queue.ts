import {
  type BaseOrMergeRollupPublicInputs,
  type BaseParityInputs,
  type BaseRollupInputs,
  type MergeRollupInputs,
  type ParityPublicInputs,
  type Proof,
  type RootParityInputs,
  type RootRollupInputs,
  type RootRollupPublicInputs,
} from '@aztec/circuits.js';
import { InterruptError } from '@aztec/foundation/error';
import { MemoryFifo } from '@aztec/foundation/fifo';
import { createDebugLogger } from '@aztec/foundation/log';

import {
  type ProvingJob,
  ProvingJobType,
  type ProvingQueue,
  type ProvingRequest,
  type ProvingResult,
} from './proving-queue.js';

type ProvingJobWithResolvers<T extends ProvingRequest = ProvingRequest> = ProvingJob<T> & {
  resolve: (result: ProvingResult<T['type']>) => void;
  reject: (err: any) => void;
};

export class MemoryProvingQueue implements ProvingQueue {
  private jobId = 0;
  private log = createDebugLogger('aztec:prover:proving_queue');
  private queue = new MemoryFifo<ProvingJobWithResolvers>();
  private jobsInProgress = new Map<string, ProvingJobWithResolvers>();

  getBaseParityProof(inputs: BaseParityInputs): Promise<[ParityPublicInputs, Proof]> {
    return this.put({ type: ProvingJobType.BASE_PARITY, inputs });
  }

  getRootParityProof(inputs: RootParityInputs): Promise<[ParityPublicInputs, Proof]> {
    return this.put({ type: ProvingJobType.ROOT_PARITY, inputs });
  }

  getBaseRollupProof(input: BaseRollupInputs): Promise<[BaseOrMergeRollupPublicInputs, Proof]> {
    return this.put({ type: ProvingJobType.BASE_ROLLUP, inputs: input });
  }

  getMergeRollupProof(input: MergeRollupInputs): Promise<[BaseOrMergeRollupPublicInputs, Proof]> {
    return this.put({ type: ProvingJobType.MERGE_ROLLUP, inputs: input });
  }

  getRootRollupProof(input: RootRollupInputs): Promise<[RootRollupPublicInputs, Proof]> {
    return this.put({ type: ProvingJobType.ROOT_ROLLUP, inputs: input });
  }

  async getJob({ timeoutSec = 1 } = {}): Promise<ProvingJob | null> {
    try {
      const job = await this.queue.get(timeoutSec);
      if (!job) {
        return null;
      }

      this.jobsInProgress.set(job.id, job);
      return job;
    } catch (err) {
      if (err instanceof InterruptError) {
        return null;
      }

      throw err;
    }
  }

  resolveJob<T extends ProvingJob>(jobId: T['id'], result: ProvingResult<T['request']['type']>): Promise<void> {
    const job = this.jobsInProgress.get(jobId);
    if (!job) {
      return Promise.reject(new Error('Job not found'));
    }

    this.jobsInProgress.delete(jobId);
    job.resolve(result);
    return Promise.resolve();
  }

  rejectJob<T extends ProvingJob>(jobId: T['id'], err: any): Promise<void> {
    const job = this.jobsInProgress.get(jobId);
    if (!job) {
      return Promise.reject(new Error('Job not found'));
    }

    this.jobsInProgress.delete(jobId);
    job.reject(err);
    return Promise.resolve();
  }

  private put<T extends ProvingRequest>(request: T): Promise<ProvingResult<T['type']>> {
    let resolve: ProvingJobWithResolvers<typeof request>['resolve'] | undefined;
    let reject: ProvingJobWithResolvers<T>['reject'] | undefined;

    const promise = new Promise<ProvingResult<T['type']>>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // ES spec guarantees that resolve and reject are defined
    // this `if` makes TypeScript happy
    if (!resolve || !reject) {
      throw new Error('Promise not created');
    }

    const item: ProvingJobWithResolvers<T> = {
      id: String(this.jobId++),
      request,
      resolve,
      reject,
    };

    this.log.info(`Adding ${ProvingJobType[request.type]} proving job to queue`);
    // TODO (alexg) remove the `any`
    if (!this.queue.put(item as any)) {
      return Promise.reject(new Error('Failed to submit proving request'));
    }

    return promise;
  }
}
