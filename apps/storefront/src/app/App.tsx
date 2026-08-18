import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { FoundationPreviewPage } from '../pages/FoundationPreviewPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<FoundationPreviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}
