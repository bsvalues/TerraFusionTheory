/**
 * Icons Component
 * 
 * Centralized place for all icons used in the application.
 * Uses Lucide React icons for consistency.
 */
import {
  Home,
  Building,
  Map,
  LineChart,
  BarChart,
  PieChart,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Edit,
  Trash,
  Share,
  Download,
  Upload,
  ExternalLink,
  Link,
  Heart,
  Calendar,
  Clock,
  Settings,
  User,
  Users,
  Mail,
  Phone,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Menu,
  X,
  MoreHorizontal,
  MoreVertical,
  Send,
  Star,
  Zap,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  ThermometerSun,
  Ruler,
  Bath,
  Bed,
  Briefcase,
  School,
  AlertTriangle,
  Compass,
  FileText,
  Cog,
  Bot,
  MessageSquare,
  type LucideProps
} from 'lucide-react';

export type Icon = React.FC<LucideProps>;

export const Icons = {
  // Navigation
  home: Home,
  building: Building,
  map: Map,
  
  // Charts
  lineChart: LineChart,
  barChart: BarChart,
  pieChart: PieChart,
  
  // Actions
  search: Search,
  filter: Filter,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash,
  share: Share,
  download: Download,
  upload: Upload,
  externalLink: ExternalLink,
  link: Link,
  heart: Heart,
  
  // Time & Date
  calendar: Calendar,
  clock: Clock,
  
  // User related
  settings: Settings,
  user: User,
  users: Users,
  mail: Mail,
  phone: Phone,
  
  // Security
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  eyeOff: EyeOff,
  
  // Notifications
  alertCircle: AlertCircle,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  info: Info,
  helpCircle: HelpCircle,
  
  // UI Elements
  menu: Menu,
  close: X,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  
  // Communication
  send: Send,
  messageSquare: MessageSquare,
  
  // Ratings & Highlights
  star: Star,
  zap: Zap,
  
  // View Controls
  maximize: Maximize,
  minimize: Minimize,
  
  // Weather
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  rain: CloudRain,
  wind: Wind,
  temperature: ThermometerSun,
  
  // Property Specific
  ruler: Ruler,
  bath: Bath,
  bed: Bed,
  
  // Education & Economy
  briefcase: Briefcase,
  school: School,
  
  // Risk & Safety
  warning: AlertTriangle,
  
  // Custom for our app
  compass: Compass,
  document: FileText,
  settings: Cog,
  bot: Bot,
  
  // Comparison icon (custom function)
  comparison: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="7" width="6" height="10" rx="1" />
      <rect x="9" y="4" width="6" height="16" rx="1" />
      <rect x="16" y="9" width="6" height="8" rx="1" />
    </svg>
  ),
};