"use client";

import { NewsletterFormView, type NewsletterFormContent } from "../ui/newsletter-form";
import { useNewsletterForm, type UseNewsletterFormOptions } from "./use-newsletter-form";

export type NewsletterFormProps = NewsletterFormContent & UseNewsletterFormOptions;

// Связка: логика из model + «тупое» представление из ui. Тексты передаёт место использования (футер, баннер, попап).
export function NewsletterForm({ onSubscribed, ...content }: NewsletterFormProps) {
  return <NewsletterFormView {...content} {...useNewsletterForm({ onSubscribed })} />;
}
