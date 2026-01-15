# GitHub Copilot Instructions for NovaBot v2

## Project Overview
This is a Discord.js bot built with TypeScript. The bot uses modern Discord.js features and follows TypeScript best practices.

## Tech Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Discord.js (v14+)
- **Database**: MySQL2
- **Environment**: dotenv for configuration

## Code Style & Conventions

### TypeScript
- Use strict TypeScript with proper type annotations
- Prefer interfaces over type aliases for object shapes
- Use async/await over promises chains
- Enable strict null checks and no implicit any

### Discord.js Patterns
- Use slash commands (interactions) over message commands
- Implement proper error handling for all Discord API calls
- Use embeds for rich message formatting
- Implement proper permission checks before executing commands
- Use Discord.js builders (SlashCommandBuilder, EmbedBuilder, etc.)

### Project Structure
- Bot logic in `src/Bot.ts`
- Entry point in `src/index.ts`
- Commands should be modular and organized by feature
- Events should be in separate handler files
- Utilities and helpers in dedicated directories

### Best Practices
- Always validate user input and interaction data
- Use environment variables for sensitive data (tokens, IDs)
- Implement graceful shutdown handlers
- Log errors with meaningful context
- Use proper Discord API rate limiting
- Cache Discord objects appropriately
- Handle Discord gateway disconnects and reconnections

### Command Structure
- Each command should have proper description and options
- Use command options with appropriate types (string, integer, user, role, etc.)
- Implement command cooldowns where appropriate
- Check user permissions before execution
- Provide helpful error messages to users

### Error Handling
- Catch and log all errors appropriately
- Send user-friendly error messages to Discord
- Don't expose sensitive information in error messages
- Use try-catch blocks for async operations

### Database
- Use prepared statements to prevent SQL injection
- Handle database connection errors gracefully
- Close connections properly
- Use transactions for related operations

## Common Patterns

### Command Registration
```typescript
const command = new SlashCommandBuilder()
    .setName('name')
    .setDescription('description');
```

### Interaction Handling
```typescript
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    // Handle command
});
```

### Embeds
```typescript
const embed = new EmbedBuilder()
    .setTitle('Title')
    .setDescription('Description')
    .setColor('#0099ff');
```

## Environment Variables
Use `.env` file for configuration:
- `DISCORD_TOKEN`: Bot token
- `CLIENT_ID`: Discord application ID
- `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`: MySQL connection details

## Notes
- Always defer replies for operations that might take longer than 3 seconds
- Use ephemeral messages for error responses when appropriate
- Implement proper logging for debugging
- Follow Discord's rate limits and best practices
