import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { CreateAccountView } from "./views/account/create.view.tsx";
import { TodosView } from "./views/todo/todos.view.tsx";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Index() {
    return <h3>Welcome Home!</h3>;
  },
});

const createAccountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: CreateAccountView,
});

const todosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  component: TodosView,
});

export const routeTree = rootRoute.addChildren([homeRoute, createAccountRoute, todosRoute]);
