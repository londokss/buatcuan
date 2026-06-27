export function normalizeIndonesianPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("62")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);

  return digits;
}

export function normalizeIndonesianPhoneNumber(value: string) {
  const nationalNumber = normalizeIndonesianPhoneInput(value);

  return nationalNumber ? `0${nationalNumber}` : "";
}
