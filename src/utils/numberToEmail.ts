const SYNTH_DOMAIN = "abs-login.local";
export const digitsOnly = (s: string) => (s || "").replace(/\D/g, "");
export const numberToEmail = (n: string) => `${digitsOnly(n)}@${SYNTH_DOMAIN}`.toLowerCase();
export const emailToNumber = (email?: string | null) =>
  digitsOnly((email || "").split("@")[0]);
