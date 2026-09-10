import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import { CompanyProvider } from '../context/CompanyContext';
import { AboutPage } from '../pages/AboutPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ContactPage } from '../pages/ContactPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PaymentPage } from '../pages/PaymentPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductsPage } from '../pages/ProductsPage';
import { RealizationsPage } from '../pages/RealizationsPage';
import { ServicesPage } from '../pages/ServicesPage';
import { RealizationDetailPage } from '../pages/RealizationDetailPage';
import { ServiceDetailPage } from '../pages/ServiceDetailPage';

export function App() {
  return (
    <BrowserRouter>
      <CompanyProvider>
        <CartProvider>
          <Routes>
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/produits"
              element={<ProductsPage />}
            />

            <Route
              path="/produit/:slug"
              element={<ProductDetailPage />}
            />

            <Route
              path="/produits/:slug"
              element={<ProductDetailPage />}
            />

            <Route
              path="/services"
              element={<ServicesPage />}
            />

            <Route
              path="/services/:slug"
              element={<ServiceDetailPage />}
            />

            <Route
              path="/realisations"
              element={<RealizationsPage />}
            />

            <Route
              path="/realisations/:slug"
              element={<RealizationDetailPage />}
            />

            <Route
              path="/a-propos"
              element={<AboutPage />}
            />

            <Route
              path="/contact"
              element={<ContactPage />}
            />

            <Route
              path="/panier"
              element={<CartPage />}
            />

            <Route
              path="/commande"
              element={<CheckoutPage />}
            />

            <Route
              path="/commande/:reference/paiement"
              element={<PaymentPage />}
            />

            <Route
              path="/promotions"
              element={
                <Navigate
                  to="/produits"
                  replace
                />
              }
            />

            <Route
              path="*"
              element={<NotFoundPage />}
            />
          </Routes>
        </CartProvider>
      </CompanyProvider>
    </BrowserRouter>
  );
}
