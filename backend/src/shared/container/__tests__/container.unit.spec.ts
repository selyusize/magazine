import type { MedusaContainer } from "@medusajs/framework/types";
import { createMedusaContainer } from "@medusajs/framework/utils";

import { createContainer, define } from "../container";
import { Injectable, InjectContainer } from "../injectable";

class Config {
  constructor(readonly name: string) {}
}

@Injectable()
class Repository {
  constructor(
    readonly config: Config,
    @InjectContainer() readonly container: MedusaContainer,
  ) {}
}

@Injectable()
class Service {
  constructor(readonly repository: Repository) {}
}

abstract class Mailer {
  abstract send(): string;
}

class FakeMailer extends Mailer {
  send(): string {
    return "fake";
  }
}

@Injectable()
class Notifier {
  constructor(readonly mailer: Mailer) {}
}

@Injectable()
class WithPrimitive {
  constructor(readonly name: string) {}
}

const medusa: MedusaContainer = createMedusaContainer();

describe("Container", () => {
  const Container = createContainer([
    define(Config, () => new Config("shop")),
    define(Mailer, () => new FakeMailer()),
  ]);

  it("собирает классы по типам параметров конструктора", () => {
    const service = Container.from(medusa).get(Service);

    expect(service.repository.config.name).toBe("shop");
    expect(service.repository.container).toBe(medusa);
  });

  it("подставляет реализацию абстрактного класса из define", () => {
    expect(Container.from(medusa).get(Notifier).mailer.send()).toBe("fake");
  });

  it("внутри области — один экземпляр, в новой области — новый", () => {
    const scope = Container.from(medusa);
    expect(scope.get(Service).repository).toBe(scope.get(Repository));
    expect(Container.from(medusa).get(Repository)).not.toBe(
      scope.get(Repository),
    );
  });

  it("объясняет, почему не может собрать класс", () => {
    expect(() => Container.from(medusa).get(WithPrimitive)).toThrow(
      "параметр #1 не класс",
    );
  });

  it("находит циклическую зависимость", () => {
    const Cyclic = createContainer([
      define(Config, ({ get }) => get(Repository).config),
    ]);
    expect(() => Cyclic.from(medusa).get(Repository)).toThrow(
      "циклическая зависимость",
    );
  });
});
