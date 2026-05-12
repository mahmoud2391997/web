import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CoffeeIcon, UtensilsIcon, PackageIcon, PlusIcon, MinusIcon } from 'lucide-react';

interface CafeProduct {
  id: string;
  name: string;
  category: 'drinks' | 'snacks' | 'meals';
  price: number;
  stock: number;
}

const CafeSection = () => {
  const [products] = useState<CafeProduct[]>([
    { id: '1', name: 'Coffee', category: 'drinks', price: 15, stock: 50 },
    { id: '2', name: 'Pepsi', category: 'drinks', price: 10, stock: 30 },
    { id: '3', name: 'Water', category: 'drinks', price: 5, stock: 100 },
    { id: '4', name: 'Chips', category: 'snacks', price: 12, stock: 25 },
    { id: '5', name: 'Chocolate', category: 'snacks', price: 20, stock: 40 },
    { id: '6', name: 'Burger', category: 'meals', price: 50, stock: 15 },
    { id: '7', name: 'Pizza Slice', category: 'meals', price: 35, stock: 20 },
  ]);

  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getProductsByCategory = (category: string) => {
    return products.filter(product => product.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'drinks': return <CoffeeIcon className="w-4 h-4" />;
      case 'snacks': return <PackageIcon className="w-4 h-4" />;
      case 'meals': return <UtensilsIcon className="w-4 h-4" />;
      default: return <PackageIcon className="w-4 h-4" />;
    }
  };

  const ProductCard = ({ product }: { product: CafeProduct }) => (
    <Card className="bg-slate-700 border-slate-600">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <span>{product.name}</span>
          <Badge variant={product.stock < 10 ? 'destructive' : 'secondary'}>
            {product.stock}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-green-400 font-bold">{product.price} EGP</div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => removeFromCart(product.id)}
            disabled={!cart[product.id]}
            className="w-8 h-8 p-0"
          >
            <MinusIcon className="w-4 h-4" />
          </Button>
          <span className="text-white min-w-[2ch] text-center">
            {cart[product.id] || 0}
          </span>
          <Button
            size="sm"
            onClick={() => addToCart(product.id)}
            disabled={product.stock === 0}
            className="w-8 h-8 p-0 bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Café & Canteen</h2>
        {Object.keys(cart).length > 0 && (
          <Card className="bg-green-600 border-0">
            <CardContent className="p-4">
              <div className="text-white font-bold">
                Cart Total: {getCartTotal()} EGP
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="drinks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-700">
          <TabsTrigger value="drinks" className="data-[state=active]:bg-blue-600 text-white">
            <CoffeeIcon className="w-4 h-4 mr-2" />
            Drinks
          </TabsTrigger>
          <TabsTrigger value="snacks" className="data-[state=active]:bg-blue-600 text-white">
            <PackageIcon className="w-4 h-4 mr-2" />
            Snacks
          </TabsTrigger>
          <TabsTrigger value="meals" className="data-[state=active]:bg-blue-600 text-white">
            <UtensilsIcon className="w-4 h-4 mr-2" />
            Meals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drinks">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getProductsByCategory('drinks').map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="snacks">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getProductsByCategory('snacks').map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {getProductsByCategory('meals').map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {Object.keys(cart).length > 0 && (
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Current Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(cart).map(([productId, quantity]) => {
              const product = products.find(p => p.id === productId);
              if (!product) return null;
              return (
                <div key={productId} className="flex justify-between items-center text-white">
                  <span>{product.name} x {quantity}</span>
                  <span className="text-green-400">{product.price * quantity} EGP</span>
                </div>
              );
            })}
            <div className="border-t border-slate-600 pt-4 flex justify-between items-center">
              <span className="text-white font-bold">Total:</span>
              <span className="text-green-400 font-bold text-lg">{getCartTotal()} EGP</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setCart({})} variant="outline" className="flex-1">
                Clear Cart
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                Process Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CafeSection;
