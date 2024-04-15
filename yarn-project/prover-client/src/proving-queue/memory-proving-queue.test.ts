import {
  makeBaseParityInputs,
  makeBaseRollupInputs,
  makeParityPublicInputs,
  makeProof,
} from '@aztec/circuits.js/testing';

import { MemoryProvingQueue } from './memory-proving-queue.js';
import { ProvingJobType, type ProvingQueue } from './proving-queue.js';

describe('MemoryProvingQueue', () => {
  let queue: ProvingQueue;

  beforeEach(() => {
    queue = new MemoryProvingQueue();
  });

  it('accepts multiple proving requests', () => {
    expect(queue.getBaseParityProof(makeBaseParityInputs())).toBeInstanceOf(Promise);
    expect(queue.getBaseRollupProof(makeBaseRollupInputs())).toBeInstanceOf(Promise);
  });

  it('returns jobs in order', async () => {
    void queue.getBaseParityProof(makeBaseParityInputs());
    void queue.getBaseRollupProof(makeBaseRollupInputs());

    const job1 = await queue.getJob();
    expect(job1?.request.type).toEqual(ProvingJobType.BASE_PARITY);

    const job2 = await queue.getJob();
    expect(job2?.request.type).toEqual(ProvingJobType.BASE_ROLLUP);
  });

  it('returns null when no jobs are available', async () => {
    await expect(queue.getJob({ timeoutSec: 0 })).resolves.toBeNull();
  });

  it('notifies of completion', async () => {
    const inputs = makeBaseParityInputs();
    const promise = queue.getBaseParityProof(inputs);
    const job = await queue.getJob();
    expect(job?.request.inputs).toEqual(inputs);

    const publicInputs = makeParityPublicInputs();
    const proof = makeProof();
    await queue.resolveJob(job!.id, [publicInputs, proof]);
    await expect(promise).resolves.toEqual([publicInputs, proof]);
  });

  it('notifies of errors', async () => {
    const inputs = makeBaseParityInputs();
    const promise = queue.getBaseParityProof(inputs);
    const job = await queue.getJob();
    expect(job?.request.inputs).toEqual(inputs);

    const error = new Error('test error');
    await queue.rejectJob(job!.id, error);
    await expect(promise).rejects.toEqual(error);
  });
});
