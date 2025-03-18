import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LogLevel, LogCategory } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function LogTester() {
  const [message, setMessage] = useState('Test log message');
  const [level, setLevel] = useState<string>(LogLevel.INFO);
  const [category, setCategory] = useState<string>(LogCategory.SYSTEM);
  const [details, setDetails] = useState('Log details...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const generateTestLog = async () => {
    try {
      setIsSubmitting(true);
      
      const log = {
        message,
        level,
        category,
        details,
        source: 'LogTester',
        timestamp: new Date()
      };
      
      await apiRequest('/api/logs', {
        method: 'POST',
        body: JSON.stringify(log)
      });
      
      toast({
        title: "Log created",
        description: `Created a ${level} log in the ${category} category`,
      });
      
    } catch (error) {
      console.error('Error creating test log:', error);
      toast({
        title: "Error creating log",
        description: "Failed to create test log entry",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const generateMultipleLogs = async () => {
    try {
      setIsSubmitting(true);
      
      // Create logs of different levels
      const logs = [
        { 
          level: LogLevel.DEBUG, 
          category: LogCategory.SYSTEM, 
          message: 'Debug log message', 
          details: 'Detailed debug information', 
          source: 'LogTester' 
        },
        { 
          level: LogLevel.INFO, 
          category: LogCategory.USER, 
          message: 'User performed action', 
          details: 'User clicked on button XYZ', 
          source: 'LogTester' 
        },
        { 
          level: LogLevel.WARNING, 
          category: LogCategory.DATABASE, 
          message: 'Database query slow', 
          details: 'Query took 2500ms to complete', 
          source: 'LogTester',
          duration: 2500
        },
        { 
          level: LogLevel.ERROR, 
          category: LogCategory.API, 
          message: 'API request failed', 
          details: 'Server returned 500 status code', 
          source: 'LogTester',
          statusCode: 500,
          endpoint: '/api/data'
        },
        { 
          level: LogLevel.CRITICAL, 
          category: LogCategory.SECURITY, 
          message: 'Authentication failure', 
          details: 'Failed login attempt from suspicious IP', 
          source: 'LogTester' 
        },
        { 
          level: LogLevel.INFO, 
          category: LogCategory.PERFORMANCE, 
          message: 'Performance metrics', 
          details: 'Rendered in 120ms', 
          source: 'LogTester',
          duration: 120
        },
        { 
          level: LogLevel.INFO, 
          category: LogCategory.AI, 
          message: 'AI model completed analysis', 
          details: 'Processed 500 tokens in 350ms', 
          source: 'LogTester',
          duration: 350
        }
      ];
      
      // Create logs sequentially
      for (const log of logs) {
        await apiRequest('/api/logs', {
          method: 'POST',
          body: JSON.stringify({
            ...log,
            timestamp: new Date()
          })
        });
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast({
        title: "Test logs created",
        description: `Created ${logs.length} test log entries of various levels and categories`,
      });
      
    } catch (error) {
      console.error('Error creating test logs:', error);
      toast({
        title: "Error creating logs",
        description: "Failed to create test log entries",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-md font-medium mb-3">Log Testing Tools</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Log Level</label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LogLevel.DEBUG}>{LogLevel.DEBUG}</SelectItem>
                <SelectItem value={LogLevel.INFO}>{LogLevel.INFO}</SelectItem>
                <SelectItem value={LogLevel.WARNING}>{LogLevel.WARNING}</SelectItem>
                <SelectItem value={LogLevel.ERROR}>{LogLevel.ERROR}</SelectItem>
                <SelectItem value={LogLevel.CRITICAL}>{LogLevel.CRITICAL}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LogCategory.SYSTEM}>{LogCategory.SYSTEM}</SelectItem>
                <SelectItem value={LogCategory.USER}>{LogCategory.USER}</SelectItem>
                <SelectItem value={LogCategory.API}>{LogCategory.API}</SelectItem>
                <SelectItem value={LogCategory.DATABASE}>{LogCategory.DATABASE}</SelectItem>
                <SelectItem value={LogCategory.SECURITY}>{LogCategory.SECURITY}</SelectItem>
                <SelectItem value={LogCategory.PERFORMANCE}>{LogCategory.PERFORMANCE}</SelectItem>
                <SelectItem value={LogCategory.AI}>{LogCategory.AI}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Log message"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <Input
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Log details"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={generateTestLog} 
            disabled={isSubmitting}
            className="flex-1"
          >
            Generate Single Log
          </Button>
          
          <Button 
            onClick={generateMultipleLogs} 
            disabled={isSubmitting}
            variant="secondary"
            className="flex-1"
          >
            Generate Sample Logs
          </Button>
        </div>
      </div>
    </div>
  );
}