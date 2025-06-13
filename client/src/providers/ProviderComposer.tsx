import React from 'react';

/**
 * ProviderComposer utility for composing multiple context providers.
 * Usage:
 * <ProviderComposer providers={[<AProvider />, <BProvider />]}>{children}</ProviderComposer>
 */
export const ProviderComposer: React.FC<{ providers: React.ReactElement[]; children: React.ReactNode }> = ({ providers, children }) => {
  return (
    <>
      {providers.reduceRight((acc, provider) => {
        return React.cloneElement(provider, undefined, acc);
      }, children)}
    </>
  );
};
