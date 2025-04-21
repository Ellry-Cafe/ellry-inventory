import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';


export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [itemName, setItemName] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [brands, setBrands] = useState([]);
  const [brand, setBrand] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [supplier, setSupplier] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');
  const [price, setPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [editingItem, setEditingItem] = useState(null);




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
  
// Inventory
const fetchInventory = async (userId) => {
    console.log('Fetching inventory for user:', userId); // 🔍 Step 1
  
    const { data, error } = await supabase
      .from('inventories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  
    console.log('Fetched inventory:', data); // 🔍 Step 2
    console.log('Fetch error:', error);      // 🔍 Step 3
  
    if (!error) {
      setInventory(data);
    }
  };

  // Update Quantity
  const updateQuantity = async (id, quantity) => {
    if (quantity < 0) return;
  
    console.log('🔄 Updating ID:', id, '➡️ Quantity:', quantity);
  
    const { data, error } = await supabase
      .from('inventories')
      .update({ quantity })
      .eq('id', id)
      .select()
      .maybeSingle(); 
  
    if (error) {
      console.error('❌ Update error:', error.message);
      return;
    }
  
    if (data) {
      setInventory((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, quantity: data.quantity } : item
        )
      );
    } else {
      console.warn('⚠️ No row returned, but update likely succeeded.');
      // Fallback: manually update without select
      setInventory((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };
    
// New Item
  const addItem = async (e) => {
    e.preventDefault();
  
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await fetchInventory(user.id);
  
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
      setCategory(''); // clear category
      setBrand('');
      fetchInventory(user.id);
    } else {
      console.error('Insert error:', error.message);
    }
  };
  
// Categories
  const fetchCategories = async (userId) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    //   .eq('user_id', userId)
    //   .order('created_at');
  
    if (!error && data) {
        setCategories(data);
      } else {
        console.error('Error fetching categories:', error?.message);
      }
  };

// Brands
const fetchBrands = async (userId) => {
    const { data, error } = await supabase
      .from('brands')
      .select('*');
  
    if (!error && data) {
        setBrands(data);
      } else {
        console.error('Error fetching categories:', error?.message);
      }
  };

// Supplier
const fetchSuppliers = async (userId) => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*');
  
    if (!error && data) {
        setSuppliers(data);
      } else {
        console.error('Error fetching categories:', error?.message);
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
  
    const { error } = await supabase
      .from('inventories')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('❌ Supabase delete error:', error.message);
      return;
    }
  
    setInventory((prevItems) => prevItems.filter((item) => item.id !== id));
  };
  
  
// Filtered Inventory
const filteredInventory = filterCategory
  ? inventory.filter((item) => item.category === filterCategory)
  : inventory;


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    fetchProfile();       
    fetchCategories(); 
    fetchBrands(); 
    fetchSuppliers();   
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
      <div className="flex items-center justify-between bg-white p-4 rounded shadow mb-6 w-full">
          {/* Left: Welcome */}
          <div className="flex items-center gap-4">
          <img
              src="/logo.png" 
              alt="Logo"
              className="w-12 h-12 object-contain"
              />
              <h2 className="text-xl font-bold">Ellry Cafe Inventory</h2>
              
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-4">

          <button onClick={() => navigate('/checklist')}
          className="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded text-sm "
          >
          Grocery Checklist
          </button>

          <button type="button" onClick={() => setIsCategoryModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex text-sm">
              Add Category</button>

          <button type="button" onClick={() => setIsBrandModalOpen(true)}
                                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm">Add Brand</button>
          <button type="button" onClick={() => setIsSupplierModalOpen(true)}
                                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm">Add Supplier</button>

          <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex text-sm">
          <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-3 5h3m-6 0h.01M12 16h3m-6 0h.01M10 3v4h4V3h-4Z"/>
          </svg>
          Inventory Report
          </button>

          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 flex text-white px-4 py-2 rounded text-sm">
          <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/>
          </svg> Logout
          </button>
      </div>
      </div>   


        <div className="w-full max-w-7xl mx-auto bg-white p-8 rounded shadow">
            
            <div className="flex flex-col md:flex-row gap-10">
                <div className="md:w-1/5 w-full">
                    <h2 className="text-xl font-bold capitalize">Welcome, {profile.full_name || profile.username}!</h2>
                    <p className="text-sm text-gray-500  mb-3">{formattedTime}</p>

                </div>
                <div className="md:w-4/5 w-full">
                    <div className="mb-0">
                        <label className="mb-1 mr-3 font-medium text-sm">Filter by Category</label>
                        <select
                            className="border p-2 rounded w-full max-w-xs text-sm"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                                {cat.name}
                            </option>
                            ))}
                        </select>
                    </div>
                </div>                
            </div>


            <div className="flex flex-col md:flex-row gap-10">
                {/* Left Column - Form */}
                <div className="md:w-1/5 w-full">
                    <h3 className="text-lg font-semibold mb-4">Add Item</h3>
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
                        {categories.map((cat) => (
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
                        {brands.map((bra) => (
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
                        {suppliers.map((sup) => (
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


                        <button className="w-full bg-sky-700 hover:bg-sky-800 text-white font-medium py-3 rounded flex items-center justify-center gap-2 text-sm">
                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9V4a1 1 0 0 0-1-1H8.914a1 1 0 0 0-.707.293L4.293 7.207A1 1 0 0 0 4 7.914V20a1 1 0 0 0 1 1h4M9 3v4a1 1 0 0 1-1 1H4m11 6v4m-2-2h4m3 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"/>
                        </svg>
                        Add Item
                        </button>
                    </form>   
                </div>

                {/* Right Column - Table */}
                <div className="md:w-4/5 w-full">
                <h3 className="text-lg font-semibold mb-4">Items</h3>

                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 bg-white text-sm">
                    <thead className="bg-gray-100 text-left text-xs">
                        <tr>
                        <th className="px-4 py-1 border-b">Item Name</th>
                        <th className="px-4 py-1 border-b">Category</th>
                        <th className="px-4 py-1">Brand</th>
                        <th className="px-4 py-1">Supplier</th>
                        <th className="px-4 py-1">Price</th>
                        <th className="px-4 py-1 border-b">Quantity</th>
                        <th className="px-4 py-1 border-b">Status</th>
                        <th className="px-4 py-1 border-b">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                    {inventory.length > 0 ? (
                        currentItems.map((item) => {
                        const isLowStock = item.quantity < 2;                       

                        return (
                            <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-1 border-b">{item.item_name}</td>
                            <td className="px-4 py-1 border-b">{item.category}</td>
                            <td className="px-4 py-1 border-b">{item.brand}</td>
                            <td className="px-4 py-1 border-b">{item.supplier}</td>
                            <td className="px-4 py-1 border-b">₱{item.price}</td>
                            
                            <td className="px-4 py-1 border-b flex items-center gap-2">
                                <button
                                onClick={() => {
                                    const newQty = parseInt(item.quantity || '0', 10) - 1;
                                    console.log('New Quantity:', newQty);
                                    updateQuantity(item.id, newQty);
                                  }}
                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                                disabled={parseInt(item.quantity) <= 0}
                                >
                                -
                                </button>

                                <span className="min-w-[20px] text-center">{item.quantity}</span>

                                <button
                                onClick={() => {
                                    const newQty = parseInt(item.quantity || '0', 10) + 1;
                                    console.log('New Quantity:', newQty);
                                    updateQuantity(item.id, newQty);
                                  }}
                                  
                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                                >
                                +
                                </button>

                            </td>

                            <td className="px-4 py-1 border-b text-center">
                                <span
                                    className={`text-xs font-semibold px-1 py-0 rounded-full ${
                                    isLowStock ? 'bg-red-600 text-red-600 text-xs' : 'text-xs bg-green-600 text-green-600' 
                                    }`}
                                >
                                    {isLowStock ? 'o' : 'o'}
                                </span>
                            </td>

                            <td className="px-4 py-1 border-b space-x-2">
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

    
    {/* Category Modal */}
    {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
            <form
            onSubmit={async (e) => {
                e.preventDefault();
                const {
                data: { user },
                } = await supabase.auth.getUser();
    
                const { error } = await supabase.from('categories').insert([
                {
                    user_id: user.id,
                    name: newCategory,
                },
                ]);
    
                if (!error) {
                setNewCategory('');
                setIsCategoryModalOpen(false);
                fetchCategories(user.id); // refresh
                }
            }}
            className="flex flex-col gap-4"
            >
            <input
                type="text"
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
                className="border p-2 rounded"
            />
            <div className="flex justify-end gap-2">
                <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:underline"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                Add
                </button>
            </div>
            </form>
        </div>
        </div>
    )}


    {/* Brand Modal */}
    {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Add Brand</h2>
            <form
            onSubmit={async (e) => {
                e.preventDefault();
                const {
                data: { user },
                } = await supabase.auth.getUser();
    
                const { error } = await supabase.from('brands').insert([
                {
                    user_id: user.id,
                    name: newBrand,
                },
                ]);
    
                if (!error) {
                setNewBrand('');
                setIsBrandModalOpen(false);
                fetchBrands(user.id); // refresh
                }
            }}
            className="flex flex-col gap-4"
            >
            <input
                type="text"
                placeholder="Brand name"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                required
                className="border p-2 rounded"
            />
            <div className="flex justify-end gap-2">
                <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:underline"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                Add
                </button>
            </div>
            </form>
        </div>
        </div>
    )}


    {/* Supplier Modal */}
    {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Add Supplier</h2>
            <form
            onSubmit={async (e) => {
                e.preventDefault();
                const {
                data: { user },
                } = await supabase.auth.getUser();
    
                const { error } = await supabase.from('suppliers').insert([
                {
                    user_id: user.id,
                    name: newSupplier,
                },
                ]);
    
                if (!error) {
                setNewSupplier('');
                setIsSupplierModalOpen(false);
                fetchSuppliers(user.id); // refresh
                }
            }}
            className="flex flex-col gap-4"
            >
            <input
                type="text"
                placeholder="Supplier name"
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                required
                className="border p-2 rounded"
            />
            <div className="flex justify-end gap-2">
                <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:underline"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                Add
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
            className="bg-blue-600 px-4 py-2 rounded text-white"
            >
            Save
            </button>
        </div>
        </div>
    </div>
    )}


    </div>
  );
}
