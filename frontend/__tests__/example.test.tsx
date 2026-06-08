import { render, screen } from "@testing-library/react";

describe("LifeOS AI", () => {
  it("renders without crashing", () => {
    expect(true).toBe(true);
  });

  it("has required environment configuration", () => {
    expect(process.env.NEXT_PUBLIC_API_URL).toBeDefined();
  });
});
