import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewSession from "./pages/InterviewSession";
import InterviewReport from "./pages/InterviewReport";
import ReportsList from "./pages/ReportsList";
import ResumeUpload from "./pages/ResumeUpload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/candidate" element={<ProtectedRoute><CandidateDashboard /></ProtectedRoute>} />
            <Route path="/recruiter" element={<ProtectedRoute><RecruiterDashboard /></ProtectedRoute>} />
            <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
            <Route path="/interview/:id" element={<ProtectedRoute><InterviewSession /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsList /></ProtectedRoute>} />
            <Route path="/reports/:id" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
