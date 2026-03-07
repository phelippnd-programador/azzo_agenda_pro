export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const maskCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

export const maskCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const maskCpfCnpj = (value: string) => {
  const digits = onlyDigits(value);
  return digits.length <= 11 ? maskCpf(digits) : maskCnpj(digits);
};

export const maskPhoneBr = (value: string, visible = true) => {
  const digits = onlyDigits(value);

  if (!visible) {
    if (!digits) return value;
    if (digits.length <= 8) return digits;
    const prefix = digits.slice(0, 5);
    const suffix = digits.slice(-3);
    return `${prefix}****${suffix}`;
  }

  const localDigits = digits.slice(0, 11);
  if (localDigits.length <= 10) {
    return localDigits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return localDigits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

export const maskCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
};

export const maskCardNumber = (value: string) => {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

export const maskCardMonth = (value: string) => onlyDigits(value).slice(0, 2);

export const maskCardYear = (value: string) => onlyDigits(value).slice(0, 4);

export const maskCardCvv = (value: string) => onlyDigits(value).slice(0, 4);
