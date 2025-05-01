import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Settings, ListChecks, PlusCircle, FileBarChart2, LogOut } from 'lucide-react';


export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [brands, setBrands] = useState([]);
  const [brand, setBrand] = useState('');
  const [supplier, setSupplier] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [price, setPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  


// Profile
const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      window.location.href = '/';
      return;
    }
  
    setUserId(user.id);
  
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single();
  
    if (!profileError && data) {
      setProfile(data);
      await fetchInventory(user.id); // ✅ make sure to await this
    } else {
      console.error('Profile error:', profileError);
    }
  
    setLoading(false); // ✅ Always end with this
  };


// Fetch Inventory
const fetchInventory = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError || !userData?.user?.id) {
    console.error("❌ Cannot fetch inventory, user not found.");
    return;
  }

  const userId = userData.user.id;
  console.log("📦 Fetching inventory for user:", userId);

  const { data, error } = await supabase
    .from('inventories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }); // ✅ SORT BY DATE ASCENDING

  if (error) {
    console.error("❌ Fetch error:", error);
  } else {
    console.log("✅ Fetched inventory:", data);
    setInventory(data);
  }
};



  // Update Quantity
  const updateQuantity = async (id, newQuantity, action = '') => {
    if (newQuantity < 0) return;
  
    const VALID_ACTIONS = ['stock_in', 'stock_out', 'out_of_stock'];
    let cleanAction = action.toLowerCase().trim();

    // 👇 Automatically mark as out_of_stock if quantity reaches 0
    if (newQuantity === 0) {
      cleanAction = 'out_of_stock';
    }
  
    if (!VALID_ACTIONS.includes(cleanAction)) {
      console.warn('⚠️ Invalid action passed to updateQuantity:', cleanAction);
      return;
    }
  
    const changeAmount = cleanAction === 'stock_in' ? 1 : -1;
    const now = new Date().toISOString();
  
    // 1. Update the inventory quantity and timestamp
    // eslint-disable-next-line no-unused-vars
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventories')
      .update({ quantity: newQuantity, created_at: now })
      .eq('id', id)
      .select()
      .maybeSingle();
  
    if (updateError) {
      console.error('❌ Inventory update failed:', updateError.message);
      return;
    }
  
    // 2. Insert into stock_logs
    const { error: logError } = await supabase.from('stock_logs').insert([
      {
        inventory_id: id,
        action: cleanAction,
        quantity_change: changeAmount,
        quantity: newQuantity,
        created_at: now,
      },
    ]);
  
    if (logError) {
      console.error('❌ Failed to insert stock log:', logError.message);
    } else {
      console.log('✅ Stock log inserted:', {
        inventory_id: id,
        action: cleanAction,
        quantity_change: changeAmount,
        quantity: newQuantity,
        created_at: now,
      });
    }
  
    // 3. Update local UI state
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: newQuantity, created_at: now }
          : item
      )
    );
  };  

    
// New Item
const addItem = async (e) => {
  e.preventDefault();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase.from('inventories').insert([
    {
      user_id: user.id,
      item_name: itemName,
      brand,
      supplier,
      quantity,
      category,
      price,
    },
  ]);

  if (!error) {
    setItemName('');
    setQuantity(1);
    setCategory('');
    setBrand('');
    setSupplier('');
    setPrice('');
  
    await fetchInventory(user.id);
  
    toast.success('Item added successfully!'); // ✅ should show here
  } else {
    toast.error('Failed to add item.');
  }
};


// Delete item
const deleteItem = async (id) => {
    if (!id) {
      console.error('❌ No ID provided for deletion');
      return;
    }
  
    const confirmDelete = window.confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;
  
    console.log('🗑 Deleting item with ID:', id);
  
    const { error } = 
      await supabase
        .from('stock_logs')
        .delete()
        .eq('inventory_id', id);
      await supabase
        .from('inventories')
        .delete()
        .eq('id', id);
      

  
    if (error) {
      console.error('❌ Supabase delete error:', error.message);
      return;
    }
  
    setInventory((prevItems) => prevItems.filter((item) => item.id !== id));
  };


