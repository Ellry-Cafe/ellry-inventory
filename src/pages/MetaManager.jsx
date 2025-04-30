import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const MetaManagerPage = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [newName, setNewName] = useState('');
  const [currentTab, setCurrentTab] = useState('categories');
  const [refresh, setRefresh] = useState(false);

  const navigate = useNavigate();

  const fetchAll = async () => {
    const [cat, brd, sup] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('brands').select('*'),
      supabase.from('suppliers').select('*'),
    ]);
    if (cat.data) setCategories(cat.data);
    if (brd.data) setBrands(brd.data);
    if (sup.data) setSuppliers(sup.data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newName.trim()) return;

    await supabase.from(currentTab).insert([{ user_id: user.id, name: newName.trim() }]);
    setNewName('');
    toast.success(`New ${currentTab} added!`);
    setRefresh(!refresh);
  };

  const handleUpdate = async (type, id, name) => {
    await supabase.from(type).update({ name }).eq('id', id);
    toast.success('Item updated successfully!');
    setRefresh(!refresh);
  };

  const handleDelete = async (type, id) => {
    const confirm = window.confirm('Are you sure you want to delete this item?');
    if (confirm) {
      await supabase.from(type).delete().eq('id', id);
      toast.success('Item has been deleted!');
      setRefresh(!refresh);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [refresh]);

  const renderItems = (items, type) => (
    <ul>
      {items
      .slice()
      .sort((a,b) => a.name.localeCompare(b.name))
      .map((item) => (
        <li key={item.id} className="flex justify-between items-center border p-2 text-xs">
          <span>{item.name}</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newName = prompt('Edit name:', item.name);
                if (newName && newName.trim()) handleUpdate(type, item.id, newName.trim());
              }}
              className="text-sky-600 hover:underline"
            >
              <svg
                                      className="w-4 h-4 text-gray-800 dark:text-sky-600"
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                  >
                                      <path
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"
                                      />
                                  </svg>
            </button>
            <button
              onClick={() => handleDelete(type, item.id)}
              className="text-red-600 hover:underline"
            >
              <svg
                                      className="w-4 h-4 text-gray-800 dark:text-red-600"
                                      aria-hidden="true"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                  >
                                      <path
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                                      />
                                  </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );

  const tabMap = {
    categories: categories,
    brands: brands,
    suppliers: suppliers,
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow mb-6 w-full">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <h2 className="text-xl font-bold">Manage</h2>
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

      <div className="w-1/2 max-w-7xl mx-auto bg-white p-8 rounded shadow">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
            {['categories', 'brands', 'suppliers'].map((tab) => (
            <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-4 py-2 rounded-t text-sm font-medium ${
                currentTab === tab ? 'bg-white border-t border-x border-gray-300' : 'bg-gray-200'
                }`}
            >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
            ))}
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`New ${currentTab.slice(0, -1)}`}
            className="flex-1 border px-3 py-2 rounded text-sm"
            />
            <button
            type="submit"
            className="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded text-sm"
            >
            Add
            </button>
        </form>

        {/* Content Panel */}
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2 capitalize">{currentTab}</h2>
            {renderItems(tabMap[currentTab], currentTab)}
        </div>
      </div>
    </div>
  );
};

export default MetaManagerPage;
