'use client'
import Spreadsheet from "@/app/components/SpreadSheet";

import { useParams } from "next/navigation";
import { useSheetData } from "../hooks/useSheetData";

export default function SheetPage() {
 const params = useParams();
 const sheetId = params?.id;
 const { data } = useSheetData(sheetId as string);

 return (
  <div className="p-4">
   {!data ? (
     <div className="flex items-center justify-center min-h-[80vh]">
       <div className="text-center">
         <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
         <p className="text-xl text-gray-600 font-medium">Loading your spreadsheet...</p>
       </div>
     </div>
   ) : (
     <Spreadsheet />
   )}
  </div>
 );
}
