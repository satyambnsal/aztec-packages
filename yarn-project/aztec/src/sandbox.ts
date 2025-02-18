#!/usr/bin/env -S node --no-warnings
import { type AztecNodeConfig, AztecNodeService, getConfigEnvVars } from '@aztec/aztec-node';
import { AnvilTestWatcher, EthCheatCodes, SignerlessWallet } from '@aztec/aztec.js';
import { DefaultMultiCallEntrypoint } from '@aztec/aztec.js/entrypoint';
import { type BlobSinkClientInterface, createBlobSinkClient } from '@aztec/blob-sink/client';
import { type AztecNode } from '@aztec/circuit-types';
import { setupCanonicalL2FeeJuice } from '@aztec/cli/setup-contracts';
import {
  NULL_KEY,
  createEthereumChain,
  deployL1Contracts,
  getL1ContractsConfigEnvVars,
  waitForPublicClient,
} from '@aztec/ethereum';
import { createLogger } from '@aztec/foundation/log';
import { getVKTreeRoot } from '@aztec/noir-protocol-circuits-types/vks';
import { ProtocolContractAddress, protocolContractTreeRoot } from '@aztec/protocol-contracts';
import { type PXEServiceConfig, createPXEService, getPXEServiceConfig } from '@aztec/pxe';
import {
  type TelemetryClient,
  getConfigEnvVars as getTelemetryClientConfig,
  initTelemetryClient,
} from '@aztec/telemetry-client';

import { type HDAccount, type PrivateKeyAccount, createPublicClient, http as httpViemTransport } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';

import { DefaultMnemonic } from './mnemonic.js';

const logger = createLogger('sandbox');

const localAnvil = foundry;

/**
 * Function to deploy our L1 contracts to the sandbox L1
 * @param aztecNodeConfig - The Aztec Node Config
 * @param hdAccount - Account for publishing L1 contracts
 */
export async function deployContractsToL1(
  aztecNodeConfig: AztecNodeConfig,
  hdAccount: HDAccount | PrivateKeyAccount,
  contractDeployLogger = logger,
  opts: { assumeProvenThroughBlockNumber?: number; salt?: number } = {},
) {
  const chain = aztecNodeConfig.l1RpcUrl
    ? createEthereumChain(aztecNodeConfig.l1RpcUrl, aztecNodeConfig.l1ChainId)
    : { chainInfo: localAnvil };

  await waitForPublicClient(aztecNodeConfig);

  const l1Contracts = await deployL1Contracts(
    aztecNodeConfig.l1RpcUrl,
    hdAccount,
    chain.chainInfo,
    contractDeployLogger,
    {
      ...getL1ContractsConfigEnvVars(), // TODO: We should not need to be loading config from env again, caller should handle this
      ...aztecNodeConfig,
      l2FeeJuiceAddress: ProtocolContractAddress.FeeJuice,
      vkTreeRoot: await getVKTreeRoot(),
      protocolContractTreeRoot,
      assumeProvenThrough: opts.assumeProvenThroughBlockNumber,
      salt: opts.salt,
    },
  );

  aztecNodeConfig.l1Contracts = l1Contracts.l1ContractAddresses;

  return aztecNodeConfig.l1Contracts;
}

/** Sandbox settings. */
export type SandboxConfig = AztecNodeConfig & {
  /** Mnemonic used to derive the L1 deployer private key.*/
  l1Mnemonic: string;
  /** Salt used to deploy L1 contracts.*/
  l1Salt: string;
};

/**
 * Create and start a new Aztec Node and PXE. Deploys L1 contracts.
 * Does not start any HTTP services nor populate any initial accounts.
 * @param config - Optional Sandbox settings.
 */
export async function createSandbox(config: Partial<SandboxConfig> = {}) {
  const aztecNodeConfig: AztecNodeConfig = { ...getConfigEnvVars(), ...config };
  const hdAccount = mnemonicToAccount(config.l1Mnemonic || DefaultMnemonic);
  if (!aztecNodeConfig.publisherPrivateKey || aztecNodeConfig.publisherPrivateKey === NULL_KEY) {
    const privKey = hdAccount.getHdKey().privateKey;
    aztecNodeConfig.publisherPrivateKey = `0x${Buffer.from(privKey!).toString('hex')}`;
  }
  if (!aztecNodeConfig.validatorPrivateKey || aztecNodeConfig.validatorPrivateKey === NULL_KEY) {
    const privKey = hdAccount.getHdKey().privateKey;
    aztecNodeConfig.validatorPrivateKey = `0x${Buffer.from(privKey!).toString('hex')}`;
  }

  let watcher: AnvilTestWatcher | undefined = undefined;
  if (!aztecNodeConfig.p2pEnabled) {
    const l1ContractAddresses = await deployContractsToL1(aztecNodeConfig, hdAccount, undefined, {
      assumeProvenThroughBlockNumber: Number.MAX_SAFE_INTEGER,
      salt: config.l1Salt ? parseInt(config.l1Salt) : undefined,
    });

    const chain = aztecNodeConfig.l1RpcUrl
      ? createEthereumChain(aztecNodeConfig.l1RpcUrl, aztecNodeConfig.l1ChainId)
      : { chainInfo: localAnvil };

    const publicClient = createPublicClient({
      chain: chain.chainInfo,
      transport: httpViemTransport(aztecNodeConfig.l1RpcUrl),
    });

    watcher = new AnvilTestWatcher(
      new EthCheatCodes(aztecNodeConfig.l1RpcUrl),
      l1ContractAddresses.rollupAddress,
      publicClient,
    );
    await watcher.start();
  }

  const telemetry = initTelemetryClient(getTelemetryClientConfig());
  // Create a local blob sink client inside the sandbox, no http connectivity
  const blobSinkClient = createBlobSinkClient();
  const node = await createAztecNode(aztecNodeConfig, { telemetry, blobSinkClient });
  const pxe = await createAztecPXE(node);

  await setupCanonicalL2FeeJuice(
    new SignerlessWallet(pxe, new DefaultMultiCallEntrypoint(aztecNodeConfig.l1ChainId, aztecNodeConfig.version)),
    aztecNodeConfig.l1Contracts.feeJuicePortalAddress,
    undefined,
    logger.info,
  );

  const stop = async () => {
    await node.stop();
    await watcher?.stop();
  };

  return { node, pxe, aztecNodeConfig, stop };
}

/**
 * Create and start a new Aztec RPC HTTP Server
 * @param config - Optional Aztec node settings.
 */
export async function createAztecNode(
  config: Partial<AztecNodeConfig> = {},
  deps: { telemetry?: TelemetryClient; blobSinkClient?: BlobSinkClientInterface } = {},
) {
  const aztecNodeConfig: AztecNodeConfig = { ...getConfigEnvVars(), ...config };
  const node = await AztecNodeService.createAndSync(aztecNodeConfig, deps);
  return node;
}

/**
 * Create and start a new Aztec PXE HTTP Server
 * @param config - Optional PXE settings.
 */
export async function createAztecPXE(node: AztecNode, config: Partial<PXEServiceConfig> = {}) {
  const pxeServiceConfig: PXEServiceConfig = { ...getPXEServiceConfig(), ...config };
  const pxe = await createPXEService(node, pxeServiceConfig);
  return pxe;
}
