# 🏠 LodeStar MCP Chat App

A lightweight chat application for interacting with the LodeStar MCP server. Perfect for MVP demos!

## 🚀 Features

- **Real-time chat interface** with your LodeStar MCP server
- **Closing cost calculations** for any property
- **Property tax information** lookups
- **Title company searches** by location
- **Address geocoding** verification
- **Quick action buttons** for common queries
- **Modern, responsive UI** that works on all devices

## 🎯 Demo Capabilities

### Quick Actions:
- 🏠 **Closing Costs**: Calculate all fees for property purchases
- 📊 **Property Tax**: Get tax information for any address
- 🏢 **Title Companies**: Find title companies in specific areas
- 🛠️ **Available Tools**: See all available MCP tools

### Natural Language Queries:
- "Calculate closing costs for 123 Main Street, Austin, TX"
- "Get property tax info for Austin, TX"
- "Find title companies in Travis County, TX"

## 🚀 Deployment

### Railway (Recommended)
1. Push this code to a GitHub repository
2. Connect to Railway
3. Deploy automatically

### Local Development
```bash
cd chat-app
npm install
npm run dev
```

## 🔧 Configuration

The chat app automatically connects to your LodeStar MCP server at:
`https://mcp-lodestar-production.up.railway.app/mcp`

## 📱 Usage

1. **Open the chat interface**
2. **Type your query** or use quick action buttons
3. **Get instant responses** from the LodeStar MCP server
4. **View formatted results** with proper JSON formatting

## 🎨 UI Features

- **Modern gradient design** with smooth animations
- **Responsive layout** that works on desktop and mobile
- **Real-time status indicators** showing connection state
- **Loading animations** during API calls
- **Error handling** with clear error messages

## 🔗 Integration

This chat app demonstrates how to:
- Connect to MCP servers via HTTP
- Handle MCP protocol responses
- Parse natural language into tool calls
- Display formatted results to users

Perfect for demos, testing, and showcasing your LodeStar MCP server capabilities!
