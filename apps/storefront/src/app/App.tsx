import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import { AboutPage } from '../pages/AboutPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ContactPage } from '../pages/ContactPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PaymentPage } from '../pages/PaymentPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductsPage } from '../pages/ProductsPage';
import { PromotionsPage } from '../pages/PromotionsPage';

export function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/produits" element={<ProductsPage />} />
          <Route path="/produit/:slug" element={<ProductDetailPage />} />

          <Route
            path="/promotions"
            element={<PromotionsPage />}
          />

          <Route
            path="/a-propos"
            element={<AboutPage />}
          />

          <Route
            path="/contact"
            element={<ContactPage />}
          />

          <Route path="/panier" element={<CartPage />} />
          <Route path="/commande" element={<CheckoutPage />} />

          <Route
            path="/commande/:reference/paiement"
            element={<PaymentPage />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
