# Firebase Setup Guide

This guide will help you set up Firebase for your Garden Planner app.

## 🎯 What We Use Firebase For

- ✅ **Authentication** (Email/Password sign-in)
- ✅ **Firestore** (Text/structured data sync - FREE TIER ONLY)
- ❌ **NOT Firebase Storage** (Images are stored locally on device)
- ❌ **NOT Firebase Hosting** (This is a mobile app)
- ❌ **NOT Cloud Functions** (No backend code needed)

**Important**: This app is designed to stay within Firebase's free Spark plan forever.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `garden-planner` (or your preferred name)
4. Disable Google Analytics (optional, you can enable later)
5. Click "Create project"
6. **Keep the project on the Spark (free) plan** - do NOT upgrade to Blaze

## Step 2: Register Your App

1. In the Firebase console, click the **Web** icon (`</>`)
2. Enter app nickname: `Garden Planner App`
3. **Do NOT** check "Also set up Firebase Hosting" (we don't need it)
4. Click "Register app"
5. You'll see your Firebase configuration - keep this page open!

## Step 3: Configure Your App

1. Create a `.env` file in your project root (if it doesn't exist)
2. Copy the configuration values from Firebase console to your `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Important**: Never commit your `.env` file to Git. It's already in `.gitignore`.

## Step 4: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on the **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - **Disable "Email link (passwordless sign-in)"** (we use password auth)
   - Click "Save"

## Step 5: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Start in **Production mode** (we'll add security rules next)
4. Choose your Cloud Firestore location (pick closest to you - can't be changed later)
5. Click "Enable"

## Step 6: Set Up Security Rules

After database is created, go to the **Rules** tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check user ownership
    function isOwner() {
      return request.auth != null && 
             request.auth.uid == resource.data.user_id;
    }
    
    function isCreatingOwned() {
      return request.auth != null && 
             request.auth.uid == request.resource.data.user_id;
    }
    
    // Plants collection - stores text metadata + image filename (not actual image)
    match /plants/{plantId} {
      allow read, write: if isOwner();
      allow create: if isCreatingOwned();
    }
    
    // Task templates collection
    match /task_templates/{taskId} {
      allow read, write: if isOwner();
      allow create: if isCreatingOwned();
    }
    
    // Task logs collection
    match /task_logs/{logId} {
      allow read, write: if isOwner();
      allow create: if isCreatingOwned();
    }
    
      // Journal entries collection - stores text + image filenames (not actual images)
    match /journal_entries/{entryId} {
      allow read, write: if request.auth != null && 
                          request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && 
                      request.auth.uid == request.resource.data.user_id;
    }
  }
}
```

Click **Publish** to save the rules.

## Step 7: Set Up Storage

1. In Firebase Console, go to **Build** → **Storage**
2. Click "Get started"
3. Start in **Production mode**
4. Click "Next"
5. Choose same location as Firestore
6. Click "Done"

## Step 8: Configure Storage Security Rules

Go to the **Rules** tab in Storage and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Plant photos
    match /plants/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Journal photos
    match /journal/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish** to save the rules.

## Step 8: Set Up Usage Alerts (Recommended)

Stay informed if usage approaches free tier limits:

1. Go to **Project settings** (gear icon) → **Usage and billing**
2. Set up billing budgets (even on free plan, you can set alerts)
3. Configure alerts for:
   - Firestore reads: Alert at 40K/day (80% of 50K limit)
   - Firestore writes: Alert at 16K/day (80% of 20K limit)

This way you'll know if something's wrong before hitting limits.

## Step 9: Run Your App

1. Save all changes to your `.env` file
2. Restart your development server:

   ```bash
   npx expo start --clear
   ```

3. The app will now use Firebase for authentication and data sync!

## Firestore Collections Structure

Your app will create these collections automatically:

### plants

```typescript
{
  id: string,
  user_id: string,
  name: string,
  plant_type: string,
    photo_filename: string | null,  // Stored filename - NOT a cloud URL
  space_type: string,
  location: string,
  // ... other plant fields
}
```

### task_templates

```typescript
{
  id: string,
  user_id: string,
  plant_id: string | null,
  task_type: string,
  frequency_days: number,
  next_due_at: timestamp,
  // ... other task fields
}
```

### task_logs

```typescript
{
  id: string,
  user_id: string,
  template_id: string,
  task_type: string,
  done_at: timestamp,
  // ... other log fields
}
```

### journal_entries

```typescript
{
  id: string,
  user_id: string,
  plant_id: string | null,
    content: string,
    photo_filenames: string[],  // Stored filenames - NOT a cloud URL
  created_at: timestamp
}
```

## Local Storage Structure

Images are stored on device at:

- `{app_directory}/garden_images/plant_{timestamp}_{random}.jpg`
- `{app_directory}/garden_images/journal_{timestamp}_{random}.jpg`

  These are **never uploaded to Firebase** - only the filenames are stored in Firestore.

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"

- Check that your API key in `.env` is correct
- Make sure you're using `EXPO_PUBLIC_` prefix
- Restart Expo with `npx expo start --clear`

### "Missing or insufficient permissions"

- Verify Firestore security rules are published
- Make sure you're signed in (check auth state)
- Check that `user_id` field matches authenticated user

### "Images not showing"

- Images are local-only and won't sync between devices automatically
- Use the backup/restore feature or manual file sync for cross-device images
- If you see a 📷 icon, the image file is missing from this device

### App not loading config

- Restart Metro bundler with `npx expo start --clear`
- Verify `.env` file is in project root
- Check all env variables start with `EXPO_PUBLIC_`
- Make sure `.env` is not in `.gitignore` exclusions

## Features Enabled

✅ **Email/Password Authentication**  
✅ **Real-time Text Sync** (Firestore)  
✅ **Offline Support** (Local caching)  
✅ **Local Photo Storage** (No cloud costs)  
✅ **Manual Backup/Restore** (JSON export/import)  
✅ **Free forever** (Within Spark plan limits)  

## Free Tier Limits

Firebase Free (Spark) plan includes:

- **Firestore**: 50K reads, 20K writes, 1GB storage per day
- **Authentication**: Unlimited users
- **No credit card required**

For a single personal user, this is effectively unlimited. Your text-only data will stay well within limits.

## Data Size Estimation

Typical usage for one user:

- 100 plants × 500 bytes = 50KB
- 50 tasks × 300 bytes = 15KB
- 365 task logs × 200 bytes = 73KB
- 100 journal entries × 400 bytes = 40KB
- **Total: ~180KB** (way under 1GB limit)

Even with 10 years of data, you'll stay within the free tier!

## Next Steps

1. Test sign up and sign in
2. Create some plants (photos save locally)
3. Add tasks and journal entries
4. Go to Settings → Export a backup
5. Save backup to Google Drive or OneDrive
6. Test on another device - text data syncs automatically!

## Long-Term Safety

To ensure your data is safe for 10-15+ years:

- **Weekly**: Export backup from Settings
- **Monthly**: Save backup to external drive
- **Yearly**: Test importing backup on a fresh device
- **Keep project on Spark plan**: Never upgrade to Blaze (pay-as-you-go)

Need help? Check [Firebase Documentation](https://firebase.google.com/docs)
