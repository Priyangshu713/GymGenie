# GymGenie - AI-Powered Fitness Tracker

A mobile-focused web application for tracking gym and bodybuilding activities with AI-powered insights using Google's Gemini AI.

## Features

### Core Functionality
- **Comprehensive Exercise Logging**: Track strength training and cardio exercises
- **Smart Exercise Database**: Pre-loaded with popular exercises organized by muscle groups
- **Set & Rep Tracking**: Log sets, reps, weight, duration, and distance
- **Real-time Workout Sessions**: Start, pause, and save workout sessions

### Data Visualization
- **Interactive Charts**: Progress tracking with Chart.js
- **Muscle Group Analysis**: Pie charts showing training balance
- **Progress Over Time**: Line graphs for volume and frequency trends
- **Weekly/Monthly Statistics**: Comprehensive analytics dashboard

### AI-Powered Insights
- **Personalized Analysis**: Gemini AI analyzes your workout patterns
- **Imbalance Detection**: Identifies muscle group imbalances
- **Smart Recommendations**: Suggests exercises and improvements
- **Goal Setting**: AI-generated SMART goals based on your progress
- **Weekly Planning**: Customized workout plans

### Mobile-First Design
- **Responsive UI**: Optimized for mobile devices
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Dark/Light Mode**: Automatic theme switching
- **PWA Ready**: Installable as a mobile app
- **Offline Support**: Works without internet connection

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Gemini AI (Optional)
1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a `.env` file and add your key:
```
VITE_GEMINI_API_KEY=your_api_key_here
```
Or set it later in the app's Profile section.

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Usage Guide

### Starting Your First Workout
1. Open the app and tap "Log Workout"
2. Tap "Start Workout" to begin a session
3. Add exercises by tapping "Add Exercise"
4. Select from the exercise database or add custom exercises
5. Log sets with reps, weight, or duration
6. Save your workout when complete

### Viewing Analytics
1. Navigate to the "Stats" tab
2. View workout frequency, muscle group distribution
3. Track progress over different time periods
4. See achievements and milestones

### Getting AI Insights
1. Go to the "AI" tab
2. Set your Gemini API key in Profile if not done already
3. View personalized analysis of your workouts
4. Get recommendations for improvement
5. Follow suggested weekly plans

### Data Management
- **Export**: Backup your data as JSON
- **Import**: Restore from previous backups
- **Local Storage**: All data stored securely on your device

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS with custom components
- **Charts**: Chart.js with React wrapper
- **AI**: Google Gemini AI for insights
- **Icons**: Lucide React
- **PWA**: Vite PWA plugin
- **Storage**: Browser localStorage

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navigation.jsx   # Bottom navigation
│   ├── WorkoutChart.jsx # Progress charts
│   ├── MuscleGroupChart.jsx
│   └── ProgressChart.jsx
├── context/            # React context providers
│   ├── WorkoutContext.jsx # Workout state management
│   └── ThemeContext.jsx   # Theme switching
├── pages/              # Main application pages
│   ├── Dashboard.jsx   # Home dashboard
│   ├── LogWorkout.jsx  # Workout logging
│   ├── Analytics.jsx   # Statistics and charts
│   ├── AIInsights.jsx  # AI-powered insights
│   └── Profile.jsx     # Settings and profile
├── services/           # External service integrations
│   └── aiService.js    # Gemini AI integration
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Key Features Explained

### Exercise Database
The app includes a comprehensive database of exercises organized by:
- **Muscle Groups**: Chest, Back, Legs, Shoulders, Arms, Core
- **Exercise Types**: Strength training and Cardio
- **Equipment**: Barbell, Dumbbell, Machine, Bodyweight, Cable

### AI Analysis
Gemini AI analyzes your workout data to provide:
- **Strengths**: What you're doing well
- **Improvements**: Areas needing attention
- **Recommendations**: Specific actionable advice
- **Goals**: SMART goals for the next 4 weeks
- **Weekly Plans**: Customized workout focus

### Data Privacy
- All workout data is stored locally on your device
- No data is sent to external servers except for AI analysis
- You can export and import your data anytime
- Complete control over your fitness information

## Customization

### Adding Custom Exercises
1. In the workout logging screen, tap "Add Exercise"
2. Scroll to "Or add custom exercise"
3. Enter the exercise name and tap "Add"

### Modifying Exercise Database
Edit `src/context/WorkoutContext.jsx` to add new exercises to the `EXERCISE_DATABASE` object.

### Styling Changes
The app uses Tailwind CSS. Modify `tailwind.config.js` for theme changes or edit component classes directly.

## Troubleshooting

### AI Insights Not Working
1. Ensure you have a valid Gemini API key
2. Check your internet connection
3. Verify the API key is correctly set in Profile settings

### Charts Not Displaying

- **Clarity** - Clean typography and intuitive navigation
- **Deference** - Content-first design with subtle UI elements
- **Depth** - Layered interface with appropriate shadows and blur effects
- **Consistency** - Unified design language throughout the app

## AI Features Deep Dive

### Workout Analysis
- Evaluates training consistency and patterns
- Identifies muscle imbalances and weaknesses
- Suggests optimal rep ranges and intensity
- Provides progressive overload recommendations

### Split Evaluation
- Analyzes workout split effectiveness
- Checks for proper muscle group balance
- Evaluates recovery time between sessions
- Rates splits on a 1-10 scale with detailed feedback

### Personalized Insights
- Weekly training focus recommendations
- Exercise selection optimization
- Recovery and nutrition suggestions
- Goal-specific program adjustments

## Analytics & Metrics

### Tracked Metrics
- Total volume (weight × reps)
- Training frequency per muscle group
- Average difficulty ratings
- Progressive overload trends
- Workout consistency patterns

### Visualizations
- Activity rings for daily goals
- Muscle group distribution charts
- Weekly progress graphs
- Rep and weight range analysis

## Configuration

### Environment Variables
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Customization
- Modify `tailwind.config.js` for theme customization
- Update `src/context/ThemeContext.jsx` for color schemes
- Customize AI prompts in `src/services/aiService.js`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Apple** - Design inspiration from Apple Fitness
- **Google** - Gemini AI for intelligent analysis
- **React Team** - Amazing framework and ecosystem
- **Tailwind CSS** - Utility-first CSS framework

## Support

- **Issues** - [GitHub Issues](https://github.com/Priyangshu713/GymGenie/issues)
- **Discussions** - [GitHub Discussions](https://github.com/Priyangshu713/GymGenie/discussions)

---

**Built with ❤️ for fitness enthusiasts who want to track, analyze, and improve their workouts with the power of AI.**
