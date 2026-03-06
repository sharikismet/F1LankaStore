import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductFilters } from './components/ProductFilters';
import { ProductCard } from './components/ProductCard';
import { ProductDetailDialog } from './components/ProductDetailDialog';
import { CartDrawer } from './components/CartDrawer';
import { TeamSelector } from './components/TeamSelector';
import { MobileFilterSheet } from './components/MobileFilterSheet';
import { Footer } from './components/Footer';
import { CartProvider } from './lib/CartContext';
import { getProducts, initSampleData, testServerConnection } from './lib/api';
import type { Product } from './lib/api';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from './components/ui/pagination';

const ITEMS_PER_PAGE = 10;

function AppContent() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [teamSelectorOpen, setTeamSelectorOpen] = useState(false);
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // WhatsApp number - replace with your actual WhatsApp number (include country code without +)
  const WHATSAPP_NUMBER = '94710773717'; // Example: Sri Lanka number

  // Test server connection on mount
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    const result = await testServerConnection();
    if (!result.success) {
      setServerError(result.message);
      toast.error('Server Connection Failed', {
        description: result.message,
      });
    } else {
      setServerError(null);
      // If server is connected, load products
      loadProducts();
    }
  };

  // Fetch products from database
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const fetchedProducts = await getProducts();
    setProducts(fetchedProducts);
    setLoading(false);
    
    // Check if we need to initialize sample data
    if (fetchedProducts.length === 0 && !initialized) {
      setInitialized(true);
    }
  };

  // Initialize sample data
  const handleInitSampleData = async () => {
    const success = await initSampleData();
    if (success) {
      toast.success('Sample data loaded successfully!');
      await loadProducts();
    } else {
      toast.error('Failed to load sample data', {
        description: 'Please check the console for more details.',
      });
    }
  };

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter by category
      const categoryMatch = selectedCategories.length === 0 || 
        selectedCategories.includes(product.category);
      
      // Filter by gender
      const genderMatch = selectedGender === 'all' || 
        product.gender === 'all' || 
        product.gender === selectedGender;
      
      // Filter by search query (search in name, description, category, and team)
      const searchMatch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.team && product.team.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return categoryMatch && genderMatch && searchMatch;
    });
  }, [products, selectedCategories, selectedGender, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedGender, searchQuery]);

  // Header interaction handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleGenderClick = (gender: string) => {
    setSelectedGender(gender);
  };

  const handleLogoClick = () => {
    // Refresh the page
    window.location.reload();
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onSearch={handleSearch}
        onCategoryClick={handleCategoryClick}
        onGenderClick={handleGenderClick}
        onLogoClick={handleLogoClick}
        onCartClick={() => setCartDrawerOpen(true)}
        onTeamSelectorClick={() => setTeamSelectorOpen(true)}
        onFiltersClick={() => setMobileFilterSheetOpen(true)}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Server Error Alert */}
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Server Connection Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-2">{serverError}</p>
              <p className="text-sm">
                The Supabase Edge Function needs to be deployed. Please check:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Your Supabase project is set up correctly</li>
                <li>The Edge Function is deployed in your Supabase dashboard</li>
                <li>Environment variables are configured properly</li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={checkServerConnection}
              >
                Retry Connection
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-8">
          {/* Filters Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block">
            <ProductFilters
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              selectedGender={selectedGender}
              onGenderChange={setSelectedGender}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header with Mobile Filter Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobileFilterSheetOpen(true)}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : `${filteredProducts.length} Items`}
                  {searchQuery && ` - Search results for \"${searchQuery}\"`}
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-16">
                <p className="text-gray-500">Loading products...</p>
              </div>
            )}

            {/* Empty State - No Products in Database */}
            {!loading && products.length === 0 && initialized && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg mb-4">Your store is empty!</p>
                <p className="text-gray-400 text-sm mb-6">Get started by adding some sample products to your database.</p>
                <Button onClick={handleInitSampleData}>
                  Load Sample Products
                </Button>
              </div>
            )}

            {/* Products Grid - 2 columns on mobile, 2 on tablet, 3 on desktop */}
            {!loading && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(product => (
                  <ProductCard 
                    key={product.id} 
                    {...product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            )}

            {/* No Results After Filtering */}
            {!loading && products.length > 0 && filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No products found matching your {searchQuery ? 'search' : 'filters'}.</p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchQuery ? 'Try a different search term.' : 'Try adjusting your filter selection.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {!loading && filteredProducts.length > ITEMS_PER_PAGE && (() => {
              const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
              
              return (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(prev => prev - 1);
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {/* First Page */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(1);
                          }}
                          isActive={currentPage === 1}
                          className="cursor-pointer"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>

                      {/* Ellipsis after first page */}
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Previous page number */}
                      {currentPage > 2 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(currentPage - 1);
                            }}
                            className="cursor-pointer"
                          >
                            {currentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Current page (if not first or last) */}
                      {currentPage !== 1 && currentPage !== totalPages && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={(e) => e.preventDefault()}
                            isActive={true}
                            className="cursor-pointer"
                          >
                            {currentPage}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Next page number */}
                      {currentPage < totalPages - 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(currentPage + 1);
                            }}
                            className="cursor-pointer"
                          >
                            {currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Ellipsis before last page */}
                      {currentPage < totalPages - 2 && totalPages > 1 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Last Page */}
                      {totalPages > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(totalPages);
                            }}
                            isActive={currentPage === totalPages}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailDialog
        product={selectedProduct}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Cart Drawer */}
      <CartDrawer
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
        whatsappNumber={WHATSAPP_NUMBER}
      />

      {/* Team Selector */}
      <TeamSelector
        open={teamSelectorOpen}
        onOpenChange={setTeamSelectorOpen}
        onTeamSelect={(team) => {
          setSelectedTeam(team);
          setSelectedCategories([]);
          setSelectedGender('all');
          setSearchQuery('');
        }}
      />

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        open={mobileFilterSheetOpen}
        onOpenChange={setMobileFilterSheetOpen}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <AppContent />
      <Toaster />
    </CartProvider>
  );
}

export default App;