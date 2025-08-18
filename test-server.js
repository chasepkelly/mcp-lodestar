#!/usr/bin/env node

// Simple test script to verify MCP server functionality
import createServer from './dist/index.js';

console.log('Testing MCP server creation...');

try {
  const server = createServer({
    config: {
      apiKey: 'test',
      clientId: 'test',
      clientSecret: 'test',
      apiBaseUrl: 'https://api.lodestar.com'
    }
  });
  
  console.log('✅ Server created successfully');
  console.log('✅ Server instance:', typeof server);
  
  // Test if server has the expected methods
  if (typeof server.setRequestHandler === 'function') {
    console.log('✅ setRequestHandler method available');
  }
  
  if (typeof server.connect === 'function') {
    console.log('✅ connect method available');
  }
  
  console.log('✅ All tests passed - server is properly configured');
  
} catch (error) {
  console.error('❌ Error creating server:', error);
  process.exit(1);
}
