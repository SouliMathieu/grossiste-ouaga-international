import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { HomePage } from '../pages/HomePage';
import { PaymentPage } from '../pages/PaymentPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductsPage } from '../pages/ProductsPage';

export function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/produits" element={<ProductsPage />} />
          <Route path="/produit/:slug" element={<ProductDetailPage />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/commande" element={<CheckoutPage />} />
          <Route
            path="/commande/:reference/paiement"
            element={<PaymentPage />}
          />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
