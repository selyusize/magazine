import Image from "next/image";
import Link from "next/link";

export type HeaderLogoProps = {
  src: string;
  width: number;
  height: number;
  /** Название магазина — текст ссылки для поисковиков и скринридеров */
  alt: string;
  href: string;
  /** Одноцветный тёмный логотип становится светлым в тёмной теме */
  invertInDark?: boolean;
};

/** Логотип-ссылка на главную. Не h1: заголовок страницы задаёт сама страница. */
export function HeaderLogo({ src, width, height, alt, href, invertInDark }: HeaderLogoProps) {
  return (
    <Link href={href} data-slot="header-logo" className="block">
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        loading="eager"
        className={invertInDark ? "dark:invert" : undefined}
      />
    </Link>
  );
}
