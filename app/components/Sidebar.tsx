export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-[calc(100vh-3.5rem)] fixed top-14 left-0">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">Navigation</h2>
        <nav className="space-y-1">
          <a
            href="/"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-2">📊</span>
            Sheets
          </a>
          <a
            href="/recent"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-2">🕒</span>
            Recent
          </a>
          <a
            href="/shared"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
          >
            <span className="mr-2">👥</span>
            Shared
          </a>
        </nav>
      </div>
    </aside>
  );
} 