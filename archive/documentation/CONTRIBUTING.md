# Contributing to TerraFusion

First of all, thank you for considering contributing to TerraFusion! Your contributions help make this platform better for everyone in the real estate valuation community.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand the expectations we have for everyone who contributes to this project.

## How Can I Contribute?

### Reporting Bugs

If you find a bug in the application, please create a new issue using the Bug Report template. Be sure to include:

- A clear description of the bug
- Steps to reproduce the issue
- Expected behavior
- Screenshots if applicable
- Environment details (browser, OS, device)

### Suggesting Features

Have an idea for a new feature or improvement? Create a new issue using the Feature Request template. Be detailed about:

- The problem your feature solves
- How you envision the solution working
- Any alternatives you've considered
- How this would benefit TerraFusion users

### Contributing Code

1. **Fork the repository** and create your branch from `main`.
2. **Install dependencies** using `npm install`.
3. **Make your changes**, following our code style guidelines.
4. **Add tests** for any new functionality.
5. **Ensure tests pass** by running `npm test`.
6. **Update documentation** as needed.
7. **Submit a pull request** with a clear description of your changes.

### Pull Request Process

1. Update the README.md or relevant documentation with details of changes, if applicable.
2. The PR should work in all browsers we support.
3. Follow the pull request template when submitting.
4. PRs need at least one approval from a project maintainer before merging.

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm (v8+)
- PostgreSQL (v13+)

### Local Development

1. Clone your forked repository
   ```bash
   git clone https://github.com/yourusername/terrafusion.git
   cd terrafusion
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

## Code Style Guidelines

- Follow the existing code style in the project.
- Use TypeScript for all new code.
- Write JSDoc comments for all functions and classes.
- Use meaningful variable and function names.
- Keep functions small and focused on a single responsibility.
- Format code using Prettier before submitting (`npm run format`).
- Lint your code using ESLint (`npm run lint`).

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for our commit messages:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, semicolons)
- `refactor:` Code changes that neither fix bugs nor add features
- `perf:` Performance improvements
- `test:` Adding or correcting tests
- `chore:` Changes to the build process, tools, etc.

Example: `feat: add comparable property drag-and-drop functionality`

## Documentation

- Update documentation for any code changes you make.
- Write clear, concise documentation that a new user can understand.
- Include code examples where appropriate.

## Questions?

If you have any questions, feel free to reach out to the maintainers or create a discussion on GitHub.

Thank you for contributing to TerraFusion!