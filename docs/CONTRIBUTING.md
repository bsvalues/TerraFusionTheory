# GAMA Contribution Guide

## Overview
Thank you for your interest in contributing to GAMA! This guide will help you understand our development process and how to contribute effectively.

## Getting Started

### Prerequisites
- Git
- Node.js 16+
- Python 3.8+
- Docker & Docker Compose
- Code editor (VS Code recommended)

### Development Setup
1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/gama.git
cd gama
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/terrafusion/gama.git
```

4. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Agent System
cd ../agents
pip install -r requirements.txt
```

## Development Workflow

### 1. Branch Management

#### Branch Naming
- Feature: `feature/feature-name`
- Bugfix: `fix/bug-name`
- Hotfix: `hotfix/issue-name`
- Release: `release/version`

#### Creating a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Code Style

#### JavaScript/TypeScript
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- JSDoc documentation

#### Python
- PEP 8 style guide
- Black formatting
- Pylint checks
- Type hints

#### General Guidelines
- Clear variable names
- Consistent formatting
- Proper comments
- Documentation

### 3. Development Process

#### 1. Update Your Fork
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

#### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature
```

#### 3. Make Changes
- Write code
- Add tests
- Update documentation
- Follow style guide

#### 4. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

#### 5. Push Changes
```bash
git push origin feature/your-feature
```

#### 6. Create Pull Request
- Use PR template
- Add description
- Link issues
- Request review

## Code Standards

### 1. Frontend Standards

#### Component Structure
```typescript
// Component template
import React from 'react';
import { useStyles } from './styles';
import { Props } from './types';

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  const classes = useStyles();
  
  return (
    <div className={classes.root}>
      {/* Component content */}
    </div>
  );
};
```

#### Testing
```typescript
// Component test
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop1="value" prop2={42} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 2. Backend Standards

#### API Structure
```typescript
// API endpoint
import { Router } from 'express';
import { validate } from '../middleware/validation';
import { PropertyController } from '../controllers';

const router = Router();

router.get(
  '/properties/:id',
  validate('getProperty'),
  PropertyController.getProperty
);

export default router;
```

#### Error Handling
```typescript
// Error handler
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }
  
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};
```

### 3. Agent System Standards

#### Agent Structure
```python
# Agent template
from typing import Dict, Any
from gama.agents.base import BaseAgent

class CustomAgent(BaseAgent):
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.setup()
    
    def setup(self):
        # Initialize agent
        pass
    
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Process data
        return result
```

#### Testing
```python
# Agent test
import pytest
from gama.agents.custom import CustomAgent

def test_custom_agent():
    agent = CustomAgent(config={})
    result = agent.process(data={})
    assert result['status'] == 'success'
```

## Documentation

### 1. Code Documentation

#### JSDoc
```typescript
/**
 * Processes property data and returns assessment results
 * @param {PropertyData} data - The property data to process
 * @param {AssessmentOptions} options - Assessment options
 * @returns {Promise<AssessmentResult>} The assessment results
 * @throws {ValidationError} If data is invalid
 */
async function assessProperty(
  data: PropertyData,
  options: AssessmentOptions
): Promise<AssessmentResult> {
  // Implementation
}
```

#### Python Docstrings
```python
def process_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process input data and return results.
    
    Args:
        data: Input data dictionary
        
    Returns:
        Processed results dictionary
        
    Raises:
        ValueError: If data is invalid
    """
    # Implementation
```

### 2. API Documentation

#### OpenAPI/Swagger
```yaml
openapi: 3.0.0
info:
  title: GAMA API
  version: 1.0.0
paths:
  /properties/{id}:
    get:
      summary: Get property details
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Property details
```

## Testing

### 1. Unit Tests

#### Frontend Tests
```typescript
// Component test
describe('PropertyCard', () => {
  it('renders property details', () => {
    const property = {
      id: '1',
      address: '123 Main St'
    };
    
    render(<PropertyCard property={property} />);
    
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });
});
```

#### Backend Tests
```typescript
// API test
describe('Property API', () => {
  it('returns property details', async () => {
    const response = await request(app)
      .get('/api/properties/1')
      .set('Authorization', 'Bearer token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', '1');
  });
});
```

### 2. Integration Tests

#### API Integration
```typescript
describe('Property Flow', () => {
  it('completes property assessment', async () => {
    // Create property
    const createResponse = await request(app)
      .post('/api/properties')
      .send({
        address: '123 Main St'
      });
    
    const propertyId = createResponse.body.id;
    
    // Start assessment
    const assessResponse = await request(app)
      .post(`/api/properties/${propertyId}/assess`);
    
    expect(assessResponse.status).toBe(200);
  });
});
```

## Pull Request Process

### 1. PR Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] All tests passing
- [ ] No merge conflicts

### 2. PR Template
```markdown
## Description
[Describe your changes]

## Related Issues
[Link related issues]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
[Describe testing performed]

## Screenshots
[If applicable]
```

## Review Process

### 1. Code Review
- Review PR description
- Check code changes
- Verify tests
- Review documentation

### 2. Review Guidelines
- Code quality
- Test coverage
- Documentation
- Performance impact

## Release Process

### 1. Version Management
- Semantic versioning
- Changelog updates
- Release notes
- Tag creation

### 2. Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared

## Support

### Contact Information
- Development Team: dev@gama-county.ai
- Documentation: docs.gama-county.ai
- Issue Tracking: github.com/terrafusion/gama/issues

### Resources
- Style Guide: docs.gama-county.ai/style-guide
- API Documentation: docs.gama-county.ai/api
- Architecture: docs.gama-county.ai/architecture 