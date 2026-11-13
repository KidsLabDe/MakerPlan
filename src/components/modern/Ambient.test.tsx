import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Ambient } from "./Ambient";

describe("Ambient", () => {
  it("should render nothing between scenes", () => {
    render(<Ambient show={null} />);
    expect(screen.getByTestId("ambient")).toBeEmptyDOMElement();
  });

  it("should send the bug cable and the ZEFIX! monster after it", () => {
    const { container } = render(<Ambient show={{ scene: "bugJagd", slot: 4, elapsed: 3 }} />);
    expect(container.querySelector(".ambient__actor--bug")).not.toBeNull();
    expect(container.querySelector(".ambient__actor--chaser")).not.toBeNull();
  });

  it("should start the keyframes as far in as the scene already ran", () => {
    const { container } = render(<Ambient show={{ scene: "servus", slot: 1, elapsed: 4 }} />);
    const scene = container.querySelector<HTMLElement>(".ambient__scene--servus");
    expect(scene?.style.getPropertyValue("--ambient-delay")).toBe("-4s");
    expect(scene?.style.getPropertyValue("--ambient-len")).toBe("12s");
  });

  it("should stay hidden from screen readers", () => {
    render(<Ambient show={{ scene: "hae", slot: 0, elapsed: 0 }} />);
    expect(screen.getByTestId("ambient")).toHaveAttribute("aria-hidden", "true");
  });
});
