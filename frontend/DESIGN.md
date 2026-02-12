# Governance Attack Simulation UI Design System

## Color System

### Primary Colors
- **Attack Red**: `#EF4444` - Used for high-risk indicators, attack simulations
- **Defense Green**: `#10B981` - Used for security features, successful defenses
- **Warning Orange**: `#F59E0B` - Used for medium-risk alerts, economic indicators
- **Primary Blue**: `#3B82F6` - Used for primary actions, data visualization

### Background & Surface
- **Background**: `#0F172A` - Main application background
- **Card**: `#1E293B` - Card surfaces and panels
- **Border**: `#334155` - Subtle borders and dividers

## Design Features

### 1. Hero Sections with Background Images
Each main page features a stunning hero section with:
- Professional background images from Unsplash
- Gradient overlays for better text readability
- Large, bold headlines with gradient text effects
- Descriptive subtitles explaining page functionality

**Pages with hero sections:**
- Overview: Cybersecurity network attack imagery
- Attack Simulation: Blockchain security technology
- Defense Laboratory: Security shield protection
- Economic Analysis: Financial data charts
- Governance Monitoring: Ethereum network
- Historical Data: Data visualization dashboard
- Comparison Analysis: Technology infrastructure

### 2. Visual Card Effects
All cards feature:
- **Rounded corners**: 12px border radius for consistency
- **Subtle shadows**: Elevation effect with `shadow-lg`
- **Hover effects**: Shadow enhancement on hover (`hover:shadow-xl`)
- **Decorative gradients**: Soft circular gradients in corners
- **Group hover animations**: Scale and opacity transitions

### 3. Interactive Elements

#### Stat Cards
- Animated gradient backgrounds on hover
- Color-coded icons based on status (success, warning, danger)
- Smooth transition effects
- Visual badges for status indicators

#### Charts & Visualizations
- Recharts library for professional data visualization
- Consistent color palette across all charts
- Custom tooltips with dark theme styling
- Gradient fills for area charts
- Interactive legends

### 4. Typography
- **Font Family**: Inter (primary), JetBrains Mono (code/monospace)
- **Font Sizes**: 
  - h1: 28px
  - h2: 22px
  - h3: 18px
  - Body: 14px
  - Caption: 12px

### 5. Layout Structure

#### Sidebar Navigation
- Fixed 256px width
- Decorative gradient orbs for visual interest
- Gradient logo badge
- Active state highlighting
- Smooth hover transitions

#### Top Status Bar
- Network information display
- Real-time block height
- Connection status indicator
- User menu access

## Page-Specific Design Elements

### Overview Page
- **Hero**: Large gradient text title with CTA buttons
- **Stats Grid**: 4-column metric cards with animated backgrounds
- **Heatmap**: Area chart with gradient fill
- **Action Cards**: Quick start, recent simulations, defense status

### Attack Simulation Page
- **Visual Flow**: Attack vector visualization with connecting gradients
- **Control Panel**: Play/pause controls with progress indicator
- **Info Cards**: 3-column layout with color-coded categories
- **Execution Log**: Syntax-highlighted console output

### Defense Laboratory Page
- **Configuration Panel**: Slider controls with real-time values
- **Impact Preview**: Large percentage display with comparison
- **Analysis Cards**: ROI, impact, and trade-off visualizations
- **Stress Test**: Progress bars and concurrent test metrics

### Economic Analysis Page
- **Cost Breakdown**: Pie chart with detailed legend
- **ROI Calculator**: Large metric displays
- **Break-even Chart**: Line chart with threshold indicators
- **Sensitivity Grid**: Multiple small visualizations

### Governance Monitoring Page
- **Timeline**: Visual proposal lifecycle stages
- **Active Proposals**: Risk-coded proposal cards
- **Token Distribution**: Pie chart analysis
- **Real-time Feed**: Animated voting events

### Historical Data Page
- **Trend Charts**: Multi-line time series
- **Correlation Matrix**: Heat-mapped table
- **Prediction Cards**: Future trend indicators

### Comparison Analysis Page
- **Success Matrix**: Color-coded comparison table
- **Dual-axis Chart**: Cost vs success visualization
- **Radar Chart**: Defense effectiveness pentagon
- **ROI Cards**: Stacked metric displays

## Animation & Transitions

- **Duration**: 300-700ms for smooth, professional feel
- **Easing**: Built-in Tailwind transition curves
- **Hover States**: Scale, shadow, and color transitions
- **Group Effects**: Coordinated multi-element animations
- **Blur Effects**: Gradient orbs with blur-3xl

## Responsive Design

The layout is optimized for:
- **Desktop**: 1920px+ full feature display
- **Laptop**: 1440px+ comfortable viewing
- **Grid System**: Responsive columns (grid-cols-2/3/4)

## Image Integration

All hero sections use high-quality Unsplash images with:
- **Opacity**: 20-30% for subtle background effect
- **Gradient Overlays**: For text readability
- **ImageWithFallback**: Component for error handling
- **Lazy Loading**: Optimized performance


