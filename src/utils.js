export function isFalseValue(value) {
  return (
    value === null ||
    value === undefined ||
    value === NaN ||
    value === false ||
    value === 0 ||
    value === '' ||
    value.length === 0
  );
}
