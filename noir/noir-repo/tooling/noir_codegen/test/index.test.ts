import { expect } from 'chai';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore File is codegenned at test time.
import { exported_function_foo, MyStruct, u64, ForeignCallHandler } from './codegen/index.js';

it('codegens a callable function', async () => {
  const my_struct = { foo: true, bar: ['12345', '12345', '12345'], baz: '0x00' };

  const [sum, constant, struct]: [u64, u64, MyStruct] = await exported_function_foo(
    '2',
    '3',
    [0, 0, 0, 0, 0],
    {
      foo: my_struct,
      bar: [my_struct, my_struct, my_struct],
      baz: '64',
    },
    '12345',
  );

  expect(sum).to.be.eq('0x05');
  expect(constant).to.be.eq('0x03');
  expect(struct).to.be.deep.eq(my_struct);
});

it('allows passing a custom foreign call handler', async () => {
  let observedName = '';
  let observedInputs: string[][] = [];
  const foreignCallHandler: ForeignCallHandler = async (name: string, inputs: string[][]) => {
    // Throwing inside the oracle callback causes a timeout so we log the observed values
    // and defer the check against expected values until after the execution is complete.
    observedName = name;
    observedInputs = inputs;

    return [];
  };

  const my_struct = { foo: true, bar: ['12345', '12345', '12345'], baz: '0x00' };

  const [sum, constant, struct]: [u64, u64, MyStruct] = await exported_function_foo(
    '2',
    '3',
    [0, 0, 0, 0, 0],
    {
      foo: my_struct,
      bar: [my_struct, my_struct, my_struct],
      baz: '64',
    },
    '12345',
    foreignCallHandler,
  );

  expect(observedName).to.be.eq('print');
  expect(observedInputs).to.be.deep.eq([
    // add newline?
    ['0x0000000000000000000000000000000000000000000000000000000000000000'],
    // x
    ['0x0000000000000000000000000000000000000000000000000000000000000002'],
    // Type metadata
    [
      '0x000000000000000000000000000000000000000000000000000000000000007b',
      '0x0000000000000000000000000000000000000000000000000000000000000022',
      '0x000000000000000000000000000000000000000000000000000000000000006b',
      '0x0000000000000000000000000000000000000000000000000000000000000069',
      '0x000000000000000000000000000000000000000000000000000000000000006e',
      '0x0000000000000000000000000000000000000000000000000000000000000064',
      '0x0000000000000000000000000000000000000000000000000000000000000022',
      '0x000000000000000000000000000000000000000000000000000000000000003a',
      '0x0000000000000000000000000000000000000000000000000000000000000022',
      '0x0000000000000000000000000000000000000000000000000000000000000075',
      '0x000000000000000000000000000000000000000000000000000000000000006e',
      '0x0000000000000000000000000000000000000000000000000000000000000073',
      '0x0000000000000000000000000000000000000000000000000000000000000069',
      '0x0000000000000000000000000000000000000000000000000000000000000067',
      '0x000000000000000000000000000000000000000000000000000000000000006e',
      '0x0000000000000000000000000000000000000000000000000000000000000065',
      '0x0000000000000000000000000000000000000000000000000000000000000064',
      '0x0000000000000000000000000000000000000000000000000000000000000069',
      '0x000000000000000000000000000000000000000000000000000000000000006e',
      '0x0000000000000000000000000000000000000000000000000000000000000074',
      '0x0000000000000000000000000000000000000000000000000000000000000065',
      '0x0000000000000000000000000000000000000000000000000000000000000067',
      '0x0000000000000000000000000000000000000000000000000000000000000065',
      '0x0000000000000000000000000000000000000000000000000000000000000072',
      '0x0000000000000000000000000000000000000000000000000000000000000022',
      '0x000000000000000000000000000000000000000000000000000000000000002c',
      '0x0000000000000000000000000000000000000000000000000000000000000022',
      '0x0000000000000000000000000000000000000000000000000000000000000077',
      '0x0000000000000000000000000000000000000000000000000000000000000069',
      '0x0000000000000000000000000000000000000000000000000000000000000064',
      '0x0000000000000000000000000000000000000000000000000000000000000074',
      '0x0000000000000000000000000000000000000000000000000000000000000068',
      '0x0000000000000000000000000000000000000000000000000000000000000022',
      '0x000000000000000000000000000000000000000000000000000000000000003a',
      '0x0000000000000000000000000000000000000000000000000000000000000036',
      '0x0000000000000000000000000000000000000000000000000000000000000034',
      '0x000000000000000000000000000000000000000000000000000000000000007d',
    ],
    // format string?
    ['0x0000000000000000000000000000000000000000000000000000000000000000'],
  ]);

  expect(sum).to.be.eq('0x05');
  expect(constant).to.be.eq('0x03');
  expect(struct).to.be.deep.eq(my_struct);
});