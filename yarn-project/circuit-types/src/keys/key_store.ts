import {
  type AztecAddress,
  type Fr,
  type GrumpkinPrivateKey,
  type PartialAddress,
  type Point,
  type PublicKey,
} from '@aztec/circuits.js';

/**
 * Represents a secure storage for managing keys.
 */
export interface KeyStore {
  /**
   * Creates a new account from a randomly generated secret key.
   * @returns A promise that resolves to the newly created account's AztecAddress.
   */
  createAccount(): Promise<AztecAddress>;

  /**
   * Adds an account to the key store from the provided secret key.
   * @param sk - The secret key of the account.
   * @param partialAddress - The partial address of the account.
   * @returns The account's address.
   */
  addAccount(sk: Fr, partialAddress: PartialAddress): Promise<AztecAddress>;

  /**
   * Retrieves addresses of accounts stored in the key store.
   * @returns A Promise that resolves to an array of account addresses.
   */
  getAccounts(): Promise<AztecAddress[]>;

  /**
   * Gets the master nullifier public key for a given account.
   * @throws If the account does not exist in the key store.
   * @param account - The account address for which to retrieve the master nullifier public key.
   * @returns The master nullifier public key for the account.
   */
  getMasterNullifierPublicKey(account: AztecAddress): Promise<PublicKey>;

  /**
   * Gets the master incoming viewing public key for a given account.
   * @throws If the account does not exist in the key store.
   * @param account - The account address for which to retrieve the master incoming viewing public key.
   * @returns The master incoming viewing public key for the account.
   */
  getMasterIncomingViewingPublicKey(account: AztecAddress): Promise<PublicKey>;

  /**
   * Retrieves the master outgoing viewing key.
   * @throws If the account does not exist in the key store.
   * @param account - The account to retrieve the master outgoing viewing key for.
   * @returns A Promise that resolves to the master outgoing viewing key.
   */
  getMasterOutgoingViewingPublicKey(account: AztecAddress): Promise<PublicKey>;

  /**
   * Retrieves the master tagging key.
   * @throws If the account does not exist in the key store.
   * @param account - The account to retrieve the master tagging key for.
   * @returns A Promise that resolves to the master tagging key.
   */
  getMasterTaggingPublicKey(account: AztecAddress): Promise<PublicKey>;

  /**
   * Retrieves application nullifier secret key.
   * @throws If the account does not exist in the key store.
   * @param account - The account to retrieve the application nullifier secret key for.
   * @param app - The application address to retrieve the nullifier secret key for.
   * @returns A Promise that resolves to the application nullifier secret key.
   */
  getAppNullifierSecretKey(account: AztecAddress, app: AztecAddress): Promise<Fr>;

  /**
   * Retrieves application incoming viewing secret key.
   * @throws If the account does not exist in the key store.
   * @param account - The account to retrieve the application incoming viewing secret key for.
   * @param app - The application address to retrieve the incoming viewing secret key for.
   * @returns A Promise that resolves to the application incoming viewing secret key.
   */
  getAppIncomingViewingSecretKey(account: AztecAddress, app: AztecAddress): Promise<Fr>;

  /**
   * Retrieves application outgoing viewing secret key.
   * @throws If the account does not exist in the key store.
   * @param account - The account to retrieve the application outgoing viewing secret key for.
   * @param app - The application address to retrieve the outgoing viewing secret key for.
   * @returns A Promise that resolves to the application outgoing viewing secret key.
   */
  getAppOutgoingViewingSecretKey(account: AztecAddress, app: AztecAddress): Promise<Fr>;

  /**
   * Retrieves the master nullifier secret key (nsk_m) corresponding to the specified master nullifier public key
   * (Npk_m).
   * @throws If the provided public key is not associated with any of the registered accounts.
   * @param masterNullifierPublicKey - The master nullifier public key to get secret key for.
   * @returns A Promise that resolves to the master nullifier secret key.
   * @dev Used when feeding the master nullifier secret key to the kernel circuit for nullifier keys verification.
   */
  getMasterNullifierSecretKeyForPublicKey(masterNullifierPublicKey: PublicKey): Promise<GrumpkinPrivateKey>;

  /**
   * Retrieves the master incoming viewing secret key (ivsk_m) corresponding to the specified master incoming viewing
   * public key (Ivpk_m).
   * @throws If the provided public key is not associated with any of the registered accounts.
   * @param masterIncomingViewingPublicKey - The master nullifier public key to get secret key for.
   * @returns A Promise that resolves to the master nullifier secret key.
   * @dev Used when feeding the master nullifier secret key to the kernel circuit for nullifier keys verification.
   */
  getMasterIncomingViewingSecretKeyForPublicKey(masterIncomingViewingPublicKey: PublicKey): Promise<GrumpkinPrivateKey>;

  /**
   * Retrieves public keys hash of the account
   * @throws If the provided account address is not associated with any of the registered accounts.
   * @param account - The account address to get public keys hash for.
   * @returns A Promise that resolves to the public keys hash.
   */
  getPublicKeysHash(account: AztecAddress): Promise<Fr>;

  /**
   * This is used to register a recipient / for storing public keys of an address
   * @param accountAddress - The account address to store keys for.
   * @param masterNullifierPublicKey - The stored master nullifier public key
   * @param masterIncomingViewingPublicKey - The stored incoming viewing public key
   * @param masterOutgoingViewingPublicKey - The stored outgoing viewing public key
   * @param masterTaggingPublicKey - The stored master tagging public key
   */
  // TODO(#5834): Move this function out of here. Key store should only be used for accounts, not recipients
  addPublicKeysForAccount(
    accountAddress: AztecAddress,
    masterNullifierPublicKey: Point,
    masterIncomingViewingPublicKey: Point,
    masterOutgoingViewingPublicKey: Point,
    masterTaggingPublicKey: Point,
  ): Promise<void>;
}
