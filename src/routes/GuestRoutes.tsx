import { lazy } from "react";
import SignIn from "../screens/auth/SignIn";

const Splash = lazy(() => import("../screens/auth/Splash"));
const Signup = lazy(() => import("../screens/auth/SignUp"));
const ExploreBenefits = lazy(() => import("../screens/benefit/Benefits"));
const BenefitsDetails = lazy(() => import("../screens/benefit/Details"));

const routes = [
  {
    path: "/signup",
    component: Signup,
  },
  {
    path: "/explorebenefits",
    component: ExploreBenefits,
  },
  {
    path: "/benefits/:id",
    component: BenefitsDetails,
  },
  {
    path: "/signin",
    component: SignIn,
  },
  {
    path: "*",
    component: Splash,
  },
];
export default routes;
