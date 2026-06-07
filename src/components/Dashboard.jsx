import ActionArea from './ActionArea';
import Header from './Header';
import SummaryCards from './SummaryCards';
import VisitHistory from './VisitHistory';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
        <SummaryCards />
        <ActionArea />
        <VisitHistory />
      </main>
      <footer className="py-6 text-center text-xs text-premium-gray-dark">
        Industrial Site Visit Tracker · Local session storage
      </footer>
    </div>
  );
}
