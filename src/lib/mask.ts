export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "—";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11) {
    return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
  return "***" + cpf.slice(-3);
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 8) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}****-${digits.slice(-4)}`;
  }
  return phone.slice(0, 2) + "****" + phone.slice(-2);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return email.slice(0, 2) + "****";
  const maskedLocal =
    local.length > 2 ? local.slice(0, 2) + "***" : local[0] + "***";
  return `${maskedLocal}@${domain}`;
}

export function maskCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return "—";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length === 14) {
    return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/****-**`;
  }
  return "**" + cnpj.slice(-4);
}

export function maskCpfCnpj(value: string | null | undefined, type?: string): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (type === "PJ" || digits.length === 14) return maskCnpj(value);
  return maskCpf(value);
}
