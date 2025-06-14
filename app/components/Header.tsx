export default function Header() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between w-full flex-wrap gap-2 sm:flex-nowrap">
        {/* Logo / Title */}
        <div className="flex items-center flex-shrink-0">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            SpreadSheet App
          </h1>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 w-full sm:w-auto text-left sm:text-center">
            Settings
          </button>

        </div>
      </div>
    </header>
  );
}