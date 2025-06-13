# GAMA (Geometric Assessment & Market Analysis)

## 🟢 Getting Started for New Users

Welcome to GAMA! This project is designed for maximum automation and user-friendliness. Follow these steps for a seamless onboarding experience:

1. **Clone & Set Up**
   - Follow the instructions below to clone the repo and set up your `.env` file.

2. **Unified Automation CLI**
   - Discover and run all automation, ETL, and validation scripts with a single command:
     ```sh
     npm run cli
     # or
     yarn cli
     # or
     npx ts-node ./scripts/cli.ts
     ```
   - You'll get an interactive menu of available scripts. Each script provides its own help/usage info with `--help`.

3. **Script Help & Troubleshooting**
   - Run any script with `--help` for usage guidance and options.
   - All scripts support interactive prompts and clear error messages.
   - For detailed script documentation, see [`scripts/README.md`](./scripts/README.md).

4. **First-time Setup**
   - If you encounter issues, check the FAQ and troubleshooting section below or reach out to the project maintainers.

---

## 🚀 Deployment & CI/CD

TerraFusionTheory supports automated deployment on both Linux/macOS and Windows, as well as continuous deployment via GitHub Actions.

### Deploy on Linux/macOS
Run the Bash deployment script:
```sh
./scripts/deploy.sh
```
This script builds Docker images, starts services, runs migrations, initializes agents, and verifies healthchecks. Customize as needed for your environment.

### Deploy on Windows
Run the batch deployment script:
```bat
scripts\deploy.bat
```
This script installs dependencies, builds the project, and provides a template for custom deployment steps (e.g., file copy, remote deploy).

### GitHub Actions CI/CD
- On every push to `main`, GitHub Actions will:
  - Lint, test, and build the project
  - Run deployment automation via `.github/workflows/deploy.yml`
- Configure your deployment secrets (e.g., `DEPLOY_KEY`) in your repository settings.

See [`scripts/README.md`](./scripts/README.md) for more automation details.

---

A revolutionary property assessment and market analysis system that combines sacred geometry, AI, and advanced analytics to provide unprecedented insights into property markets.

## 🌟 Features

- **Sacred Geometry Visualization**: Advanced property market analysis using Fibonacci spirals and Voronoi tessellations
- **AI-Powered Analysis**: Machine learning models for property valuation and market prediction
- **Real-time Market Energy**: Dynamic visualization of market forces and property flows
- **Secure Data Processing**: Enterprise-grade security with end-to-end encryption
- **Scalable Architecture**: Cloud-native design for global deployment
- **Intuitive Interface**: Clean, modern UI with powerful visualization tools

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 16+
- Python 3.8+
- 8GB RAM minimum
- 20GB free disk space

### Installation

1. Clone the repository:
```bash
git clone https://github.com/terrafusion/gama.git
cd gama
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the system:
```bash
# Windows
StartGAMA.bat

# Linux/Mac
./StartGAMA.sh
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentation: http://localhost:8080

## 🏗️ Architecture

### Components

- **Frontend**: React-based UI with Three.js visualizations
- **Backend**: Node.js API with Express
- **Agent System**: Python-based AI agents
- **Spatial Engine**: Geospatial processing engine
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis for performance optimization
- **Message Queue**: RabbitMQ for async processing
- **Monitoring**: Prometheus & Grafana

### Data Flow

1. Property data ingestion
2. Market energy calculation
3. AI analysis and prediction
4. Visualization generation
5. User interface updates

## 🔒 Security

- JWT authentication
- Role-based access control
- End-to-end encryption
- Rate limiting
- CORS protection
- SSL/TLS encryption
- Security headers
- Audit logging

## 📊 Monitoring

- System health metrics
- Performance monitoring
- Error tracking
- Usage analytics
- Security alerts
- Resource utilization
- API metrics
- User activity

## 🔄 Development

### Setup Development Environment

1. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install

# Agent System
cd agents
pip install -r requirements.txt
```

2. Start development servers:
```bash
# Frontend
npm run dev

# Backend
npm run dev

# Agent System
python run.py
```

### Testing

```bash
# Frontend tests
npm test

# Backend tests
npm test

# Agent tests
pytest

# E2E tests
npm run test:e2e
```

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md)
- [API Documentation](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Testing Guide](docs/TESTING.md)
- [Security Guide](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Tesla's precision and automation principles
- Jobs' elegance and simplicity in design
- Musk's scale and autonomy concepts
- ICSF's secure simulation kernel
- Brady/Belichick tactical execution
- Annunaki-tier data knowledge matrix

## 📞 Support

- Documentation: [docs.gama-county.ai](https://docs.gama-county.ai)
- Issues: [github.com/terrafusion/gama/issues](https://github.com/terrafusion/gama/issues)
- Email: support@gama-county.ai
- Phone: 1-800-GAMA-AI

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## 📈 Roadmap

- Enhanced AI capabilities
- Advanced analytics
- Mobile application
- Blockchain integration
- API marketplace
- Multi-tenant support
- Global deployment
- Edge computing
- AI model updates
- Performance improvements

## 🌐 Community

- [Discord](https://discord.gg/gama)
- [Twitter](https://twitter.com/gama_county)
- [LinkedIn](https://linkedin.com/company/gama-county)
- [YouTube](https://youtube.com/gama-county)
- [Blog](https://blog.gama-county.ai)