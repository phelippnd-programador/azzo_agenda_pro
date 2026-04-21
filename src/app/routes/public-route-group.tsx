import type { ComponentType, ReactNode } from "react";
import { Route } from "react-router-dom";
import { appRouteManifest } from "@/app/route-manifest";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import PublicBooking from "@/pages/appointments/PublicBooking";
import {
  CheckoutError,
  CheckoutSuccess,
  LegalDocument,
  SalePage,
} from "@/app/routes/lazy-pages";

type RouteWrapperProps = {
  children: ReactNode;
};

type PublicRouteGroupProps = {
  RootRoute: ComponentType;
  PublicRoute: ComponentType<RouteWrapperProps>;
  PublicLazyRoute: ComponentType<RouteWrapperProps>;
};

export function PublicRouteGroup({
  RootRoute,
  PublicRoute,
  PublicLazyRoute,
}: PublicRouteGroupProps) {
  return (
    <>
      <Route path={appRouteManifest.public.root} element={<RootRoute />} />
      <Route
        path={appRouteManifest.public.login}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path={appRouteManifest.public.forgotPassword}
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route path={appRouteManifest.public.resetPassword} element={<ResetPassword />} />
      <Route
        path={appRouteManifest.public.register}
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path={appRouteManifest.public.publicBooking} element={<PublicBooking />} />
      <Route
        path={appRouteManifest.public.termsOfUse}
        element={
          <PublicLazyRoute>
            <LegalDocument documentType="TERMS_OF_USE" fallbackTitle="Termos de Uso" />
          </PublicLazyRoute>
        }
      />
      <Route
        path={appRouteManifest.public.privacyPolicy}
        element={
          <PublicLazyRoute>
            <LegalDocument
              documentType="PRIVACY_POLICY"
              fallbackTitle="Politica de Privacidade"
            />
          </PublicLazyRoute>
        }
      />
      <Route
        path={appRouteManifest.public.sales}
        element={
          <PublicLazyRoute>
            <SalePage />
          </PublicLazyRoute>
        }
      />
      <Route
        path={appRouteManifest.public.salesProduct}
        element={
          <PublicLazyRoute>
            <SalePage />
          </PublicLazyRoute>
        }
      />
      <Route
        path={appRouteManifest.public.checkoutSuccess}
        element={
          <PublicLazyRoute>
            <CheckoutSuccess />
          </PublicLazyRoute>
        }
      />
      <Route
        path={appRouteManifest.public.checkoutError}
        element={
          <PublicLazyRoute>
            <CheckoutError />
          </PublicLazyRoute>
        }
      />
    </>
  );
}
