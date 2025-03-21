import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import AuthLayout from "./layouts/AuthLayout";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoutes from "./layouts/ProtectedRoutes";
import MainLayout from "./layouts/MainLayout";
// import Generate from "./components/Generate";
// import Dashboard from "./pages/Dashboard";
// import CreateEditPage from "./pages/CreateEditPage";
// import MockLoadPage from "./pages/MockLoadPage";
// import MockInterviewPage from "./pages/MockInterviewPage";
// import Feedback from "./pages/Feedback";
import InterviewQuestionsGenerator from "./pages/InterviewQuestionsGenerator";
import QuestionList from "./pages/QuestionList";
import CustomizedMockInterview from "./pages/CustomizedMockInterview";
import InterviewFeedback from "./pages/InterviewFeedback";
import FeedbackPage from "./pages/FeedbackPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* public routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />

          {/* Question Generator section - public */}
          <Route path="/questions">
            <Route index element={<InterviewQuestionsGenerator />}/>
          </Route>
        </Route>

        {/* authentication layout */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>

        {/* protected routes */}
        <Route
          element={
            <ProtectedRoutes>
              <MainLayout />
            </ProtectedRoutes>
          }
        >
          {/* add all the protect routes */}
          <Route>
            <Route path="question-list" element={<QuestionList />} />
            <Route path="mock-interview" element={<CustomizedMockInterview />} />
            <Route path="mock-interview/feedback" element={<FeedbackPage />} />
            <Route path="mock-interview/feedback/:interviewId" element={<InterviewFeedback />} />
          </Route>
          {/* <Route path="/generate" element={<Generate />}>
            <Route index element={<Dashboard />} />
            <Route path=":interviewId" element={<CreateEditPage />} />
            <Route path="interview/:interviewId" element={<MockLoadPage />} />
            <Route path="interview/:interviewId/start" element={<MockInterviewPage />} />
            <Route path="feedback/:interviewId" element={<Feedback />} />
          </Route> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
