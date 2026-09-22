import { Header } from "@/components/Header";
import { useHashRoute, parseRoute } from "@/lib/router";
import { HomePage } from "@/pages/HomePage";
import { IndustryListPage } from "@/pages/IndustryListPage";
import { CompanyPage } from "@/pages/CompanyPage";
import { RoutePage } from "@/pages/RoutePage";
import { IssueRoutePage } from "@/pages/IssueRoutePage";
import { useEffect, useState } from "react";
import { AdminPage } from "@/admin/AdminPage";
import { db } from "@/admin/client";
import { replaceCatalog } from "@/lib/catalog";

function App() {
  const [hash, navigate] = useHashRoute();
  const route = parseRoute(hash);
  const isAdminPage = hash === '/admin' || hash.startsWith('/admin/');
  const live = import.meta.env.VITE_CATALOG_MODE === 'live';
  const [catalogState, setCatalogState] = useState(live ? 'loading' : 'ready');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!live || isAdminPage) return;
    let active = true;
    setCatalogState('loading');
    async function load() {
      try {
        if (!db) throw new Error('Database not configured');
        const { data, error } = await db.rpc('get_public_catalog');
        if (error) throw error;
        if (!active) return;
        replaceCatalog(data);
        setCatalogState('ready');
      } catch { if (active) setCatalogState('error'); }
    }
    void load();
    return () => { active = false; };
  }, [live, isAdminPage, retry]);

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
      {!isAdminPage && !live && <p role="status" className="bg-amber-50 p-3 text-center text-sm text-amber-900">示範環境：客服資料及驗證紀錄為開發樣本，請勿據此聯絡客服。</p>}
      {isAdminPage ? <AdminPage /> : catalogState === 'loading' ? <p role="status" className="p-8 text-center">正在載入已發布資料…</p> : catalogState === 'error' ? <div role="alert" className="p-8 text-center"><p>資料暫時無法載入；不會以示範資料替代。</p><button className="mt-4 rounded bg-teal-700 px-4 py-2 text-white" onClick={() => setRetry(n => n + 1)}>重試</button></div> : <main>{content}</main>}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        FIND CS — 香港客服導航平台 · {live ? '已發布資料' : '開發示範'} · <button className="underline" onClick={() => navigate('/admin')}>管理後台</button>
      </footer>
    </div>
  );
}

export default App;
