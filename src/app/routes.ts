import { createBrowserRouter } from "react-router";
import Root from "./Root";
import PublicCoachPage from "./PublicCoachPage";
import DashboardLayout from "./DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Services from "./pages/Services";
import Availability from "./pages/Availability";
import Bookings from "./pages/Bookings";
import LoginAdmin from "./pages/admin/LoginAdmin";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import CalendarView from "./pages/admin/CalendarView";
import UsersView from "./pages/admin/UsersView";
import ServicesManagement from "./pages/admin/ServicesManagement";
import ProfileSettings from "./pages/admin/ProfileSettings";
import UserDetail from "./pages/admin/UserDetail";
import NewClient from "./pages/admin/NewClient";
import BookingDetail from "./pages/admin/BookingDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: PublicCoachPage },
      {
        path: "dashboard",
        Component: DashboardLayout,
        children: [
          { index: true, Component: DashboardHome },
          { path: "services", Component: Services },
          { path: "availability", Component: Availability },
          { path: "bookings", Component: Bookings },
        ],
      },
    ],
  },
  {
    path: "/admin/login",
    Component: LoginAdmin,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "calendar", Component: CalendarView },
      { path: "users", Component: UsersView },
      { path: "users/new", Component: NewClient },
      { path: "users/:id", Component: UserDetail },
      { path: "bookings/:id", Component: BookingDetail },
      { path: "services", Component: ServicesManagement },
      { path: "profile", Component: ProfileSettings },
    ],
  },
  {
    path: "/admin/users/:id",
    Component: UserDetail,
  },
]);
