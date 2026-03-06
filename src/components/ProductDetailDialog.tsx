import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart, Package, DollarSign, Calendar } from 'lucide-react';
import type { Product } from '../lib/api';
import { useCart } from '../lib/CartContext';
import { toast } from 'sonner@2.0.3';

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
}: ProductDetailDialogProps) {
  const { addToCart } = useCart();

  if (!product) return null;

  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity < 10;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addToCart(product, 1);
    toast.success('Added to cart!', {
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {product.category}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Stock Status Badge */}
            {isOutOfStock && (
              <Badge className="absolute top-4 right-4 bg-gray-800 text-white text-sm">
                Out of Stock
              </Badge>
            )}
            {isLowStock && (
              <Badge className="absolute top-4 right-4 bg-orange-600 text-white text-sm">
                Only {product.stockQuantity} left!
              </Badge>
            )}
            
            {product.isClearance && !isOutOfStock && (
              <Badge className="absolute top-4 right-4 bg-red-600 text-white">
                Clearance
              </Badge>
            )}
            {product.team && (
              <Badge className="absolute top-4 left-4 bg-black text-white">
                {product.team}
              </Badge>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-red-600">
                  LKR {product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    LKR {product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <p className="text-sm text-green-600 font-medium">
                  Save LKR {(product.originalPrice - product.price).toFixed(2)} (
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)
                </p>
              )}
            </div>

            {/* Stock Availability */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center gap-3">
              <Package className={`w-5 h-5 ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`} />
              <div>
                <p className={`font-medium ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                </p>
                {!isOutOfStock && product.stockQuantity !== undefined && (
                  <p className="text-sm text-gray-600">
                    {isLowStock ? `Hurry! Only ${product.stockQuantity} items remaining` : `${product.stockQuantity} available`}
                  </p>
                )}
                {isOutOfStock && (
                  <p className="text-sm text-gray-600">
                    This item is currently unavailable. Contact us for restock information.
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600">
                {product.description || 'Official F1 merchandise. High-quality product for true Formula 1 fans.'}
              </p>
            </div>

            {/* Product Info */}
            <div className="mb-6 space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Gender:</span>
                <span className="font-medium capitalize">{product.gender}</span>
              </div>
              {product.team && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Team:</span>
                  <span className="font-medium">{product.team}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                🛒 Add items to your cart and checkout when ready
              </p>
              <p className="text-xs text-gray-600 mt-1">
                🚚 Free shipping on orders over LKR 5,000
              </p>
              {isOutOfStock && (
                <p className="text-xs text-gray-600 mt-1">
                  📧 Want to be notified when back in stock? Message us!
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}