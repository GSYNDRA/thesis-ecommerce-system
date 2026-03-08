import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthShowcase from "./pages/AuthShowcase";
import CommerceShowcase from "./pages/CommerceShowcase";
import ChatShowcase from "./pages/ChatShowcase";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import CheckEmailPage from "@/pages/auth/CheckEmailPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import {
  CustomerOnlyRoute,
  GuestOnlyRoute,
  ProtectedRoute,
  StaffOnlyRoute,
} from "@/components/auth/RouteGuards";
import ProductListPage from "@/pages/products/ProductListPage";
import ProductDetailPage from "@/pages/products/ProductDetailPage";
import CartPage from "@/pages/commerce/CartPage";
import CheckoutPage from "@/pages/commerce/CheckoutPage";
import CheckoutResultPage from "@/pages/commerce/CheckoutResultPage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import SupportChatPage from "@/pages/support/SupportChatPage";
import StaffSupportDashboardPage from "@/pages/support/StaffSupportDashboardPage";
import StaffConversationRoomPage from "@/pages/support/StaffConversationRoomPage";
import { GlobalChatLauncher } from "@/components/chat/GlobalChatLauncher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auth/login"
              element={
                <GuestOnlyRoute>
                  <LoginPage />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/auth/register"
              element={
                <GuestOnlyRoute>
                  <RegisterPage />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/auth/check-email"
              element={
                <GuestOnlyRoute>
                  <CheckEmailPage />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/verify-email"
              element={
                <GuestOnlyRoute>
                  <VerifyEmailPage />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/auth/forgot-password"
              element={
                <GuestOnlyRoute>
                  <ForgotPasswordPage />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/auth/verify-otp"
              element={
                <GuestOnlyRoute>
                  <VerifyOtpPage />
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/auth/reset-password"
              element={
                <GuestOnlyRoute>
                  <ResetPasswordPage />
                </GuestOnlyRoute>
              }
            />
            <Route path="/auth-showcase" element={<AuthShowcase />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route path="/checkout/result" element={<CheckoutResultPage />} />
            <Route
              path="/support/chat"
              element={
                <CustomerOnlyRoute>
                  <SupportChatPage />
                </CustomerOnlyRoute>
              }
            />
            <Route
              path="/staff/support"
              element={
                <StaffOnlyRoute>
                  <StaffSupportDashboardPage />
                </StaffOnlyRoute>
              }
            />
            <Route
              path="/staff/support/room/:sessionUuid"
              element={
                <StaffOnlyRoute>
                  <StaffConversationRoomPage />
                </StaffOnlyRoute>
              }
            />
            <Route
              path="/staff/*"
              element={
                <StaffOnlyRoute>
                  <NotFound />
                </StaffOnlyRoute>
              }
            />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route
              path="/commerce-showcase"
              element={
                <ProtectedRoute>
                  <CommerceShowcase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat-showcase"
              element={
                <ProtectedRoute>
                  <ChatShowcase />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalChatLauncher />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
