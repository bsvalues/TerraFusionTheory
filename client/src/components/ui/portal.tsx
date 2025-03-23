/**
 * Portal Component
 * 
 * This component uses React's createPortal to render children into a DOM node
 * that exists outside the DOM hierarchy of the parent component.
 * 
 * It's used to render overlays, modals, and other elements that should
 * appear above the main application content.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

export const Portal: React.FC<PortalProps> = ({ 
  children, 
  container 
}) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Use the provided container, or create a div and append it to the body
    const targetElement = container || document.body;
    
    // Create a new div element to serve as the portal container
    const portalContainer = document.createElement('div');
    portalContainer.className = 'portal-container';
    
    // Append the container to the target element
    targetElement.appendChild(portalContainer);
    
    // Set the mount node
    setMountNode(portalContainer);
    
    // Cleanup on unmount
    return () => {
      if (targetElement.contains(portalContainer)) {
        targetElement.removeChild(portalContainer);
      }
    };
  }, [container]);
  
  // Only render the portal when we have a mount node
  return mountNode ? createPortal(children, mountNode) : null;
};

export default Portal;