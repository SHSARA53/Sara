import { describe, expect, it } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { AppStateProvider, useAppState } from "./AppStateContext";

function LanguageProbe() {
  const { state, updateSettings, ready } = useAppState();
  if (!ready) return <span>loading</span>;
  return (
    <div>
      <span data-testid="lang">{state.settings.language}</span>
      <button onClick={() => updateSettings({ language: state.settings.language === "he" ? "en" : "he" })}>toggle</button>
    </div>
  );
}

describe("AppStateProvider language / RTL wiring", () => {
  it("defaults to Hebrew with an RTL document direction", async () => {
    render(
      <AppStateProvider>
        <LanguageProbe />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("lang")).toHaveTextContent("he"));
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("he");
  });

  it("switches the document direction to LTR when the language changes to English", async () => {
    render(
      <AppStateProvider>
        <LanguageProbe />
      </AppStateProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("lang")).toHaveTextContent("he"));

    act(() => {
      screen.getByText("toggle").click();
    });

    await waitFor(() => expect(screen.getByTestId("lang")).toHaveTextContent("en"));
    expect(document.documentElement.dir).toBe("ltr");
  });
});
