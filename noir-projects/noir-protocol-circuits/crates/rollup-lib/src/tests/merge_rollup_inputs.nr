use crate::merge::MergeRollupInputs;
use crate::tests::previous_rollup_data::default_previous_rollup_data;
use dep::types::traits::Empty;

pub fn default_merge_rollup_inputs() -> MergeRollupInputs {
    let mut inputs = MergeRollupInputs::empty();

    inputs.previous_rollup_data = default_previous_rollup_data([1], [2]);

    inputs
}
