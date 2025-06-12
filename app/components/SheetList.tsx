// components/SheetList.tsx

import Link from "next/link";


const sheets = ["Sheet 1", "Sheet 2", "Sheet 3"];

export default function SheetList() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Sheets</h1>
      <ul className="space-y-2">
        {sheets.map((name, idx) => (
          <li key={idx}>
            <Link className="block p-4 bg-gray-100 hover:bg-gray-200 rounded" href={`/sheet/${idx}`}>

                {name}
            
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}