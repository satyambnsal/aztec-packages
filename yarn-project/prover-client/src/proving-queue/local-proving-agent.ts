import { createDebugLogger } from '@aztec/foundation/log';
import { RunningPromise } from '@aztec/foundation/running-promise';

import { type CircuitProver } from '../prover/interface.js';
import { type ProvingAgent } from './proving-agent.js';
import { ProvingJobType, type ProvingQueueConsumer, type ProvingRequest, type ProvingResult } from './proving-queue.js';

export class LocalProvingAgent implements ProvingAgent {
  private runningPromise?: RunningPromise;

  constructor(
    /** The prover implementation to defer jobs to */
    private prover: CircuitProver,
    /** How long to wait between jobs */
    private intervalMs = 10,
    /** A name for this agent (if there are multiple agents running) */
    name = '',
    private log = createDebugLogger('aztec:prover-client:proving-agent' + name ? `:${name}` : ''),
  ) {}

  start(queue: ProvingQueueConsumer): void {
    this.runningPromise = new RunningPromise(async () => {
      this.log.debug('Asking for proving jobs');
      const job = await queue.getJob();
      if (!job) {
        return;
      }

      try {
        this.log.debug(`Processing proving job id=${job.id} type=${ProvingJobType[job.request.type]}`);
        await queue.resolveJob(job.id, await this.work(job.request));
      } catch (err) {
        this.log.error(`Error processing proving job id=${job.id} type=${ProvingJobType[job.request.type]}: ${err}`);
        await queue.rejectJob(job.id, err);
      }
    }, this.intervalMs);

    this.runningPromise.start();
  }

  async stop(): Promise<void> {
    await this.runningPromise?.stop();
    this.runningPromise = undefined;
  }

  private work({ type, inputs }: ProvingRequest): Promise<ProvingResult<typeof type>> {
    switch (type) {
      case ProvingJobType.BASE_PARITY: {
        return this.prover.getBaseParityProof(inputs);
      }

      case ProvingJobType.ROOT_PARITY: {
        return this.prover.getRootParityProof(inputs);
      }

      case ProvingJobType.BASE_ROLLUP: {
        return this.prover.getBaseRollupProof(inputs);
      }

      case ProvingJobType.MERGE_ROLLUP: {
        return this.prover.getMergeRollupProof(inputs);
      }

      case ProvingJobType.ROOT_ROLLUP: {
        return this.prover.getRootRollupProof(inputs);
      }

      default: {
        return Promise.reject(new Error(`Invalid proof request type: ${type}`));
      }
    }
  }
}
