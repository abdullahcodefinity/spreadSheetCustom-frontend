export default function Header() {
    return (
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">SpreadSheet App</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Settings
            </button>
            <button className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">
              New Sheet
            </button>
          </div>
        </div>
      </header>
    );
  }