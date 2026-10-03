/**
 * Структурированные данные schema.org. Данные — из shared/lib/structured-data.
 * `<` экранируется: строка из CMS с «</script>» не закроет тег раньше времени.
 */
export function JsonLd({ data, nonce }: { data: object; nonce?: string }) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
