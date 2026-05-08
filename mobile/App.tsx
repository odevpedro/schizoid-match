import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppNavigator />
  </QueryClientProvider>
);

export default App;
