import Image from "next/image";

import { siteConfig } from "@shared/config";

/** Вторая колонка форм входа/регистрации (блоки shadcn login-04 / signup-04). */
export function AuthImage() {
  return (
    <div className="relative hidden bg-muted md:block">
      <Image
        src={siteConfig.auth.image}
        alt=""
        fill
        unoptimized
        className="object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  );
}
