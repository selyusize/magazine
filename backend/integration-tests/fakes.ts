import type { Logger } from "@medusajs/framework/types";

/**
 * Логгер Medusa для unit-тестов: все методы — `jest.fn()`, поэтому можно проверять вызовы, а тип — полный
 * `Logger` без приведений.
 */
export function fakeLogger() {
  return {
    panic: jest.fn(),
    shouldLog: jest.fn(() => true),
    setLogLevel: jest.fn(),
    unsetLogLevel: jest.fn(),
    activity: jest.fn(() => ""),
    progress: jest.fn(),
    error: jest.fn(),
    failure: jest.fn(),
    success: jest.fn(() => ({})),
    silly: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    http: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  } satisfies Logger;
}
