import { createContainer } from "@shared/container";
import { dependencies } from "./dependencies";

/**
 * Контейнер приложения. `Container.from(container).get(Class)` — в подписчиках и jobs,
 * где `container` — контейнер Medusa из аргументов.
 */
export const Container = createContainer(dependencies);
