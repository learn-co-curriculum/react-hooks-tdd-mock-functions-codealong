import { coinFlip } from "../utils";

describe("coinFlip", () => {
  it("returns false when the random value is less than or equal to 0.5", () => {
    expect(coinFlip()).toBe(false);
  });
});
