# LodeStar MCP Server

A production-ready Model Context Protocol (MCP) server for LodeStar title and closing cost calculations.

## Features

- 🔐 **Secure Session Management** - Automatic session refresh with timeout handling
- 📊 **Complete API Coverage** - All LodeStar API endpoints implemented
- 🛡️ **Input Validation** - Comprehensive validation and sanitization
- 📝 **Structured Logging** - Professional logging with multiple levels
- ⚡ **Error Recovery** - Robust error handling and graceful shutdown
- 🔧 **Modular Architecture** - Clean, maintainable code structure
- 📚 **Rich Documentation** - Built-in resources and workflow guides

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- LodeStar API credentials

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd lodestar-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:
```env
LODESTAR_USERNAME=your-email@example.com
LODESTAR_PASSWORD=your-password
```

5. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

```bash
# Production mode
npm start

# Development mode with TypeScript
npm run dev

# With custom log level
LOG_LEVEL=DEBUG npm start
```

### Available Tools

| Tool | Description |
|------|-------------|
| `login` | Authenticate with LodeStar |
| `closing_cost_calculations` | Calculate all closing costs |
| `property_tax` | Get property tax information |
| `get_endorsements` | List available endorsements |
| `get_sub_agents` | Find title agents |
| `get_counties` | List counties in a state |
| `get_townships` | List townships in a county |
| `get_questions` | Get state-specific questions |
| `geocode_check` | Verify address location |
| `get_appraisal_modifiers` | Get appraisal fee modifiers |

### Workflows

#### Quick Purchase Quote
```
1. login
2. closing_cost_calculations (purpose: '11', search_type: 'CFPB')
3. property_tax (if needed)
```

#### Complete Refinance with Reissue
```
1. login
2. get_endorsements
3. get_questions
4. closing_cost_calculations (purpose: '04', search_type: 'CFPB')
5. property_tax (if needed)
```

### Resources

Access built-in documentation:
- `lodestar://api-info` - API configuration and status
- `lodestar://fee-names` - Standard fee terminology
- `lodestar://workflows` - Complete workflow guides

### Prompts

Pre-configured prompts for common tasks:
- `purchase_calculation` - Home purchase closing costs
- `refinance_calculation` - Refinance closing costs
- `full_workflow` - Guided complete workflow

## Project Structure

```
src/
├── index.ts           # Main server implementation
├── types.ts           # TypeScript interfaces
├── constants.ts       # Application constants
├── validation.ts      # Input validation utilities
├── logger.ts          # Logging system
├── config.ts          # Configuration management
├── session-manager.ts # Session handling
└── tool-handlers.ts   # Tool implementations
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LODESTAR_USERNAME` | Yes | - | Your LodeStar username |
| `LODESTAR_PASSWORD` | Yes | - | Your LodeStar password |
| `LODESTAR_CLIENT_NAME` | No | `LodeStar_Demo` | Client identifier |
| `LODESTAR_BASE_URL` | No | `https://www.lodestarss.com` | API base URL |
| `LOG_LEVEL` | No | `INFO` | Logging level |

### Logging Levels

- `DEBUG` - Detailed debugging information
- `INFO` - General information (default)
- `WARN` - Warning messages
- `ERROR` - Error messages only

## Development

### Building

```bash
# Clean build
npm run rebuild

# Type checking only
npm run type-check
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## API Reference

### Purpose Types

- `00` - Standard Refinance
- `04` - Refinance with Reissue Credit
- `11` - Purchase

### Search Types

- `CFPB` - All fees (tax, recording, title)
- `Title` - Title fees and premiums only

### Property Types

1. Single Family
2. Multi Family
3. Condo
4. Coop
5. PUD
6. Manufactured
7. Land

### Loan Types

1. Conventional
2. FHA
3. VA
4. USDA

## Error Handling

The server includes comprehensive error handling:

- **Validation Errors** - Invalid input parameters
- **API Errors** - LodeStar API issues
- **Session Errors** - Authentication failures
- **Network Errors** - Connection issues

All errors are logged with details and returned in a structured format.

## Security

- Input sanitization on all string inputs
- SQL injection prevention
- XSS attack prevention
- Secure session management
- Password masking in logs
- Environment-based configuration

## Support

For issues or questions:
1. Check the built-in documentation resources
2. Review the workflow guides
3. Enable DEBUG logging for detailed information
4. Check LodeStar API documentation

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass
2. Code follows the existing style
3. Documentation is updated
4. Types are properly defined