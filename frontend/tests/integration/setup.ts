import { beforeEach, vi } from "vitest";

import { cookieJar } from "../helpers/cookie-jar";

vi.mock("next/headers", () => import("../helpers/cookie-jar"));

// Каждый тест — новый посетитель без cookie
beforeEach(() => cookieJar.clear());
