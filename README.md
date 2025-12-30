# 🌱 Garden Planner

A **personal, free-forever** gardening planner app built with React Native (Expo) and Firebase. Track your plants, manage recurring tasks, keep a garden journal, and never forget to water again!

## 🎯 Design Philosophy

This app is designed to be **free to run for 10-15+ years** with zero subscription costs:

- **Text data** syncs via Firebase Firestore (free tier only)
- **Images** are stored locally on your device (no cloud storage costs)
- **Works offline** with local caching and auto-sync
- **Manual backups** let you save data to your own cloud storage (Google Drive, OneDrive, etc.)
- **No vendor lock-in** - plain JSON backups, local SQLite-style storage

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Your Device                        │
│  ┌─────────────────────────────────────────┐   │
│  │  App                                     │   │
│  │  • All images stored locally             │   │
│  │  • Cached text data for offline use      │   │
│  │  • Manual backup/restore                 │   │
│  └──────────────┬───────────────────────────┘   │
└─────────────────┼───────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────┐
    │  Firebase Firestore     │
    │  (Free Tier)            │
    │  • Plants metadata      │
    │  • Tasks & schedules    │
    │  • Journal text         │
    │  • Image URIs (paths)   │
    │  NOT: Actual images     │
    └─────────────────────────┘
```

## ✨ Features

### 🪴 Plant Management
- Track plants with photos (stored locally)
- Organize by pots, beds, or ground
- Store location, variety, planting dates, and notes
- Health status tracking
- Full CRUD operations

### 📋 Task Management
- Create recurring tasks (water, fertilise, prune, repot, spray, mulch)
- Set frequency in days
- Specify preferred times
- Auto-calculate next due dates
- Mark tasks as done with one tap
- View overdue and today's tasks
- Task history and logs

### 📅 Calendar View
- Monthly calendar showing task due dates
- Visual task indicators on dates
- Upcoming tasks list
- Navigate between months

### 📖 Garden Journal
- Write text entries about your garden
- Attach photos to entries (stored locally)
- Link entries to specific plants
- Track your gardening journey over time

### 💾 Backup & Restore
- **Export backup**: Creates a JSON file with all text data
- **Import & Merge**: Combines backup with current data
- **Import & Replace**: Overwrites all data with backup
- Save backups to your own cloud storage (Google Drive, OneDrive, Dropbox, etc.)
- Backup files are plain JSON - readable and portable

### ⚙️ Settings
- View data statistics (plants, tasks, journal entries, image storage size)
- Architecture overview
- Manual backup/restore
- Sign out securely

## 🛠 Tech Stack

- **Frontend**: React Native with Expo (TypeScript)
- **Backend**: Firebase Firestore (text data only, free tier)
- **Authentication**: Firebase Auth
- **Local Storage**: AsyncStorage for caching, expo-file-system for images
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Images**: expo-image-picker (stored locally on device)
- **Icons**: @expo/vector-icons

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier works)
- iOS Simulator (Mac) or Android Emulator or physical device

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
cd organic-gardening-app
npm install
```

### 2. Firebase Setup

1. Create a Firebase account at https://firebase.google.com
2. Create a new project (free Spark plan)
3. Enable **Firebase Authentication** (Email/Password provider)
4. Enable **Cloud Firestore** (Start in production mode or test mode)
5. Get your Firebase config from Project Settings > General > Your apps
6. **DO NOT enable Firebase Storage** - we don't use it (images are stored locally)

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions.

### 3. Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Important**: Replace with your actual Firebase credentials.

### 4. Run the App

```bash
# Start Expo dev server
npm start

# Or run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser (limited functionality)
```

### 5. First Run

1. Sign up with email and password
2. Add your first plant (photos are saved locally)
3. Create a recurring task
4. Check the Today screen to see tasks
5. Start journaling!
6. Go to Settings to export your first backup

## 📁 Project Structure

