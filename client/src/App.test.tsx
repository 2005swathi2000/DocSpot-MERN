import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import App from "./App";
import Login from "./views/Login";
import { store } from "./redux/store";

describe("DocSpot Frontend Client Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("initializes Redux store with default auth state", () => {
    const state = store.getState();
    expect(state.auth).toBeDefined();
    expect(state.alerts).toBeDefined();
    expect(state.api).toBeDefined();
  });

  test("renders Login view with Email, Password inputs and Login button", () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/login"]}>
          <Login />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const loginButton = screen.getByRole("button", { name: /login/i });
    const signupLink = screen.getByText(/create a new account/i);

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
    expect(signupLink).toBeInTheDocument();
  });

  test("renders root App within Redux Provider without crashing", () => {
    const { container } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(container).toBeDefined();
  });
});
