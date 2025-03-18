import { FC, useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getAvailableProviders } from '../../lib/aiClient';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon } from 'lucide-react';
import LLMModelIcon, { AIProvider } from './LLMModelIcon';

interface ProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  disabled?: boolean;
  label?: string;
  tooltip?: string;
}

/**
 * Component for selecting between different AI providers
 */
const ProviderSelector: FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false,
  label = "AI Provider",
  tooltip = "Select which AI provider to use for this request"
}) => {
  const [internalProvider, setInternalProvider] = useState<AIProvider>(selectedProvider);

  // Get available providers from the backend
  const { data: providers, isLoading } = useQuery({
    queryKey: ['/api/ai/providers'],
    select: (data: string[]) => data as AIProvider[],
  });

  useEffect(() => {
    if (selectedProvider !== internalProvider) {
      setInternalProvider(selectedProvider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider]);

  const handleChange = (value: string) => {
    const provider = value as AIProvider;
    setInternalProvider(provider);
    onProviderChange(provider);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && <Label><Skeleton className="h-4 w-20" /></Label>}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // If no providers are available or only one, don't show the selector
  if (!providers || providers.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          <Label>{label}</Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      <Select
        value={internalProvider}
        onValueChange={handleChange}
        disabled={disabled || !providers || providers.length <= 1}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select provider">
            <div className="flex items-center gap-2">
              <LLMModelIcon provider={internalProvider} size={18} />
              {internalProvider.toUpperCase()}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {providers?.map((provider) => (
            <SelectItem key={provider} value={provider}>
              <div className="flex items-center gap-2">
                <LLMModelIcon provider={provider} size={18} />
                {provider.toUpperCase()}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProviderSelector;