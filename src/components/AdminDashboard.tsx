import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    image: '',
    category: 'T-Shirts',
    gender: 'all',
    team: '',
    description: '',
    stockQuantity: '10'
  });

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

 const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return toast.error('You must be logged in');

    setLoading(true);
    try {
      // 1. We removed the extra "/server" from this URL to match your api.ts file
      const url = `${supabaseUrl}/functions/v1/make-server-a97df12b/products`;
      
      console.log("Sending request to:", url);
      console.log("Using token:", session.access_token.substring(0, 10) + "...");

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
          stockQuantity: parseInt(formData.stockQuantity)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // This will print the exact server error to your screen!
        console.error("Server Error:", result);
        throw new Error(`Server said: ${result.error || response.statusText}. Details: ${result.details || 'None'}`);
      }

      toast.success('Product added successfully!');
      
      setFormData({
        name: '', price: '', originalPrice: '', image: '', 
        category: 'T-Shirts', gender: 'all', team: '', description: '', stockQuantity: '10'
      });
    } catch (error: any) {
      // Displays the detailed error message in the toast notification
      toast.error(error.message, { duration: 6000 });
      console.error('Full catch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, show login screen
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">F1 Lanka Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // If logged in, show product upload form
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Add New Product</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>

        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product Name *</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>Image URL *</Label>
              <Input name="image" value={formData.image} onChange={handleInputChange} placeholder="https://..." required />
            </div>
            <div>
              <Label>Price ($) *</Label>
              <Input name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
            </div>
            <div>
              <Label>Original Price (Optional, for discounts)</Label>
              <Input name="originalPrice" type="number" step="0.01" value={formData.originalPrice} onChange={handleInputChange} />
            </div>
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
            <div>
              <Label>Team (Optional)</Label>
              <Input name="team" value={formData.team} onChange={handleInputChange} placeholder="Ferrari, Red Bull, etc." />
            </div>
            <div>
              <Label>Stock Quantity</Label>
              <Input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} />
            </div>
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Adding Product...' : 'Upload Product to Store'}
          </Button>
        </form>
      </div>
    </div>
  );
}