```
organic-gardening-app/
├── src/
│   ├── lib/
│   │   ├── firebase.ts          # Firebase client config (Auth + Firestore)
│   │   ├── imageStorage.ts      # Local image storage (NEW)
│   │   ├── storage.ts           # AsyncStorage for caching
│   │   └── supabase.ts          # DEPRECATED - not used
│   ├── types/
│   │   └── database.types.ts    # TypeScript types
│   ├── services/
│   │   ├── plants.ts            # Plant CRUD operations
│   │   ├── tasks.ts             # Task operations
│   │   ├── journal.ts           # Journal operations
│   │   └── backup.ts            # Backup/restore (NEW)
│   ├── screens/
│   │   ├── AuthScreen.tsx       # Login/Sign up
│   │   ├── TodayScreen.tsx      # Today's tasks
│   │   ├── PlantsScreen.tsx     # Plants list
│   │   ├── PlantFormScreen.tsx  # Add/Edit plant
│   │   ├── PlantDetailScreen.tsx # Plant details
│   │   ├── CalendarScreen.tsx   # Calendar view
│   │   ├── JournalScreen.tsx    # Journal list
│   │   ├── JournalFormScreen.tsx # New journal entry
│   │   └── SettingsScreen.tsx   # Settings & Backup
│   └── components/
│       ├── PlantCard.tsx        # Plant card component
│       └── TaskCard.tsx         # Task card component
├── App.tsx                       # Main app component
├── package.json
├── tsconfig.json
├── FIREBASE_SETUP.md            # Firebase configuration guide
└── README.md
```

## 🗄 Data Architecture

### Firestore Collections (Text Data Only)

- **plants**: Plant metadata (name, type, location, notes, **imageUri**)
- **task_templates**: Recurring task schedules
- **task_logs**: History of completed tasks
- **journal_entries**: Journal text and **imageUri**

### Local Device Storage

- **AsyncStorage**: Cached copies of Firestore data (for offline use)
- **File System**: All images stored in `garden_images/` directory
  - `plant_*.jpg` - Plant photos
  - `journal_*.jpg` - Journal photos

### Security

- Firebase Authentication ensures each user sees only their own data
- Firestore security rules filter by `user_id`
- Images are local-only, not shared or uploaded anywhere

## 🎨 Design Principles

- **Clean & Minimal**: Simple color scheme with nature-inspired greens
- **Card-based**: Consistent card layouts throughout
- **Large Touch Targets**: Mobile-friendly interactions
- **Instant Feedback**: Loading states and confirmations
- **No Over-engineering**: Simple state management, straightforward architecture
- **Offline-first**: Data cached locally for instant access

## 🔐 Authentication Flow

1. User opens app → checks Firebase Auth session
2. No session → show auth screen (login/signup)
3. Valid session → show app tabs
4. Auth state persisted automatically by Firebase
5. Sign out → clears session and returns to auth

## 💾 Data Sync & Backup Flow

### Normal Operation (Online)
1. User makes changes (add plant, complete task, etc.)
2. Data saved to Firebase Firestore immediately
3. Local cache updated for offline access
4. Images saved only to local device storage

### Offline Mode
1. User makes changes while offline
2. Data saved to local cache (AsyncStorage)
3. When online again, Firestore auto-syncs
4. Conflict resolution uses "last write wins"

### Manual Backup/Restore
1. **Export**: User taps "Export Backup" in Settings
   - Creates JSON file with all text data
   - Shares file via system share sheet
   - User saves to Google Drive, OneDrive, etc.

2. **Import**: User taps "Import & Merge" or "Import & Replace"
   - Picks backup JSON file from device/cloud
   - Merges or replaces local data
   - Next online sync updates Firestore

3. **Images**: Not included in backup files
   - Remain local to device
   - Can be manually copied via file sync tools (Syncthing, etc.)

## 📱 Screens Overview

### Today
- Shows overdue tasks (red indicator)
- Shows today's tasks
- "Mark Done" button logs task and updates next due date
- Pull to refresh
- Works offline with cached data

### Plants
- Grid/list of plants with photos (local)
- Add new plant button
- Edit and delete actions
- Graceful handling of missing images
- Links to plant form

### Calendar
- Monthly view with task indicators
- Navigate months
- Upcoming tasks list below calendar

### Journal
- Chronological entries
- Photo support
- Plant tags
- Delete entries

### Settings
- Data backup statistics (plants, tasks, journal, image storage size)
- Export backup button
- Import & Merge backup button
- Import & Replace backup button
- Architecture information
- App version and features
- Sign out button

## 🔧 Configuration

### Task Types

Supported task types (defined in `database.types.ts`):
- `water` - Watering plants
- `fertilise` - Fertilizing/feeding
- `prune` - Pruning/trimming
- `repot` - Repotting
- `spray` - Pest/disease treatment
- `mulch` - Adding mulch

### Space Types

Plants can be in:
- `pot` - Container/pot (with pot size)
- `bed` - Garden bed (with bed name)
- `ground` - Directly in ground

### Plant Types

