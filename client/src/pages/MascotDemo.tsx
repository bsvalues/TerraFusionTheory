import React from 'react';
import Layout from '@/components/layout/Layout';
import MascotDemoComponent from '@/components/mascot/MascotDemo';

const MascotDemoPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Coding Companion Mascot</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">About the Mascot</h2>
            <p className="mb-4">
              The Coding Companion Mascot is a helpful assistant that provides debugging tips and code suggestions
              when errors are detected in your application.
            </p>
            <p className="mb-4">
              It listens for console errors and warnings, automatically providing relevant tips and code examples
              to help you fix issues faster.
            </p>
            <h3 className="text-lg font-medium mt-6 mb-2">Features</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Automatic error detection and suggestions</li>
              <li>Code snippets with copy functionality</li>
              <li>Links to relevant documentation</li>
              <li>Different types of tips (error, warning, info, success)</li>
              <li>Expressive animations and moods</li>
              <li>Manual tip creation through the API</li>
            </ul>
          </div>
          
          <div className="flex items-center justify-center">
            <MascotDemoComponent />
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">How to Use in Your Code</h2>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4">
            <pre className="text-sm overflow-x-auto">
              <code>{`import { useMascot } from '@/hooks/use-mascot';

// In your component:
const { 
  addErrorTip, 
  addWarningTip, 
  addInfoTip, 
  addSuccessTip 
} = useMascot();

// Add a custom tip
addInfoTip(
  'This is a helpful tip!', 
  'console.log("Code example here");',
  'https://documentation-link.com'
);`}</code>
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MascotDemoPage;