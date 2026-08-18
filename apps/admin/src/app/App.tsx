import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminFoundationPage } from '../pages/AdminFoundationPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<AdminFoundationPage />} />
      </Routes>
    </BrowserRouter>
  );
}
