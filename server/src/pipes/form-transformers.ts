import { TransformFnParams } from 'class-transformer';

export function nullableNumber({ value }: TransformFnParams): number | null {
  const input: unknown = value;
  return input === null || input === 'null' || input === ''
    ? null
    : Number(input);
}

export function formBoolean({ value }: TransformFnParams): unknown {
  const input: unknown = value;
  return input === 'true' ? true : input === 'false' ? false : input;
}

export function formTags({ value }: TransformFnParams): unknown {
  const input: unknown = value;
  if (typeof input !== 'string') return input;
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return input;
  }
}

export function nullableString({ value }: TransformFnParams): unknown {
  const input: unknown = value;
  return input === 'null' ? null : input;
}
