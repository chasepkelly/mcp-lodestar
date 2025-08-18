# Railway Deployment Guide

This project is now configured for Railway deployment! Railway is a great alternative to Smithery and provides reliable hosting for MCP servers.

## Quick Deploy

1. **Install Railway CLI** (optional but recommended):
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy to Railway**:
   ```bash
   # Option 1: Using Railway CLI
   railway login
   railway init
   railway up

   # Option 2: Using GitHub integration
   # Just push to your GitHub repo and connect it in Railway dashboard
   ```

## Environment Variables

Set these environment variables in your Railway project:

- `LODESTAR_API_KEY` - Your LodeStar API key (optional for demo mode)
- `LODESTAR_CLIENT_ID` - Your LodeStar client ID (optional for demo mode)
- `LODESTAR_CLIENT_SECRET` - Your LodeStar client secret (optional for demo mode)
- `LODESTAR_API_BASE_URL` - LodeStar API base URL (optional, defaults to production)

## How It Works

- **Docker Build**: Railway uses the `Dockerfile` to build your application
- **HTTP Server**: The server starts in HTTP mode when deployed to Railway
- **Health Checks**: Railway monitors `/health` endpoint for server health
- **Auto-scaling**: Railway automatically scales based on traffic

## Benefits of Railway

✅ **Reliable**: Much more stable than Smithery CLI approach
✅ **Simple**: Just push to GitHub and deploy
✅ **Scalable**: Automatic scaling and load balancing
✅ **Monitoring**: Built-in logs and metrics
✅ **Custom Domains**: Easy custom domain setup

## Local Development

For local development, the server still works in STDIO mode:

```bash
npm run build:stdio
npm run start:stdio
```

## MCP Integration

Once deployed, you can use your Railway URL as an MCP server endpoint. The server will automatically handle HTTP transport for MCP communication.

## Troubleshooting

- **Build fails**: Check the Railway logs for build errors
- **Server won't start**: Verify environment variables are set correctly
- **Health check fails**: Check if the `/health` endpoint is responding

## Migration from Smithery

This setup provides a much more reliable alternative to the Smithery CLI approach. The server automatically detects Railway environment and switches to HTTP mode.
