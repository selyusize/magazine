import type { Definition } from "../shared/container";
import smtp from "./common/smtp";

/** Определения всех модулей. Новый модуль — новый файл в ./common и строка здесь. */
export const dependencies: Definition<unknown>[] = [...smtp];
