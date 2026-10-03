import Form from "next/form";
import type { ReactNode } from "react";

import { Icon } from "@shared/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/ui/input-group";

import { SEARCH_QUERY_MAX } from "../model/schemas";

export type SearchFieldProps = {
  /** Страница результатов: форма уходит туда GET-запросом ?q=… */
  action: string;
  /** Подпись поля для скринридеров */
  label: string;
  placeholder: string;
  /** Управляемое поле (панель с результатами на лету) */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Неуправляемое поле (страница поиска: текущий запрос из URL) */
  defaultValue?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  /** Справа от поля: кнопка закрытия панели, «Найти»… */
  trailing?: ReactNode;
  className?: string;
};

/**
 * Поле поиска (Figma: Search): иконка, крупный текст, без рамки.
 * next/form: без JS — обычная GET-форма с role="search", с JS — переход без перезагрузки страницы.
 */
export function SearchField({
  action,
  label,
  placeholder,
  value,
  onValueChange,
  defaultValue,
  onSubmit,
  autoFocus,
  trailing,
  className,
}: SearchFieldProps) {
  return (
    <Form action={action} role="search" onSubmit={onSubmit} data-slot="search-field" className={className}>
      <InputGroup className="h-auto gap-4 rounded-none border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:bg-transparent">
        <InputGroupAddon className="p-0 text-current">
          <Icon name="search" className="size-4.5" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="q"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={onValueChange && ((event) => onValueChange(event.target.value))}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="search"
          maxLength={SEARCH_QUERY_MAX}
          // Свой крестик браузера скрыт: закрытие / очистка — в trailing
          className="h-auto px-0 py-0.75 text-700 placeholder:text-muted-foreground md:text-700 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {trailing ? (
          <InputGroupAddon align="inline-end" className="gap-4 p-0 text-current">
            {trailing}
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </Form>
  );
}