- `vegetable` - Vegetables
- `herb` - Herbs
- `flower` - Ornamental flowers
- `fruit_tree` - Fruit-bearing trees
- `timber_tree` - Timber/shade trees
- `coconut_tree` - Coconut palms
- `shrub` - Shrubs and bushes

## 🐛 Troubleshooting

### "Invalid API credentials"
- Check your `.env` file exists
- Verify Firebase config values are correct
- Restart Expo dev server after changing `.env`

### Images not showing
- Images are stored locally - they won't sync between devices automatically
- If you see a 📷 icon on a plant card, the image file is missing
- Use manual backup/restore or file sync tools to move images between devices

### Tasks not appearing
- Ensure `next_due_at` is set correctly
- Check task is `enabled = true`
- Verify task date is today or earlier
- Check offline cache in Settings

### Auth not working
- Check Firebase Authentication is enabled in Firebase Console
- Enable Email/Password provider
- Check network connection
- For production, configure authorized domains in Firebase

### Backup/Restore issues
- Ensure you have the required packages: `expo-file-system`, `expo-sharing`, `expo-document-picker`
- Check file permissions on your device
- Backup files are JSON - you can inspect them in any text editor

## 🚢 Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

See [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) for detailed build instructions.

## 🔒 Long-Term Data Safety

This app is designed to keep working for 10-15+ years:

1. **Firebase Free Tier**: Text-only data stays well within free limits
2. **Local Images**: No cloud storage means no surprise bills
3. **Manual Backups**: Export to your own cloud storage anytime
4. **Portable Format**: JSON backups can be read/imported anywhere
5. **No Vendor Lock-in**: If Firebase ever changes, switch to local-only mode

### Recommended Backup Strategy

- **Weekly**: Export backup via app, save to Google Drive/OneDrive
- **Monthly**: Keep an extra copy on external drive or different cloud service
- **Yearly**: Archive a dated copy for long-term retention

### If You Change Devices

1. Export backup from old device
2. Install app on new device
3. Sign in with same Firebase account
4. Text data syncs automatically via Firestore
5. Import backup if needed (to restore deleted items or speed up initial sync)
6. Images: manually copy if needed, or retake photos

## 📦 Dependencies

Main dependencies:
- `expo` - React Native framework
- `firebase` - Firebase SDK (Auth + Firestore)
- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/native-stack` - Stack navigation
- `expo-image-picker` - Image selection (saves locally)
- `expo-file-system` - Local file management
- `expo-sharing` - Share backup files
- `expo-document-picker` - Import backup files
- `@react-native-async-storage/async-storage` - Local caching

## 🔒 Security Notes

- Firebase Authentication with email/password
- Firestore security rules filter by `user_id`
- Users can only access their own data
- Images stored locally (no cloud security needed)
- Auth tokens managed by Firebase SDK
- HTTPS enforced by Firebase

## 🎯 Features (Completed)

✅ Plant tracking with photos (local storage)  
✅ Recurring task system  
✅ Today screen with task completion  
✅ Calendar view  
✅ Garden journal with photos (local storage)  
✅ Authentication flow (Firebase Auth)  
✅ Cross-device text sync via Firestore  
✅ Offline-first with local caching  
✅ Manual backup/export/import  
✅ Bottom tab navigation  
✅ Graceful handling of missing images  

## 🚫 Out of Scope (Intentionally Not Included)

❌ Social features  
❌ AI recommendations  
❌ Ads or monetization  
❌ Plant identification  
❌ Weather integration  
❌ Community features  
❌ Paid cloud storage  
❌ Automatic image sync across devices  

## 📝 License

This project is open source and available under the 0BSD License (public domain equivalent).

## 🤝 Contributing

This is a personal project designed for individual use, but feel free to fork and customize!

## 💡 Future Ideas (Optional Enhancements)

- Push notifications for tasks
- Plant care guides database
- Photo gallery view with filtering
- Export journal as PDF
- Task templates/presets
- Search and advanced filters
- Widget for home screen (today's tasks)
- Voice notes for journal entries

## 📞 Support

For issues with:
- **Expo**: Check [Expo documentation](https://docs.expo.dev/)
- **Firebase**: Check [Firebase documentation](https://firebase.google.com/docs)
- **React Navigation**: Check [React Navigation docs](https://reactnavigation.org/)

---

**Made with 🌱 for personal gardening use**  
**Designed to work free for 10-15+ years**

---

Built with 🌿 by a senior mobile engineer
