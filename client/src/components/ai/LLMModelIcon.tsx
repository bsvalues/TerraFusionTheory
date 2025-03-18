import { FC } from 'react';
import { SiOpenai } from 'react-icons/si';
import { FaRobot } from 'react-icons/fa';
import { IconType } from 'react-icons';

export type AIProvider = 'openai' | 'xai';

interface LLMModelIconProps {
  provider: AIProvider;
  size?: number;
  className?: string;
}

/**
 * Component to render the appropriate icon for each LLM provider
 */
const LLMModelIcon: FC<LLMModelIconProps> = ({ provider, size = 24, className = '' }) => {
  const iconProps = {
    size,
    className: `ai-provider-icon ${className}`,
  };

  const providerIcons: Record<AIProvider, IconType> = {
    openai: SiOpenai,
    xai: FaRobot, // Using a robot icon for xAI since there's no official icon in react-icons
  };

  const ProviderIcon = providerIcons[provider] || providerIcons.openai;

  return <ProviderIcon {...iconProps} />;
};

export default LLMModelIcon;