# LodeStar MCP Server

An MCP (Model Context Protocol) server for the LodeStar API, enabling AI assistants to calculate closing costs, title fees, recording fees, transfer taxes, and property taxes for real estate transactions.

## Features

- 🏠 **Complete Closing Cost Calculations** - Calculate all fees for purchases and refinances
- 📋 **Title Insurance Premiums** - Get accurate title policy pricing
- 🏛️ **Recording Fees & Transfer Taxes** - State and county-specific calculations
- 🏘️ **Property Tax Estimates** - Retrieve property tax information
- 📑 **Endorsement Management** - Access available endorsements by location
- 🏢 **Sub-Agent Selection** - Choose from available title agents
- 📍 **Geocoding Support** - Verify addresses for accurate tax calculations

## Installation

### From npm
```bash
npm install -g @chasepkelly/mcp-lodestar
```

### From GitHub
```bash
git clone https://github.com/chasepkelly/mcp-lodestar.git
cd mcp-lodestar
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```env
# Required
LODESTAR_USERNAME=your-email@example.com
LODESTAR_PASSWORD=your-password

# Optional (defaults shown)
LODESTAR_CLIENT_NAME=LodeStar_Demo
LODESTAR_BASE_URL=https://www.lodestarss.com
```

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lodestar": {
      "command": "npx",
      "args": ["@chasepkelly/mcp-lodestar"],
      "env": {
        "LODESTAR_USERNAME": "your-email@example.com",
        "LODESTAR_PASSWORD": "your-password",
        "LODESTAR_CLIENT_NAME": "Your_Client_Name"
      }
    }
  }
}
```

Or if installed locally:

```json
{
  "mcpServers": {
    "lodestar": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-lodestar/build/index.js"],
      "env": {
        "LODESTAR_USERNAME": "your-email@example.com",
        "LODESTAR_PASSWORD": "your-password",
        "LODESTAR_CLIENT_NAME": "Your_Client_Name"
      }
    }
  }
}
```

## Available Tools

### Core Calculation Tools

#### `closing_cost_calculations`
Calculate all closing costs including title fees, recording fees, and transfer taxes.

**Parameters:**
- `state` (required): 2-letter state abbreviation
- `county` (required): County name
- `township` (required): Township/city name
- `search_type` (required): "CFPB" or "Title"
- `purpose` (required): "00" (Refinance), "04" (Refinance w/Reissue), "11" (Purchase)
- `loan_amount`: Loan amount
- `purchase_price`: Purchase price
- `address`: Property address
- And many optional parameters for detailed calculations

#### `property_tax`
Get property tax information and calculations.

**Parameters:**
- `state` (required): 2-letter state abbreviation
- `county` (required): County name
- `city` (required): City name
- `address` (required): Property address
- `close_date` (required): Closing date (YYYY-MM-DD)
- `file_name` (required): File name for tracking
- `purchase_price` (required): Purchase price or market value

### Information Retrieval Tools

#### `get_endorsements`
Get available title insurance endorsements for a location.

#### `get_sub_agents`
Get available title agents/escrow companies.

#### `get_counties`
Get available counties for a state.

#### `get_townships`
Get available townships in a county.

#### `get_questions`
Get location-specific questions for accurate calculations.

#### `geocode_check`
Verify if an address is in a township with additional taxes.

#### `get_appraisal_modifiers`
Get available appraisal modifiers (if appraisal calculations are enabled).

## Usage Workflows

### Mortgage Originator - Simplified
```
1. login (automatic)
2. closing_cost_calculations
3. property_tax (if needed)
```

### Mortgage Originator - Full
```
1. login (automatic)
2. get_sub_agents (select title agent)
3. get_endorsements (select endorsements)
4. get_questions (answer location-specific questions)
5. closing_cost_calculations
6. property_tax (if needed)
```

### Title Agent - Simplified
```
1. login (automatic)
2. closing_cost_calculations
3. property_tax (if needed)
```

### Title Agent - Full
```
1. login (automatic)
2. get_endorsements
3. get_questions
4. closing_cost_calculations
5. property_tax (if needed)
```

## Example Usage in Claude

Once configured, you can ask Claude:

- "Calculate closing costs for a home purchase in Hudson County, NJ for a $500,000 purchase with $400,000 loan"
- "Get property tax information for 110 Jefferson St, Hoboken, NJ"
- "Show me available title insurance endorsements for a refinance in California"
- "What title agents are available in Cook County, Illinois?"
- "Walk me through a complete mortgage originator workflow"

## Resources

The server provides these MCP resources:

- `lodestar://api-info` - API configuration and workflow information
- `lodestar://fee-names` - Standard title fee names reference

## Prompts

Pre-configured prompts for common workflows:

- `purchase_calculation` - Calculate costs for a home purchase
- `refinance_calculation` - Calculate costs for a refinance
- `full_workflow` - Complete guided workflow

## Testing

Test the server locally:

```bash
# Using MCP Inspector
npx @modelcontextprotocol/inspector node build/index.js

# Or run the test script
npm test
```

## API Documentation

For detailed API documentation, visit: [LodeStar API Docs](https://www.lodestarss.com/API/)

### Important Notes

- **Session Management**: The server automatically handles login and session management
- **Rate Limiting**: Be mindful of API rate limits
- **Charges**: Some features like property tax and appraisal calculations may incur additional charges
- **Client Name**: Ensure you use the correct client name provided by LodeStar

## Support

For LodeStar API support: support@lssoftwaresolutions.com

For MCP server issues: [GitHub Issues](https://github.com/chasepkelly/lodestar-mcp-server/issues)

## License

MIT License - see LICENSE file for details

## Disclaimer

This MCP server is a third-party integration and is not officially affiliated with LodeStar Software Solutions. Always verify calculations for production use.