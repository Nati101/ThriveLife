import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import ChallengeDetails from './pages/ChallengeDetails';
import Onboarding from './pages/Onboarding';
import Journal from './pages/Journal';
import Settings from './pages/Settings';
import Habits from './pages/Habits';
import LifeTransformation from './pages/LifeTransformation';
import DailyCheckIn from './pages/DailyCheckIn';
import Reminders from './pages/Reminders';
import WellnessResults from './pages/WellnessResults';
import HowItWorks from './pages/HowItWorks';
import WellnessTeam from './pages/WellnessTeam';
import PersonalTransformationPlan from './pages/PersonalTransformationPlan';
import BuildMyTeam from './pages/BuildMyTeam';
import JoinTeam from './pages/JoinTeam';
import MyTeam from './pages/MyTeam';
import WellnessAssessment from './pages/WellnessAssessment';
import Home from './pages/Home';
import tlDashboard from './pages/TL_Dashboard';
import homepageVbackup from './pages/Homepage_vBACKUP';
import dashboardVbackup from './pages/Dashboard_vBACKUP';
import DailyRhythms from './pages/DailyRhythms';
import WinsBoard from './pages/WinsBoard';
import MemberWins from './pages/MemberWins';
import TeamChallenge from './pages/TeamChallenge';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Quiz": Quiz,
    "ChallengeDetails": ChallengeDetails,
    "Onboarding": Onboarding,
    "Journal": Journal,
    "Settings": Settings,
    "Habits": Habits,
    "LifeTransformation": LifeTransformation,
    "DailyCheckIn": DailyCheckIn,
    "Reminders": Reminders,
    "WellnessResults": WellnessResults,
    "HowItWorks": HowItWorks,
    "WellnessTeam": WellnessTeam,
    "PersonalTransformationPlan": PersonalTransformationPlan,
    "BuildMyTeam": BuildMyTeam,
    "JoinTeam": JoinTeam,
    "MyTeam": MyTeam,
    "WellnessAssessment": WellnessAssessment,
    "Home": Home,
    "TL_Dashboard": tlDashboard,
    "Homepage_vBACKUP": homepageVbackup,
    "Dashboard_vBACKUP": dashboardVbackup,
    "DailyRhythms": DailyRhythms,
    "WinsBoard": WinsBoard,
    "MemberWins": MemberWins,
    "TeamChallenge": TeamChallenge,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
