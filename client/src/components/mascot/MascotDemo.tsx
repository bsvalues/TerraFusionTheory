import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useMascot } from '@/hooks/use-mascot';
import { MascotAction, MascotMood } from '@/components/mascot/MascotCharacter';

const MascotDemo: React.FC = () => {
  const [tipType, setTipType] = useState<'error' | 'warning' | 'info' | 'success'>('info');
  const [tipMessage, setTipMessage] = useState<string>('This is a sample tip!');
  const [codeExample, setCodeExample] = useState<string>('console.log("Hello from the mascot!");');
  const [docLink, setDocLink] = useState<string>('https://example.com/docs');
  const [currentMood, setCurrentMood] = useState<MascotMood>('happy');

  const { 
    addErrorTip, 
    addWarningTip, 
    addInfoTip, 
    addSuccessTip,
    setMascotAction,
    setMascotMood
  } = useMascot();

  const handleAddTip = () => {
    switch (tipType) {
      case 'error':
        addErrorTip(tipMessage, codeExample, docLink);
        break;
      case 'warning':
        addWarningTip(tipMessage, codeExample, docLink);
        break;
      case 'info':
        addInfoTip(tipMessage, codeExample, docLink);
        break;
      case 'success':
        addSuccessTip(tipMessage, codeExample, docLink);
        break;
    }
  };

  const sampleErrors = [
    { 
      name: 'TypeError: Cannot read property',
      code: `// This will cause an error
const user = null;
console.log(user.name);`,
      message: 'Trying to access a property of null or undefined',
    },
    {
      name: 'SyntaxError: Missing closing bracket',
      code: `function brokenFunction() {
  if (true) {
    console.log("Missing a closing bracket here"
}`,
      message: 'You have a syntax error in your code - a missing closing bracket',
    },
    {
      name: 'React Hook Error',
      code: `// This will cause a React hook error
useEffect(() => {
  if (data) {
    const filteredData = data.filter(item => item.active);
    setFilteredData(filteredData);
  }
});`,
      message: 'Missing dependency array in useEffect hook',
    }
  ];

  const triggerErrorDemo = (index: number) => {
    const error = sampleErrors[index];
    addErrorTip(
      error.message, 
      error.code, 
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors'
    );
    console.error(`Demo Error: ${error.name}`);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs defaultValue="demo">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo">Demo Errors</TabsTrigger>
            <TabsTrigger value="custom">Custom Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="demo" className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Trigger Sample Errors</h3>
              <p className="text-sm text-gray-500">
                Click a button below to simulate an error and see the mascot's response
              </p>
              
              <div className="grid grid-cols-1 gap-2 pt-2">
                {sampleErrors.map((error, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    onClick={() => triggerErrorDemo(index)}
                  >
                    {error.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <h3 className="font-medium">Mascot Animation Controls</h3>
              <p className="text-sm text-gray-500 mb-2">
                Try different actions and see how the mascot responds
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => setMascotAction('jump')}>
                  Jump
                </Button>
                <Button onClick={() => setMascotAction('spin')}>
                  Spin
                </Button>
                <Button onClick={() => setMascotAction('wave')}>
                  Wave
                </Button>
                <Button onClick={() => setMascotAction('dance')}>
                  Dance
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <h3 className="font-medium">Mascot Mood Controls</h3>
              <p className="text-sm text-gray-500 mb-2">
                Current mood: {currentMood}
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => {
                    setMascotMood('happy');
                    setCurrentMood('happy');
                  }}
                >
                  Happy
                </Button>
                <Button 
                  onClick={() => {
                    setMascotMood('thinking');
                    setCurrentMood('thinking');
                  }}
                >
                  Thinking
                </Button>
                <Button 
                  onClick={() => {
                    setMascotMood('surprised');
                    setCurrentMood('surprised');
                  }}
                >
                  Surprised
                </Button>
                <Button 
                  onClick={() => {
                    setMascotMood('excited');
                    setCurrentMood('excited');
                  }}
                >
                  Excited
                </Button>
                <Button 
                  onClick={() => {
                    setMascotMood('sad');
                    setCurrentMood('sad');
                  }}
                >
                  Sad
                </Button>
                <Button 
                  onClick={() => {
                    setMascotMood('sleepy');
                    setCurrentMood('sleepy');
                  }}
                >
                  Sleepy
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Tip Type</label>
              <Select
                value={tipType}
                onValueChange={(value) => setTipType(value as any)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select tip type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Message</label>
              <Input
                value={tipMessage}
                onChange={(e) => setTipMessage(e.target.value)}
                className="mt-1"
                placeholder="Enter tip message"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Code Example</label>
              <Textarea
                value={codeExample}
                onChange={(e) => setCodeExample(e.target.value)}
                className="mt-1 font-mono text-sm"
                rows={4}
                placeholder="Enter code example"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Documentation Link</label>
              <Input
                value={docLink}
                onChange={(e) => setDocLink(e.target.value)}
                className="mt-1"
                placeholder="Enter documentation URL"
              />
            </div>
            
            <Button onClick={handleAddTip} className="w-full">
              Add Custom Tip
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MascotDemo;