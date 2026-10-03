import Link from "next/link";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Icon } from "@shared/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/ui/input-group";

import { hitArea } from "./classes";

export type HeaderSearchProps = {
  /** icon — ссылка на страницу поиска, field — поле ввода прямо в хедере */
  variant: "icon" | "field";
  /** Страница результатов: форма отправляет туда GET ?q=… */
  action: string;
  label?: string;
  placeholder?: string;
};

/** Поиск работает без JS: обычная ссылка или GET-форма с role="search". */
export function HeaderSearch({ variant, action, label = "Поиск", placeholder = "Поиск" }: HeaderSearchProps) {
  if (variant === "icon") {
    return (
      <Button asChild variant="bare" size="bare" className={cn("hover:opacity-60", hitArea)}>
        <Link href={action} aria-label={label} data-slot="header-search">
          <Icon name="search" />
        </Link>
      </Button>
    );
  }

  return (
    <form role="search" action={action} method="get" data-slot="header-search">
      {/* Стиль макета: только нижняя линия, при фокусе — цвета текста */}
      <InputGroup className="h-auto gap-2 rounded-none border-x-0 border-t-0 has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:bg-transparent">
        <InputGroupAddon className="p-0 text-current">
          <Icon name="search" />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          name="q"
          aria-label={label}
          placeholder={placeholder}
          className="h-auto w-28 flex-none px-0 py-1 text-300 md:w-44 md:text-300"
        />
      </InputGroup>
    </form>
  );
}
