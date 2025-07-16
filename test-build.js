// Simple test to verify the server can be imported
import { createServer } from './dist/server.js';
import { ApiClient } from './dist/api/client.js';

console.log('Testing build...');

try {
  // Create a mock API client
  const mockClient = new ApiClient({
    baseUrl: 'https://example.com',
    username: 'test',
    appPassword: 'test',
  });

  // Try to create a server
  const server = createServer({
    name: 'test-server',
    version: '1.0.0',
    apiClient: mockClient,
  });

  console.log('✅ Build test passed! Server created successfully.');
} catch (error) {
  console.error('❌ Build test failed:', error);
  process.exit(1);
}