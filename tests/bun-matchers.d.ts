import "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

declare module "bun:test" {
    interface Matchers<T> extends matchers.TestingLibraryMatchers<typeof expect.stringContaining, T> { }
    interface AsymmetricMatchers extends matchers.TestingLibraryMatchers<typeof expect.stringContaining, void> { }
}
