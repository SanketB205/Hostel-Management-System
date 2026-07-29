import React from 'react';
import { renderToString } from 'react-dom/server';
import RoomsPage from './src/pages/RoomsPage';

try {
  const html = renderToString(<RoomsPage />);
  console.log("RENDER_SUCCESS");
} catch (error) {
  console.error("RENDER_ERROR:", error);
}
