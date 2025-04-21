import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const GroceryChecklist = () => {
  const [inventory, setInventory] = useState([]);
  const [marked, setMarked] = useState([]);
  const [editedQuantities, setEditedQuantities] = useState({});

  // Fetch inventory from Supabase
  useEffect(() => {
    const fetchInventory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('inventories')
          .select('*')
          .eq('user_id', user.id);

        if (!error) {
          setInventory(data);
        } else {
          console.error('Fetch Error:', error.message);
        }
      }
    };

    fetchInventory();
  }, []);

  const lowStockItems = inventory.filter((item) => parseInt(item.quantity) < 2);

  const handleCheckboxChange = (id) => {
    setMarked((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleQuantityChange = (id, newQuantity) => {
    setEditedQuantities((prev) => ({
      ...prev,
      [id]: newQuantity,
    }));
  };

  const saveAllChanges = async () => {
    const updates = Object.entries(editedQuantities);

    for (const [id, quantity] of updates) {
      const { error } = await supabase
        .from('inventories')
        .update({ quantity })
        .eq('id', id);

      if (error) {
        console.error(`Error updating ${id}:`, error.message);
      }
    }

    // Refresh inventory after save
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('inventories')
      .select('*')
      .eq('user_id', user.id);

    setInventory(data);
    setEditedQuantities({});
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Item', 'Brand', 'Supplier', 'Price', 'Quantity']],
      body: lowStockItems.map((item) => [
        item.item_name,
        item.brand,
        item.supplier,
        `₱${item.price}`,
        item.quantity,
      ]),
    });
    doc.save('grocery-checklist.pdf');
  };

  const csvData = lowStockItems.map((item) => ({
    Item: item.item_name,
    Brand: item.brand,
    Supplier: item.supplier,
    Price: item.price,
    Quantity: item.quantity,
  }));


  const navigate = useNavigate();






  return (   
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">

        {/* Header */}
        {/* Header */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-4 rounded shadow mb-6 w-full gap-4">
  {/* Left: Logo & Title */}
  <div className="flex items-center gap-4">
    <img
      src="/logo.png"
      alt="Logo"
      className="w-12 h-12 object-contain"
    />
    <h2 className="text-xl font-bold">
      Ellry Cafe Grocery Checklist
    </h2>
  </div>

  {/* Right: Navigation */}
  {lowStockItems.length > 0 && (
    <nav className="flex flex-wrap justify-center md:justify-end gap-2 text-sm font-medium">
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition"
      >
        Dashboard
      </button>

      <button
        onClick={exportToPDF}
        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition"
      >
        Export PDF
      </button>

      <CSVLink
        data={csvData}
        filename="grocery-checklist.csv"
        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition"
      >
        Export CSV
      </CSVLink>

      <button
        onClick={saveAllChanges}
        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded transition"
      >
        Save All
      </button>
    </nav>
  )}
</div>

  











      {/* <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🛒 Grocery Checklist
        </h2>
        {lowStockItems.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => navigate('/dashboard')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
            >
            Dashboard
            </button>

            <button
              onClick={exportToPDF}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
            >
              Export PDF
            </button>
            <CSVLink
              data={csvData}
              filename="grocery-checklist.csv"
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded"
            >
              Export CSV
            </CSVLink>
            <button
              onClick={saveAllChanges}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded"
            >
              Save All
            </button>
          </div>
        )}
      </div> */}

      {lowStockItems.length > 0 ? (
        <table className="min-w-full bg-white shadow rounded border text-sm">
          <thead className="bg-gray-100 text-left font-semibold text-gray-700">
            <tr>
              <th className="px-4 py-2">✓</th>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Brand</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map((item) => {
              const qty =
                editedQuantities[item.id] !== undefined
                  ? editedQuantities[item.id]
                  : item.quantity;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 ${
                    marked.includes(item.id) ? 'line-through text-gray-400' : ''
                  }`}
                >
                  <td className="px-4 py-2 border-b">
                    <input
                      type="checkbox"
                      checked={marked.includes(item.id)}
                      onChange={() => handleCheckboxChange(item.id)}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">{item.item_name}</td>
                  <td className="px-4 py-2 border-b">{item.brand}</td>
                  <td className="px-4 py-2 border-b">{item.supplier}</td>
                  <td className="px-4 py-2 border-b">₱{item.price}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                        disabled={qty <= 0}
                        onClick={() =>
                          handleQuantityChange(item.id, qty - 1)
                        }
                      >
                        -
                      </button>
                      <span>{qty}</span>
                      <button
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                        onClick={() => handleQuantityChange(item.id, qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 italic">All stocks are sufficient for now.</p>
      )}
    </div>
  );
};

export default GroceryChecklist;
