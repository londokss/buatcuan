import { describe, it, expect } from "vitest";
import {
  normalizeIndonesianPhoneInput,
  normalizeIndonesianPhoneNumber,
} from "@/lib/phone";

describe("normalizeIndonesianPhoneInput", () => {
  it("strips leading 0", () => {
    expect(normalizeIndonesianPhoneInput("08123456789")).toBe("8123456789");
  });

  it("strips country code 62", () => {
    expect(normalizeIndonesianPhoneInput("628123456789")).toBe("8123456789");
  });

  it("strips country code with plus prefix", () => {
    expect(normalizeIndonesianPhoneInput("+628123456789")).toBe("8123456789");
  });

  it("returns digits unchanged when already a national number", () => {
    expect(normalizeIndonesianPhoneInput("8123456789")).toBe("8123456789");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeIndonesianPhoneInput("")).toBe("");
  });

  it("strips non-digit characters", () => {
    expect(normalizeIndonesianPhoneInput("0812-345-6789")).toBe("8123456789");
  });
});

describe("normalizeIndonesianPhoneNumber", () => {
  it("returns number with leading 0", () => {
    expect(normalizeIndonesianPhoneNumber("08123456789")).toBe("08123456789");
  });

  it("converts country code 62 to 0-prefix format", () => {
    expect(normalizeIndonesianPhoneNumber("628123456789")).toBe("08123456789");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeIndonesianPhoneNumber("")).toBe("");
  });
});
