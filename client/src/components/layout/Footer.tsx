import React from 'react';
import { Link } from 'wouter';
import { 
  LucideExternalLink, 
  LucideHelpCircle, 
  LucideInfo, 
  LucideShield, 
  LucideMonitor
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-5 md:h-16 md:flex-row md:py-0">
        <div className="text-center md:text-left text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Real Estate Intelligence Platform • v2.4.1
        </div>
        
        <nav className="flex gap-4 sm:gap-6 text-sm">
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors flex items-center">
            <LucideShield className="h-3.5 w-3.5 mr-1.5" />
            Privacy
          </Link>
          <Link href="/fix-my-screen/help" className="text-muted-foreground hover:text-foreground transition-colors flex items-center">
            <LucideMonitor className="h-3.5 w-3.5 mr-1.5" />
            Display Help
          </Link>
          <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors flex items-center">
            <LucideHelpCircle className="h-3.5 w-3.5 mr-1.5" />
            Support
          </Link>
          <a 
            href="https://github.com/yourusername/real-estate-intelligence" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
          >
            <LucideExternalLink className="h-3.5 w-3.5 mr-1.5" />
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;