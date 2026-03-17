import { Routes, Route } from "react-router";
import Onboarding from "../pages/Onboarding/Onboarding";
import Popupasso from "../pages/Onboarding/Popupasso";
import CreateAccountMember from "../pages/MemberAccount/CreateAccountMember";
import MinimalPersonalizeMemberAccount from "../pages/MemberAccount/MinimalPersonalizeMemberAccount";
import CreateAccountOrganisation from "../pages/OrganizationAccount/CreateAccountOrganisation";
import BackOffice from "../pages/BackOffice/BackOffice";
import LoginForm from "../pages/Auth/LoginForm";
import { ProtectedRoute } from "../hooks/allowRoles";
import ProfilePage from "../pages/Profile/ProfilePage";
import LayoutWithNav from "../layouts/LayoutWithNav";
import LayoutWithFooter from "../layouts/LayoutWithFooter";
import Home from "../pages/Home/Home";
import FilterProfiles from "../pages/Home/FilterProfiles";
import MessagesPage from "../pages/Messages/MessagesPage";
import ConversationPage from "../pages/Conversation/ConversationPage";
import NotFound from "../pages/NotFound/NotFound";
import CreateEvent from "../pages/EventsTab/CreateEvent.tsx";


export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute guestOnly>
            <LayoutWithFooter>
              <Onboarding />
            </LayoutWithFooter>
          </ProtectedRoute>
        }
      />

      <Route
        path="/LoginForm"
        element={
          <ProtectedRoute guestOnly>
            <LayoutWithFooter>
              <LoginForm />
            </LayoutWithFooter>
          </ProtectedRoute>
        }
      />

      <Route
        path="/Popupasso"
        element={
          <ProtectedRoute guestOnly>
            <LayoutWithFooter>
              <Popupasso />
            </LayoutWithFooter>
          </ProtectedRoute>
        }
      />

      <Route
        path="/CreateAccountMember"
        element={
          <ProtectedRoute guestOnly>
            <LayoutWithFooter>
              <CreateAccountMember />
            </LayoutWithFooter>
          </ProtectedRoute>
        }
      />

      <Route
        path="/MinimalPersonalizeMemberAccount"
        element={
          <ProtectedRoute guestOnly>
            <LayoutWithFooter>
              <MinimalPersonalizeMemberAccount />
            </LayoutWithFooter>
          </ProtectedRoute>
        }
      />

      <Route
        path="/CreateAccountOrganisation"
        element={
          <ProtectedRoute guestOnly>
            <LayoutWithFooter>
              <CreateAccountOrganisation />
            </LayoutWithFooter>
          </ProtectedRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute roles={["member", "organization", "admin", "moderator"]}>
            <LayoutWithNav>
              <Home />
            </LayoutWithNav>
          </ProtectedRoute>
        }
      />

      <Route path="/filters" element={<FilterProfiles />} />

      <Route
        path="/messages"
        element={
          <LayoutWithNav>
            <MessagesPage />
          </LayoutWithNav>
        }
      />

      <Route
        path="/messages/:shortId"
        element={
          <LayoutWithNav>
            <ConversationPage />
          </LayoutWithNav>
        }
      />

      <Route
        path="/profile/:shortId"
        element={
          <ProtectedRoute roles={["member", "organization", "admin", "moderator"]}>
            <LayoutWithNav>
              <ProfilePage />
            </LayoutWithNav>
          </ProtectedRoute>
        }
      />

      < Route
        path="/CreateEvent"
        element={
          < CreateEvent />
        }
      />

      <Route
        path="/BackOffice"
        element={
          <ProtectedRoute roles={["admin", "moderator"]}>
            <BackOffice />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={
        <LayoutWithFooter>
          <NotFound />
        </LayoutWithFooter>
      }
      />
    </Routes>
  );
}
