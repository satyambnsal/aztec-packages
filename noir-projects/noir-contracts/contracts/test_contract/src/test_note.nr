use dep::aztec::{
    note::{note_header::NoteHeader, note_interface::NoteInterface}, hash::pedersen_hash,
    context::PrivateContext
};

global TEST_NOTE_LEN: Field = 1;

// A note which stores a field and is expected to be passed around using the `addNote` function.
// WARNING: This Note is not private as it does not contain randomness and hence it can be easy to perform 
// serialized_note attack on it. This note has been developed purely for testing purposes so that it can easily be
// manually added to PXE. Do not use for real applications.
#[aztec(note)]
struct TestNote {
    value: Field,
}

impl NoteInterface<TEST_NOTE_LEN> for TestNote {

    fn compute_nullifier(self, _context: &mut PrivateContext) -> Field {
        // This note is expected to be shared between users and for this reason can't be nullified using a secret.
        0
    }

    fn compute_nullifier_without_context(self) -> Field {
        // This note is expected to be shared between users and for this reason can't be nullified using a secret.
        0
    }

    fn broadcast(self, context: &mut PrivateContext, slot: Field) {
        assert(
            false, "TestNote does not support broadcast. Add it to PXE directly using the `.addNote` function."
        );
    }
}

impl TestNote {
    pub fn new(value: Field) -> Self {
        TestNote { value, header: NoteHeader::empty() }
    }
}
