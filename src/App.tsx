import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Navigation from "./components/layout/Navigation";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import CrossedPaths from "./pages/CrossedPaths";
import Feedback from "./pages/Feedback";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCreateEvent from "./pages/admin/AdminCreateEvent";
import AdminEditEvent from "./pages/admin/AdminEditEvent";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCrossedPaths from "./pages/admin/AdminCrossedPaths";
import AdminRSVPs from "./pages/admin/AdminRSVPs";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLayout from "./components/layout/AdminLayout";
import ExploreEvents from "./pages/ExploreEvents";
import OurExploreevents from "./pages/OurExploreevents";
import OurEventsCreate from "./pages/OurEventsCreate";
import TestAuthSystem from "./components/auth/TestAuthSystem";
import RoleDebugger from "./components/auth/RoleDebugger";
import UserDashboard from "./pages/UserDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";
import RSVPs from "./pages/RSVPs";
import EventDetails from "./pages/EventDetails";
import Restaurants from "./pages/Restaurants";
import MyVisits from "./pages/MyVisits";
import AddRestaurant from "./pages/AddRestaurant";
import EditRestaurant from "./pages/EditRestaurant";
import Plans from "./pages/Plans";
import ManageSubscriptions from "./pages/ManageSubscriptions";
import AddPlan from "./pages/AddPlan";
import EditPlan from "./pages/EditPlan";
import EventEdit from "./pages/EventEdit";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import UserCheckout from "./pages/UserCheckout";
import PaymentCheckoutPage from "./pages/PaymentCheckoutPage";
import RsvpSuccessPage from "./pages/RsvpSuccessPage";
import AdminEventDetails from "./pages/AdminEventDetails";
import RSVPDetails from "./pages/RSVPDetails";
import WalletWithdraw from "./pages/WalletWithdraw";
import AdminWalletRequests from "./pages/admin/AdminWalletRequests";
import PendingApproval from "./pages/waitingApprovalPage";
import RejectedRegistration from "./pages/RejectRegistration"
import SuspendedAccount from "./pages/SuspendedAccount";
import {AdminLogin} from "./components/adminLogin/AdminLogin";
import ResetPassword from "./pages/ResetPassword";
import AuthPage from "@/components/auth/AuthPage";
import { SocialLinks } from "@/components/SocialMedia/SocialMedia"
import { ContactPage } from "@/pages/Contact";
import RefundPolicyPage from "@/pages/RefundPolicy";
import SafetyGuidelines from "@/pages/SafetyGIuidelines"
import TermsAndConditions from "@/pages/Terms&Conditions"
import PrivacyPolicy from "@/pages/PrivacyPolicy.tsx"
import Layout from "./components/layout/Layout";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              {/* <Route
                path="/auth"
                element={<div>Auth page rendered by ProtectedRoute</div>}
              /> */}
              <Route
                path="/auth"
                element={<AuthPage />}
              />
              {/* <Route 
                path="/social-media"
                element={<SocialLinks />}
              /> */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/explore"
                element={
                  <ProtectedRoute>
                     {/* <Navigation /> */}
                    <OurExploreevents />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/events-create"
                element={
                  <ProtectedRoute>
                     <Navigation />
                    <OurEventsCreate />
                  </ProtectedRoute>
                }
              />
              <Route element={<Layout /> } >
                  <Route 
                    path="contact-us"
                    element={<ContactPage />}  
                  />
                  <Route 
                    path="/refund-policy"
                    element={<RefundPolicyPage />}  
                  />
                  <Route 
                    path="/safety-guidelines"
                    element={<SafetyGuidelines />}  
                  />
                  <Route 
                    path="/terms-conditions"
                    element={<TermsAndConditions />}  
                  />   
                    <Route 
                    path="/privacy-policy"
                    element={<PrivacyPolicy />}  
                  />   
              </Route>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                    <Profile />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <Events />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet/withdraw"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <WalletWithdraw />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-event"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              {/* <Route
                path="/explore"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <ExploreEvents />
                    </ProtectedRoute>
                }
              /> */}
              <Route
                path="/rsvps"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <RSVPs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:eventId/details"
                element={
                  <>
                    <Navigation />
                    <EventDetails />
                  </>
                }
              />
              <Route
                path="/rsvp/:eventId/details"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <RSVPDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/event/:eventId/edit"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <EventEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurants"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <Restaurants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurants/add"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <AddRestaurant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurants/edit/:id"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <EditRestaurant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crossed-paths"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <CrossedPaths />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-visits"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <MyVisits />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-subscriptions"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <ManageSubscriptions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <Subscription />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-checkout"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <UserCheckout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment-checkout"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <PaymentCheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rsvp-success"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <RsvpSuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout-success"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <CheckoutSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/dashboard"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedAdminRoute requireAdmin={true}>
                    <SuperAdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedAdminRoute requireAdmin={false}>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminEvents />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/events/create"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminCreateEvent />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/event/:eventId/edit"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminEditEvent />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/event/:eventId/details"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminEventDetails />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/wallet/requests"
                element={
                  <ProtectedAdminRoute requireAdmin={false}>
                    <AdminLayout>
                      <AdminWalletRequests />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/crossed-paths"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminCrossedPaths />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/rsvps"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminRSVPs />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/reservations"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminReservations />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminAnalytics />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminNotifications />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AdminReports />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/admin-management"
                element={
                  <ProtectedAdminRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminManagement />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedAdminRoute requireAdmin={true}>
                    <AdminLayout>
                      <AdminSettings />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/restaurants"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <Restaurants />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/restaurants/add"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AddRestaurant />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/restaurants/edit/:id"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <EditRestaurant />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/plans"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <Plans />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/plans/add"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <AddPlan />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/plans/edit/:id"
                element={
                  <ProtectedAdminRoute>
                    <AdminLayout>
                      <EditPlan />
                    </AdminLayout>
                  </ProtectedAdminRoute>
                }
              />
              <Route 
                path="/waiting-approval"
                element={
                  <ProtectedRoute>
                    <PendingApproval/>
                  </ProtectedRoute>
              }
              />
              <Route
                path="/admin/manage-subscriptions"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <ManageSubscriptions />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="rejected-profile"
                element={
                  <ProtectedRoute>
                    <RejectedRegistration />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="suspended-user"
                element={
                  <ProtectedRoute>
                    <SuspendedAccount />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/login"
                element={
                  <ProtectedRoute>
                    <AdminLogin />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/reset-password"
                element={<ResetPassword/>}
              />
              <Route path="/test-auth" element={<TestAuthSystem />} />
              <Route path="/debug-role" element={<RoleDebugger />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
