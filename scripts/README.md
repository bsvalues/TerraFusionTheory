# TerraFusionTheory Automation Scripts

This directory contains all automation, ETL, validation, and deployment scripts for the project.

## Unified CLI

Run the interactive CLI to discover and launch any script:

```sh
npm run cli
# or
yarn cli
# or
npx ts-node ./scripts/cli.ts
```

You will be prompted to select a script. Each script provides its own help output when run directly.

## Script Usage

All scripts in this directory:
- Print a summary of their purpose and usage when run with `--help` or no arguments.
- Support interactive prompts for required inputs when possible.
- Exit with clear error messages and actionable guidance if something is wrong.

## Example: Run Data Connector

```sh
npx ts-node scripts/run_data_connectors.ts --help
```

## Deployment & CI/CD

TerraFusionTheory provides automated deployment for both Linux/macOS and Windows, as well as continuous deployment via GitHub Actions:

### Linux/macOS Deployment
Run the Bash deployment script:
```sh
./scripts/deploy.sh
```
This script builds Docker images, starts services, runs migrations, initializes agents, and verifies healthchecks. You can customize it for your environment.

### Windows Deployment
Run the batch deployment script:
```bat
scripts\deploy.bat
```
This script installs dependencies, builds the project, and provides a template for custom deployment steps (e.g., file copy, remote deploy).

### GitHub Actions CI/CD
- On every push to `main`, GitHub Actions will:
  - Lint, test, and build the project
  - Run deployment automation via `.github/workflows/deploy.yml`
- Configure deployment secrets (e.g., `DEPLOY_KEY`) in your repository settings.

## Adding New Scripts
- Place your `.ts` or `.js` script in this directory.
- Export a function or run logic under `if (require.main === module)` for proper CLI execution.
- Add a usage message at the top of the file for discoverability.

## Best Practices
- Use prompts and yargs/inquirer for interactive UX.
- Validate all inputs and print actionable errors.
- Keep scripts composable and environment-variable driven for automation.
