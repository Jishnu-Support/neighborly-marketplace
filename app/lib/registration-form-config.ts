import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultRegistrationFormConfig, type RegistrationFormConfig, type RegistrationForm } from "./registration-form-config.shared";

const configPath = process.env.NEIGHBORLY_REGISTRATION_FORM_CONFIG_STORE || path.join(process.cwd(), ".neighborly-registration-forms.json");
export function validateRegistrationFormConfig(input: unknown): input is RegistrationFormConfig {
  if (!input || typeof input !== "object" || !Array.isArray((input as RegistrationFormConfig).forms)) return false;
  const forms = (input as RegistrationFormConfig).forms;
  const coreForms = new Set(["customer", "business", "agent", "companyAdmin"]);
  if (forms.length < 4 || forms.length > 12 || new Set(forms.map((form) => form.id)).size !== forms.length || [...coreForms].some((id) => !forms.some((form) => form.id === id))) return false;
  return forms.every((form) => form && /^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(form.id) && typeof form.title === "string" && form.title.trim().length > 0 && form.title.length <= 80 && typeof form.enabled === "boolean" && Array.isArray(form.fields) && form.fields.length <= 80 && new Set(form.fields.map((item) => item.id)).size === form.fields.length && form.fields.every((item) => item && /^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/.test(item.id) && typeof item.label === "string" && item.label.trim().length > 0 && item.label.length <= 100 && ["text", "phone", "email", "password", "textarea", "checkbox", "choices"].includes(item.type) && typeof item.placeholder === "string" && item.placeholder.length <= 160 && typeof item.required === "boolean" && typeof item.enabled === "boolean" && Array.isArray(item.options) && item.options.length <= 100 && new Set(item.options.map((option) => option.id)).size === item.options.length && item.options.every((option) => option && /^[a-zA-Z0-9_-]{1,50}$/.test(option.id) && typeof option.label === "string" && option.label.trim().length > 0 && option.label.length <= 100 && typeof option.enabled === "boolean")));
}
export async function readRegistrationFormConfig(): Promise<RegistrationFormConfig> {
  try { const parsed = JSON.parse(await readFile(configPath, "utf8")) as unknown; return validateRegistrationFormConfig(parsed) ? parsed : defaultRegistrationFormConfig; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; return defaultRegistrationFormConfig; }
}
export async function saveRegistrationFormConfig(config: RegistrationFormConfig) {
  const normalized: RegistrationFormConfig = { forms: config.forms.map((form) => ({ ...form, title: form.title.trim(), fields: form.fields.map((item) => ({ ...item, label: item.label.trim(), placeholder: item.placeholder.trim(), options: item.options.map((option) => ({ ...option, label: option.label.trim() })) })) })) as RegistrationForm[] };
  await mkdir(path.dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(normalized, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporaryPath, configPath);
  return normalized;
}
