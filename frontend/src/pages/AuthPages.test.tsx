import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./AuthPages";

vi.mock("../state/AppState", () => ({
  useAppState: () => ({
    loginWithToken: vi.fn(),
    setRole: vi.fn(),
    setCurrentUser: vi.fn()
  })
}));

afterEach(() => {
  cleanup();
});

describe("LoginPage", () => {
  it("uses the Mathematical Sciences department label", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><LoginPage /></MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Mathematical Sciences/)).toBeInTheDocument();
    expect(screen.queryByText("Applied Mathematics")).not.toBeInTheDocument();
  });
});
