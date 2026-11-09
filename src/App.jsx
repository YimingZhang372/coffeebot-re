import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { SessionProvider } from '@/lib/session';
import { ProgrammeProvider } from '@/lib/programmeData';
// Add page imports here
import Login from '@/pages/Login';
import AdminLogin from '@/pages/AdminLogin';
import Home from '@/pages/Home';
import Collect from '@/pages/Collect';
import Activities from '@/pages/Activities';
import Community from '@/pages/Community';
import Leaderboard from '@/pages/Leaderboard';
import Pledge from '@/pages/Pledge';
import PledgeRoom from '@/pages/PledgeRoom';
import Me from '@/pages/Me';
import About from '@/pages/About';
import Demo from '@/pages/Demo';
import Welcome from '@/pages/Welcome';
import Verify from '@/pages/Verify';
import AppShell from '@/components/cb/AppShell';
import AdminShell from '@/components/admin/AdminShell';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminActivity from '@/pages/admin/AdminActivity';
import AdminFloors from '@/pages/admin/AdminFloors';
import AdminPledges from '@/pages/admin/AdminPledges';
import AdminCalculations from '@/pages/admin/AdminCalculations';
import AdminTables from '@/pages/admin/AdminTables';
import AdminCertificates from '@/pages/admin/AdminCertificates';
import AdminEmail from '@/pages/admin/AdminEmail';
import AdminCarbon from '@/pages/admin/AdminCarbon';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminAudit from '@/pages/admin/AdminAudit';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/demo" element={<Demo />} />
    <Route path="/pledge-room/demo" element={<PledgeRoom />} />
    <Route path="/verify/:certificateId" element={<Verify />} />

    <Route element={<AppShell />}>
      <Route path="/" element={<Home />} />
      <Route path="/collect" element={<Collect />} />
      <Route path="/activities" element={<Activities />} />
      <Route path="/community" element={<Community />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/pledge" element={<Pledge />} />
      <Route path="/me" element={<Me />} />
      <Route path="/about" element={<About />} />
      <Route path="/welcome" element={<Welcome />} />
    </Route>

    <Route path="/admin" element={<AdminShell />}>
      <Route index element={<AdminOverview />} />
      <Route path="activity" element={<AdminActivity />} />
      <Route path="floors" element={<AdminFloors />} />
      <Route path="pledges" element={<AdminPledges />} />
      <Route path="calculations" element={<AdminCalculations />} />
      <Route path="tables" element={<AdminTables />} />
      <Route path="certificates" element={<AdminCertificates />} />
      <Route path="email" element={<AdminEmail />} />
      <Route path="carbon" element={<AdminCarbon />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="audit" element={<AdminAudit />} />
    </Route>

    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SessionProvider>
          <ProgrammeProvider>
            <Router>
              <ScrollToTop />
              <AppRoutes />
            </Router>
            <Toaster />
          </ProgrammeProvider>
        </SessionProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App