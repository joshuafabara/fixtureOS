import { z } from "zod";

// Digits only, 10-15 chars, country code included (e.g. 593998375914)
export const WHATSAPP_REGEX = /^[0-9]{10,15}$/;

export const whatsappSchema = z
  .string()
  .regex(
    WHATSAPP_REGEX,
    "El número debe incluir código de país + número, solo dígitos. Ejemplo: 593998375914"
  )
  .nullable()
  .optional();

export function validateWhatsapp(value: string | null | undefined): boolean {
  if (!value) return true; // null/undefined is valid (no number set)
  return WHATSAPP_REGEX.test(value);
}
