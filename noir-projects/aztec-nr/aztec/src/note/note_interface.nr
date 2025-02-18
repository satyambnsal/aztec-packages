use crate::context::PrivateContext;
use crate::note::note_header::NoteHeader;
use dep::protocol_types::traits::Empty;

pub trait NoteProperties<T> {
    fn properties() -> T;
}

pub trait PartialNote<S, F>
where
    S: Empty,
    F: Empty,
{
    fn setup_payload() -> S;

    fn finalization_payload() -> F;
}

pub trait NullifiableNote {
    /// Returns the non-siloed nullifier, which will be later siloed by contract address by the kernels before being
    /// committed to the state tree.
    ///
    /// This function MUST be called with the correct note hash for consumption! It will otherwise silently fail and
    /// compute an incorrect value. The reason why we receive this as an argument instead of computing it ourselves
    /// directly is because the caller will typically already have computed this note hash, and we can reuse that value
    /// to reduce the total gate count of the circuit.
    ///
    /// This function receives the context since nullifier computation typically involves proving nullifying keys, and
    /// we require the kernel's assistance to do this in order to prevent having to reveal private keys to application
    /// circuits.
    fn compute_nullifier(self, context: &mut PrivateContext, note_hash_for_nullify: Field) -> Field;

    /// Same as compute_nullifier, but unconstrained. This version does not take a note hash because it'll only be
    /// invoked in unconstrained contexts, where there is no gate count.
    unconstrained fn compute_nullifier_without_context(self) -> Field;
}

// docs:start:note_interface
// Autogenerated by the #[note] macro
pub trait NoteInterface<let N: u32> {
    fn pack_content(self) -> [Field; N];

    fn unpack_content(fields: [Field; N]) -> Self;

    fn get_header(self) -> NoteHeader;

    fn set_header(&mut self, header: NoteHeader) -> ();

    fn get_note_type_id() -> Field;

    /// Returns the non-siloed note hash, i.e. the inner hash computed by the contract during private execution. Note
    /// hashes are later siloed by contract address and nonce by the kernels before being committed to the state tree.
    ///
    /// This should be a commitment to the note contents, including the storage slot (for indexing) and some random
    /// value (to prevent brute force trial-hashing attacks).
    fn compute_note_hash(self) -> Field;
}
// docs:end:note_interface