// Fetch Search
  const fetchSearchResults = async (query) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user || !query) {
      fetchInventory(); // fallback to full list
      return;
    }
  
    const { data, error } = await supabase
      .from('inventories')
      .select('*')
      .eq('user_id', user.id)
      .ilike('item_name', `%${query}%`); // case-insensitive search
  
    if (error) {
      console.error('❌ Search error:', error.message);
      return;
    }
  
    setInventory(data);
  };
  
  
  
// Filtered Inventory
const filteredInventory = filterCategory
  ? inventory.filter(
    (item) => item.category.toLowerCase() === filterCategory.toLowerCase()
  )
  : inventory;


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);


  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (!error) setCategories(data);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const fetchLists = async () => {
      const [catRes, brandRes, supplierRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('brands').select('*'),
        supabase.from('suppliers').select('*'),
      ]);
  
      if (!catRes.error) setCategories(catRes.data);
      if (!brandRes.error) setBrands(brandRes.data);
      if (!supplierRes.error) setSuppliers(supplierRes.data);
    };
  
    fetchLists();
  }, []);
  


  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    fetchProfile();       
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const navigate = useNavigate();


  // Date & time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // update every second

    return () => clearInterval(timer); // cleanup on unmount
  }, []);

  const formattedTime = `${currentTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}  |  ${currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;

  // Loading
  if (loading) {
    return <div className="text-center p-10 text-gray-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-800">
        <div className="p-6 bg-white rounded shadow">{error}</div>
      </div>
    );
  }

  
  
  





  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded shadow mb-6 w-full">
          {/* Left: Welcome */}
          <div className="logo flex items-center gap-3">
            <img
              src="/logo.png" 
              alt="Logo"
              className="w-12 h-12 object-contain"
              />
              <h2 className="text-xl font-bold">Ellry Cafe Inventory System</h2>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap justify-start md:justify-end gap-2 text-sm font-medium">      
            <button onClick={() => navigate('/checklist')}
                    className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-sm flex items-center gap-1 transition">
                    <ListChecks className="w-4 h-5 mr-1" />
                    Grocery Checklist
                  </button>
                
                  <button onClick={() => navigate('/inventory-report')} 
                    className="text-white bg-sky-700 hover:bg-sky-800 px-4 py-2 rounded text-sm flex items-center gap-1 transition">
                    <FileBarChart2 className="w-4 h-5 mr-1" />
                    Inventory Report
                  </button>                  

                  <button onClick={() => navigate('/manager')}
                    className="text-white bg-sky-700 hover:bg-sky-800 px-4 py-2 rounded text-sm flex items-center gap-1 transition">
                    <Settings className="w-4 h-5 mr-1" />
                    Manager
                  </button>
                  
                    <button type="button" onClick={() => setIsAddItemModalOpen(true)}
                     className="text-white bg-sky-700 hover:bg-sky-800 px-4 py-2 rounded text-sm flex items-center gap-1 transition "> <PlusCircle className="w-4 h-5 mr-1" />
                      Add Item
                    </button>       
                       
                    <button onClick={handleLogout} 
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1 transition ">
                      <LogOut className="w-4 h-5 mr-1" />
                      Logout
                    </button>
          
          </div>
      </div>   


        <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded shadow">
              <div className="flex flex-col md:flex-row">
                
                <div className="w-full">
                  <div className="flex flex-col md:flex-row md:w-full gap-4 py-2">

                    <div className="w-full">
                      <h2 className="text-xl font-bold capitalize">Welcome, {profile.full_name || profile.username}!</h2>
                      <p className="text-sm text-gray-500">{formattedTime}</p>
                    </div>

                    <div className="w-full md:w-5/6 flex flex-col md:flex-row md:items-start gap-2 py-2">                    
                      
                      {/* Filter */}
                      <div className="w-full md:w-1/2">
                        {/* <label className="mb-5 mr-3 font-medium text-sm">Filter by Category</label> */}
                          <select
                              className="border p-2 rounded w-full text-sm"
                              value={filterCategory}
                              onChange={(e) => setFilterCategory(e.target.value)}
                          >   

                              <option value="" disabled>Filter by Category</option>
                              <option value="">All Category</option>
                              {categories
                              .slice()
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                  {cat.name}
                              </option>
                              ))}
                          </select>
                      </div>

                      {/* Search */}
                      <div className="w-full md:w-1/2">
                        <input
                          type="text"
                          placeholder="Search item name..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            fetchSearchResults(e.target.value)}
                          }
                          className="p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-800 w-full"
                        />
                      </div>
                    </div>                   
                    
                  </div>

                  {/* Inventory List */}
                  <div className="overflow-x-auto py-3">
                      <table className="min-w-full border border-gray-200 bg-white text-sm">
                      <thead className="bg-gray-100 text-left text-xs">
                          <tr>
                          <th className="px-1 py-1 border-b text-center">Status</th>
                          <th className="px-4 py-1 border-b">Qty</th>
                          <th className="px-4 py-1 border-b">Item Name</th>
                          <th className="px-2 py-1">Brand</th>
                          <th className="px-4 py-1">Supplier</th>
                          <th className="px-1 py-1">Price</th>
                          <th className="px-4 py-1 border-b">Category</th> 
                          <th className="px-2 py-1 border-b">Date</th>                          
                          <th className="px-2 py-1 border-b">Actions</th>
                          </tr>
                      </thead>

                      <tbody className='text-xs'>
                      {inventory.length > 0 ? (
                          currentItems
                          .filter(item =>
                            item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((item) => {
                          const isLowStock = item.quantity < 2;            
                          
                          const created_at = item.created_at;
                          const now = new Date(created_at);

                          const date = now.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });

                          const time = now.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          });

                          const formatted = `${date} | ${time}`;
                          console.log(formatted); // Example: "Apr 29, 2025 | 7:15 PM"


                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              {/* Status */}
                              <td className="px-1 py-0 border-b text-center">
                                  <span
                                      className={`text-xs font-semibold px-1 py-0 rounded-full ${
                                      isLowStock ? 'bg-red-600 text-red-600 text-xs' : 'text-xs bg-green-600 text-green-600' 
                                      }`}
                                  >
                                      {isLowStock ? 'o' : 'o'}
                                  </span>
                              </td>

                              {/* Quantity */}
                              <td className="px-4 py-0 border-b">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1, 'stock_out')}
                                  className="px-1 py-0 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                                  disabled={item.quantity <= 0}
                                >
                                  -
                                </button>
                                <span className="min-w-[20px] text-center px-2">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1, 'stock_in')}
                                  className="px-1 py-0 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                                >
                                  +
                                </button>     
                              </td>

                              <td className="px-4 py-0 border-b">{item.item_name}</td>
                              <td className="px-2 py-0 border-b">{item.brand}</td>
                              <td className="px-4 py-0 border-b">{item.supplier}</td>
                              <td className="px-1 py-0 border-b">₱{item.price}</td>
                              <td className="px-4 py-0 border-b">{item.category}</td>   
                              
                              {/* Date */}
                              <td className="px-2 py-0 border-b">{formatted}</td>

                              {/* Edit Delete */}
                              <td className="px-2 py-0 border-b space-x-2">
                                  <button className="text-sky-600 hover:underline text-sm" 
                                  onClick={() => setEditingItem(item)}>
                                  <svg
                                      className="w-5 h-5 text-gray-800 dark:text-sky-600"
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
                                  <button className="text-red-600 hover:underline text-sm" 
                                  onClick={() => deleteItem(item.id)} title="Delete">
                                  <svg
                                      className="w-5 h-5 text-gray-800 dark:text-red-600"
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
                              </td>
                            </tr>
                          );
                          })
                      ) : (
                          <tr>
                          <td colSpan="6" className="px-4 py-4 text-center text-gray-500 italic">
                              No items found.
                          </td>
                          </tr>
                      )}
                      </tbody>
                      </table>

                      <div className="flex justify-center mt-4 gap-2">
                      <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs"
                      >
                          Prev
                      </button>
                      <span className="px-4 py-1 text-xs">Page {currentPage} of {totalPages}</span>
                      <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-xs"
                      >
                          Next
                      </button>
                      </div>

                  </div>
                </div>
            </div>
        </div>

    



    


    {/* Add Item Modal */}
    {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="bg-white rounded shadow-lg p-6 w-[50%]">
            <h2 className="text-lg font-semibold mb-4">New Item</h2>
            <form onSubmit={addItem} className="flex flex-col gap-2">
                        <input
                        type="text"
                        placeholder="Item name"
                        className="p-3 border rounded text-sm"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        required
                        />

                        {/* Category */}
                        <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="p-2 border rounded text-sm"
                        required
                        >
                        <option value="">Select Category</option>
                        {categories
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((cat) => (
                            <option key={cat.id} value={cat.name}>
                            {cat.name}
                            </option>
                        ))}
                        </select> {/* End Category */}

                        {/* Brand */}
                        <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="p-2 border rounded text-sm"
                        required
                        >
                        <option value="">Select Brand</option>
                        {brands
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((bra) => (
                            <option key={bra.id} value={bra.name}>
                            {bra.name}
                            </option>
                        ))}
                        </select>{/* End Brand */}


                        {/* Supplier */}
                        <select
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="p-2 border rounded text-sm"
                        required
                        >
                        <option value="">Select Supplier</option>
                        {suppliers
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((sup) => (
                            <option key={sup.id} value={sup.name}>
                            {sup.name}
                            </option>
                        ))}
                        </select>{/* End Brand */}


                        <input
                        type="number"
                        placeholder="Quantity"
                        className="p-3 border rounded text-sm"
                        value={quantity}
                        min="1"
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        required
                        />

                        <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 border rounded text-sm"
                        />

                        <div className="flex justify-end gap-2">
                          <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded flex items-center justify-center gap-2 text-sm">
                          <Save className="w-4 h-5" />
                          Save
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsAddItemModalOpen(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:underline"
                            >
                            Cancel
                          </button>
                        </div>
                    </form>
        </div>
        </div>
    )}




    {/* Editing Modal */}
    {editingItem && (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-md w-[50%]">
        <h2 className="text-lg font-bold mb-3">Edit Item</h2>
        <div className="flex items-center gap-2">
            <label className="w-24 font-medium pb-2">Item Name:</label>
            <input
                type="text"
                value={editingItem.item_name}
                onChange={(e) => setEditingItem({ ...editingItem, item_name: e.target.value })}
                className="w-5/6 border p-2 rounded mb-1"
            />
        </div>

        <div className="flex items-center gap-2">
            <label className="w-24 font-medium pb-2">Price:</label>
            <input
                type="text"
                value={editingItem.price}
                onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                className="w-5/6 border p-2 rounded mb-2" 
            />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <label className="w-24 font-medium">Category:</label>
          <select
            className="w-5/6 border p-2 rounded"
            value={editingItem.category}
            onChange={(e) =>
              setEditingItem({ ...editingItem, category: e.target.value })
            }
          >
            <option value="">Select Category</option>
            {categories
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <label className="w-24 font-medium">Brand:</label>
          <select
            className="w-5/6 border p-2 rounded"
            value={editingItem.brand}
            onChange={(e) =>
              setEditingItem({ ...editingItem, brand: e.target.value })
            }
          >
            <option value="">Select Brand</option>
            {brands
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((brand) => (
              <option key={brand.id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <label className="w-24 font-medium">Supplier:</label>
          <select
            className="w-5/6 border p-2 rounded"
            value={editingItem.supplier}
            onChange={(e) =>
              setEditingItem({ ...editingItem, supplier: e.target.value })
            }
          >
            <option value="">Select Supplier</option>
            {suppliers
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((sup) => (
              <option key={sup.id} value={sup.name}>
                {sup.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add fields for category, brand, etc. */}
        <div className="flex justify-end gap-2">
            <button
            onClick={() => setEditingItem(null)}
            className="bg-gray-400 px-4 py-2 rounded text-white"
            >
            Cancel
            </button>
            <button
            onClick={async () => {
                const { error } = await supabase
                .from('inventories')
                .update(editingItem)
                .eq('id', editingItem.id);

                if (!error) {
                setInventory(prev =>
                    prev.map(item =>
                    item.id === editingItem.id ? editingItem : item
                    )
                );
                setEditingItem(null);
                } else {
                console.error('Update error:', error.message);
                }
            }}
            className="w-auto bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded text-white flex text-center align-middle"
            > <Save className="w-4 h-5 mr-1" />
            Save
            </button>
        </div>
        </div>
    </div>
    )}

    

    </div>
  );
}
