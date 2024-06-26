// TODO(https://github.com/noir-lang/noir/issues/4932): rename this file to something more generic
use acir::{
    circuit::opcodes::FunctionInput,
    native_types::{Witness, WitnessMap},
};
use acvm_blackbox_solver::BlackBoxFunctionSolver;

use crate::pwg::{insert_value, witness_to_value, OpcodeResolutionError};

pub(super) fn fixed_base_scalar_mul(
    backend: &impl BlackBoxFunctionSolver,
    initial_witness: &mut WitnessMap,
    low: FunctionInput,
    high: FunctionInput,
    outputs: (Witness, Witness),
) -> Result<(), OpcodeResolutionError> {
    let low = witness_to_value(initial_witness, low.witness)?;
    let high = witness_to_value(initial_witness, high.witness)?;

    let (pub_x, pub_y) = backend.fixed_base_scalar_mul(low, high)?;

    insert_value(&outputs.0, pub_x, initial_witness)?;
    insert_value(&outputs.1, pub_y, initial_witness)?;

    Ok(())
}

pub(super) fn variable_base_scalar_mul(
    backend: &impl BlackBoxFunctionSolver,
    initial_witness: &mut WitnessMap,
    point_x: FunctionInput,
    point_y: FunctionInput,
    scalar_low: FunctionInput,
    scalar_high: FunctionInput,
    outputs: (Witness, Witness),
) -> Result<(), OpcodeResolutionError> {
    let point_x = witness_to_value(initial_witness, point_x.witness)?;
    let point_y = witness_to_value(initial_witness, point_y.witness)?;
    let scalar_low = witness_to_value(initial_witness, scalar_low.witness)?;
    let scalar_high = witness_to_value(initial_witness, scalar_high.witness)?;

    let (out_point_x, out_point_y) =
        backend.variable_base_scalar_mul(point_x, point_y, scalar_low, scalar_high)?;

    insert_value(&outputs.0, out_point_x, initial_witness)?;
    insert_value(&outputs.1, out_point_y, initial_witness)?;

    Ok(())
}

pub(super) fn embedded_curve_add(
    backend: &impl BlackBoxFunctionSolver,
    initial_witness: &mut WitnessMap,
    input1_x: FunctionInput,
    input1_y: FunctionInput,
    input2_x: FunctionInput,
    input2_y: FunctionInput,
    outputs: (Witness, Witness),
) -> Result<(), OpcodeResolutionError> {
    let input1_x = witness_to_value(initial_witness, input1_x.witness)?;
    let input1_y = witness_to_value(initial_witness, input1_y.witness)?;
    let input2_x = witness_to_value(initial_witness, input2_x.witness)?;
    let input2_y = witness_to_value(initial_witness, input2_y.witness)?;
    let (res_x, res_y) = backend.ec_add(input1_x, input1_y, input2_x, input2_y)?;

    insert_value(&outputs.0, res_x, initial_witness)?;
    insert_value(&outputs.1, res_y, initial_witness)?;

    Ok(())
}
