# TerraFusion CompFusion Platform

A cutting-edge Real Estate Intelligence Platform that leverages advanced geospatial technologies and intelligent analysis to transform complex property data into actionable insights for professionals and investors.

## Features

- **Smart Comp Selection System**: Drag-and-drop interface for comparable property selection with AI-powered recommendations
- **Real-time SHAP Calculator**: Live calculation of property feature impacts with detailed breakdowns
- **Advanced Visualization**: Interactive Plotly-based waterfall charts showing value impacts
- **Narrative Generation**: Plain-language explanations of technical adjustments
- **Modern UI/UX**: Dark-mode AI-first visual styling with consistent component design

## Deployment Instructions

### Option 1: Vercel Deployment (Recommended)

1. **Fork this repository**
   - Create a GitHub account if you don't have one
   - Click the "Fork" button at the top right of this repository

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com/) and sign up/login
   - Click "New Project"
   - Import your forked repository
   - Select the repository from the list

3. **Configure project**
   - Project Name: Choose a name (e.g., "terrafusion-demo")
   - Framework Preset: Select "Other"
   - Root Directory: Leave as default
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Environment Variables (Optional)**
   - No environment variables are required for the basic demo
   - For extended features, add relevant API keys

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (typically under 2 minutes)
   - Once deployed, Vercel will provide a URL to access your application

### Option 2: Render Deployment

1. **Create a Render account**
   - Go to [Render](https://render.com/) and sign up/login

2. **Set up a new Web Service**
   - Click "New" and select "Web Service"
   - Connect to your GitHub repository
   - Name: Choose a name (e.g., "terrafusion-demo")
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

3. **Configure settings**
   - Select the free plan for testing
   - Auto-Deploy: Enable

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete
   - Render will provide a URL to access your application

## Local Development

1. **Clone the repository**
   ```
   git clone https://github.com/your-username/terrafusion.git
   cd terrafusion
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Start the development server**
   ```
   npm run dev
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost:5000`

## Demo Data

The repository includes demo-safe AI data for testing:
- `mock_adjustments.json`: Sample adjustment data for properties
- `mock_comp_data.json`: Sample comparable property data

These files provide realistic data for demonstration purposes without requiring a backend connection.

## Extending the Platform

### Authentication & Audit Backend

To add user authentication and audit logging capabilities:

1. Set up Firebase authentication
2. Implement audit logging middleware
3. Add user management dashboard

### Marketing Landing Page

To create a marketing landing page:

1. Customize the included landing page template
2. Add your branding and messaging
3. Deploy to the same or separate domain

### Pilot Walkthrough Kit

For organizations interested in piloting the platform:

1. Use the included pilot onboarding script
2. Customize the training materials
3. Schedule a demonstration session

## Support

For support, please contact our team at support@terrafusion.com

---

© 2025 TerraFusion. All rights reserved.