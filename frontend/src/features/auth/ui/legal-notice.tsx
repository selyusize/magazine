import Link from "next/link";

import { routes } from "@shared/config";
import { FieldDescription } from "@shared/ui/field";

export function LegalNotice({ action }: { action: string }) {
  return (
    <FieldDescription className="px-6 text-center">
      Нажимая «{action}», вы соглашаетесь с <Link href={routes.terms}>пользовательским соглашением</Link> и{" "}
      <Link href={routes.privacy}>политикой конфиденциальности</Link>.
    </FieldDescription>
  );
}
