import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Spinner } from "@shared/ui/spinner";

export type AddToCartButtonProps = {
  /** «Добавить в корзину», «Выберите размер», «Нет в наличии» */
  label: string;
  disabled?: boolean;
  /** Запрос идёт: спиннер рядом с текстом, повторно не нажать */
  pending?: boolean;
  onAdd: () => void;
  className?: string;
};

/** Кнопка покупки (Figma: Product detail — Add to Bag): чёрная, во всю ширину колонки. */
export function AddToCartButton({ label, disabled, pending, onAdd, className }: AddToCartButtonProps) {
  return (
    <Button
      type="button"
      size="xl"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      onClick={onAdd}
      className={cn("w-full", className)}
    >
      {pending ? <Spinner aria-hidden className="size-4" /> : null}
      {label}
    </Button>
  );
}
