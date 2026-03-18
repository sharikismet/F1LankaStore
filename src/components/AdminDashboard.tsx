import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);

export function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  // NEW: State to track if we are editing an existing product
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '', price: '', originalPrice: '', image: '', 
    category: 'T-Shirts', gender: 'all', team: '', description: '', stockQuantity: '10'
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProducts();
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProducts();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('kv_store_a97df12b').select('*');
    if (!error && data) {
      const foundProducts = data.filter(item => item.key && item.key.toLowerCase().includes('product'));
      setProducts(foundProducts);
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from('kv_store_a97df12b').delete().eq('key', key);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`);
    } else {
      toast.success('Product deleted successfully!');
      fetchProducts(); 
    }
  };

  // NEW: Handle clicking the Edit button
  const handleEditClick = (p: any) => {
    const productData = typeof p.value === 'string' ? JSON.parse(p.value) : p.value;
    
    setFormData({
      name: productData.name || '',
      price: productData.price?.toString() || '',
      originalPrice: productData.originalPrice?.toString() || '',
      image: productData.image || '',
      category: productData.category || 'T-Shirts',
      gender: productData.gender || 'all',
      team: productData.team || '',
      description: productData.description || '',
      stockQuantity: productData.stockQuantity?.toString() || '10'
    });
    
    setEditingKey(p.key);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scrolls up to the form!
  };

  // NEW: Cancel an edit
  const handleCancelEdit = () => {
    setEditingKey(null);
    setFormData({
      name: '', price: '', originalPrice: '', image: '', 
      category: 'T-Shirts', gender: 'all', team: '', description: '', stockQuantity: '10'
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success('Logged in successfully');
    setLoading(false);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return toast.error('You must be logged in');

    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        stockQuantity: parseInt(formData.stockQuantity)
      };

      if (editingKey) {
        // UPDATE EXISTING PRODUCT
        const { error } = await supabase
          .from('kv_store_a97df12b')
          .update({ value: payload })
          .eq('key', editingKey);

        if (error) throw new Error(error.message);
        toast.success('Product updated successfully!');
        setEditingKey(null); // Exit edit mode
      } else {
        // CREATE NEW PRODUCT
        const { error } = await supabase.functions.invoke('make-server-a97df12b/products', {
          body: payload,
          method: 'POST',
        });
        if (error) throw new Error(error.message || "Server rejected the request");
        toast.success('Product added successfully!');
      }

      // Reset form and refresh list
      setFormData({
        name: '', price: '', originalPrice: '', image: '', 
        category: 'T-Shirts', gender: 'all', team: '', description: '', stockQuantity: '10'
      });
      fetchProducts();
      
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`, { duration: 10000 });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">F1 Lanka Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      
      {/* FORM SECTION */}
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-md mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingKey ? 'Edit Product' : 'Add New Product'}
          </h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        <form onSubmit={handleSubmitProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Product Name *</Label><Input name="name" value={formData.name} onChange={handleInputChange} required /></div>
            <div><Label>Image URL *</Label><Input name="image" value={formData.image} onChange={handleInputChange} required /></div>
            <div><Label>Price ($) *</Label><Input name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required /></div>
            <div><Label>Original Price</Label><Input name="originalPrice" type="number" step="0.01" value={formData.originalPrice} onChange={handleInputChange} /></div>
            <div>
              <Label>Category *</Label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border rounded-md p-2">
                <option value="T-Shirts">T-Shirts</option>
                <option value="Caps & Hats">Caps & Hats</option>
                <option value="Hoodies & Sweatshirts">Hoodies</option>
                <option value="Model Cars">Model Cars</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            <div>
              <Label>Gender *</Label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border rounded-md p-2">
                <option value="all">All / Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div><Label>Team</Label><Input name="team" value={formData.team} onChange={handleInputChange} /></div>
            <div><Label>Stock</Label><Input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} /></div>
          </div>
          <div><Label>Description</Label><Textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} /></div>
          
          <div className="flex gap-4 mt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : (editingKey ? 'Update Product' : 'Upload Product')}
            </Button>
            {editingKey && (
              <Button type="button" variant="outline" className="flex-1" onClick={handleCancelEdit}>
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* INVENTORY SECTION */}
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Manage Inventory</h2>
        
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Your store is currently empty.</p>
        ) : (
          <div className="space-y-4">
            {products.map((p) => {
              const productData = typeof p.value === 'string' ? JSON.parse(p.value) : p.value;
              
              return (
                // LAYOUT FIX: Added flex-wrap and min-w-0 to stop text from squishing buttons
                <div key={p.key} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4">
                  
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                    <img 
                      src={productData.image || 'https://via.placeholder.com/50'} 
                      alt={productData.name} 
                      className="w-16 h-16 object-cover rounded-md border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {/* LAYOUT FIX: Added 'truncate' to keep long titles on one line */}
                      <h3 className="font-bold text-gray-900 truncate" title={productData.name}>
                        {productData.name}
                      </h3>
                      <p className="text-sm text-gray-500">{productData.category} • ${productData.price}</p>
                    </div>
                  </div>
                  
                  {/* LAYOUT FIX: Grouped buttons together */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex-1 sm:flex-none"
                      onClick={() => handleEditClick(p)}
                    >
                      Edit
                    </Button>
                    <Button 
                      type="button"
                      variant="destructive" 
                      className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => handleDelete(p.key)}
                    >
                      Delete
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}