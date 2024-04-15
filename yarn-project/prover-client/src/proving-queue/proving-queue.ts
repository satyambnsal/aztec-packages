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

import { type CircuitProver } from '../prover/interface.js';

export enum ProvingJobType {
  BASE_ROLLUP,
  MERGE_ROLLUP,
  ROOT_ROLLUP,

  BASE_PARITY,
  ROOT_PARITY,
}

export type ProvingRequest =
  | {
      type: ProvingJobType.BASE_PARITY;
      inputs: BaseParityInputs;
    }
  | {
      type: ProvingJobType.ROOT_PARITY;
      inputs: RootParityInputs;
    }
  | {
      type: ProvingJobType.BASE_ROLLUP;
      inputs: BaseRollupInputs;
    }
  | {
      type: ProvingJobType.MERGE_ROLLUP;
      inputs: MergeRollupInputs;
    }
  | {
      type: ProvingJobType.ROOT_ROLLUP;
      inputs: RootRollupInputs;
    };

export type ProvingJob<T extends ProvingRequest = ProvingRequest> = { id: string; request: T };

/** Type-safe public inputs depending on proving job */
export type PublicInputs<T extends ProvingJobType> = T extends ProvingJobType.BASE_PARITY | ProvingJobType.ROOT_PARITY
  ? ParityPublicInputs
  : T extends ProvingJobType.BASE_ROLLUP | ProvingJobType.MERGE_ROLLUP
  ? BaseOrMergeRollupPublicInputs
  : T extends ProvingJobType.ROOT_ROLLUP
  ? RootRollupPublicInputs
  : never;

export type ProvingResult<T extends ProvingJobType> = [PublicInputs<T>, Proof];

export type GetJobOptions = {
  timeoutSec?: number;
};

export interface ProvingQueueConsumer {
  getJob(opts?: GetJobOptions): Promise<ProvingJob | null>;
  resolveJob<T extends ProvingJob>(id: T['id'], result: ProvingResult<T['request']['type']>): Promise<void>;
  rejectJob<T extends ProvingJob>(id: T['id'], err: any): Promise<void>;
}

export interface ProvingQueue extends ProvingQueueConsumer, CircuitProver {}
