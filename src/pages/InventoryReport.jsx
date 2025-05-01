import React, { useEffect, useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const InventoryReport = () => {
  const [reportData, setReportData] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const allDays = eachDayOfInterval({ start, end });

      setDaysInMonth(allDays);

      const { data, error } = await supabase
        .from('stock_logs')
        .select(`
          inventory_id,
          inventories(item_name, category),
          created_at,
          action,
          quantity
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) {
        console.error('Error fetching logs:', error);
        return;
      }

      const grouped = {};
      for (const log of data) {
        const key = `${log.inventories.category}|${log.inventories.item_name}`;
        const day = format(new Date(log.created_at), 'd');

        if (!grouped[key]) grouped[key] = {};

        // Store the latest log for that day
        if (!grouped[key][day] || new Date(log.created_at) > new Date(grouped[key][day].created_at)) {
          grouped[key][day] = {
            quantity: log.quantity,
            created_at: log.created_at,
            isOut: log.action === 'out_of_stock'
          };
        }

        if (log.action === 'out_of_stock') {
          grouped[key][`out-${day}`] = true;
        }
      }

      setReportData(grouped);
    };

    fetchReport();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow mb-6 w-full">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <h2 className="text-xl font-bold">Stocks Inventory Report</h2>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>
      </div>

      <table className="min-w-full table-fixed border border-collapse text-sm bg-white shadow">
      <thead>
        {/* Month Header Row */}
        <tr className="bg-gray-200 text-center">
          <th className="border p-2 w-[180px]"></th>
          <th
            className="border p-2 text-center"
            colSpan={daysInMonth.length}
          >
            {format(new Date(), 'MMMM yyyy')} {/* Ex: April 2025 */}
          </th>
        </tr>

        {/* Day Header Row */}
        <tr className="bg-gray-300 text-center text-xs">
          <th className="border p-2 w-[180px]">Item</th>
          {daysInMonth.map((day) => (
            <th key={day} className="border p-2 w-[50px]">
              {format(day, 'd')}
            </th>
          ))}
        </tr>
      </thead>

        <tbody>
          {Object.entries(reportData).map(([key, dailyData]) => {
            // eslint-disable-next-line no-unused-vars
            const [category, item] = key.split('|');
            return (
              <tr key={key}>
                <td className="border px-2 py-1 text-xs">{item}</td>
                {daysInMonth.map((day) => {
                  const d = format(day, 'd');
                  const cellData = dailyData[d];
                  const qty = cellData?.quantity ?? '';
                  const isOut = cellData?.isOut;

                  return (
                    <td
                      key={d}
                      className={`border px-2 py-1 text-center text-xs ${isOut ? 'text-red-600 font-bold' : ''}`}
                    >
                      {isOut ? <span className="text-red-500">0</span> : qty}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryReport;
