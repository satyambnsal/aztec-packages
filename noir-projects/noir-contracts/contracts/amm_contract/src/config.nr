use dep::aztec::protocol_types::{address::AztecAddress, traits::{Deserialize, Packable, Serialize}};
use std::meta::derive;

/// We store the tokens of the pool in a struct such that to load it from SharedImmutable asserts only a single
/// merkle proof.
/// (Once we actually do the optimization. WIP in https://github.com/AztecProtocol/aztec-packages/pull/8022).
#[derive(Deserialize, Packable, Serialize)]
pub struct Config {
    pub token0: AztecAddress,
    pub token1: AztecAddress,
    pub liquidity_token: AztecAddress,
}
