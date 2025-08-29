# Dev Tools

Self-hosted utilities for common development tasks

<a href="https://tools.ztkent.com">🌐 View Tools</a>

## Tools

• **Unix Time Converter** - Convert Unix timestamps to human-readable dates and vice versa  
• **JSON Validator** - Validate, format, and minify JSON data with syntax highlighting  
• **IP & DNS Tools** - Check IP addresses, DNS records, and network information  
• **CSS Linter** - Validate CSS syntax and identify potential issues  

## Project Structure

```text
dev-tools/
├── main.go                # Application entry point
├── internal/
│   ├── routes/            # HTTP route handlers
│   └── services/          # Business logic services
├── web/
│   └── static/            # Frontend assets (CSS, JS, Templates)
├── docker-compose.yml     # Docker deployment configuration
├── Dockerfile             # Container build instructions
└── Makefile               # Build and deployment commands
```

## API Endpoints

- `GET /api/ip/current` - Get current IP information
- `GET /api/ip/analyze/{ip}` - Analyze IP address information
- `GET /api/dns/lookup?domain={domain}` - Lookup dns address details
