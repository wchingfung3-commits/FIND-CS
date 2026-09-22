import { Header } from "@/components/Header";
import { useHashRoute, parseRoute } from "@/lib/router";
import { HomePage } from "@/pages/HomePage";
import { IndustryListPage } from "@/pages/IndustryListPage";
import { CompanyPage } from "@/pages/CompanyPage";
import { RoutePage } from "@/pages/RoutePage";
import { IssueRoutePage } from "@/pages/IssueRoutePage";

function App() {
  const [hash, navigate] = useHashRoute();
  const route = parseRoute(hash);

  let content: React.ReactNode = null;

  switch (route.page) {
    case "home":
      content = <HomePage navigate={navigate} />;
      break;
    case "industry":
      content = <IndustryListPage industryId={route.industryId!} navigate={navigate} />;
      break;
    case "company":
      content = <CompanyPage companyId={route.companyId!} navigate={navigate} />;
      break;
    case "route":
      content = <RoutePage companyId={route.companyId!} routeId={route.routeId!} navigate={navigate} />;
      break;
    case "issue":
      content = <IssueRoutePage companyId={route.companyId!} issueId={route.issueId!} navigate={navigate} />;
      break;
    default:
      content = <HomePage navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onHomeClick={() => navigate("/")} />
      <main>{content}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        FIND CS — 香港客服導航平台 · Mock Data MVP
      </footer>
    </div>
  );
}

export default App;
