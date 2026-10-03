import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Icon } from "@shared/ui/icon";

export type WishlistButtonProps = {
  active: boolean;
  onToggle: () => void;
  /** Название товара — в подпись кнопки для скринридеров */
  title: string;
  className?: string;
};

/** Сердечко «В избранное»: контур — нет в избранном, заливка — есть. */
export function WishlistButton({ active, onToggle, title, className }: WishlistButtonProps) {
  return (
    <Button
      type="button"
      variant="bare"
      size="bare"
      aria-pressed={active}
      aria-label={`${title}: в избранное`}
      onClick={onToggle}
      className={cn("relative after:absolute after:-inset-2", className)}
    >
      <Icon name={active ? "heart-fill" : "heart"} className="size-5" />
    </Button>
  );
}
