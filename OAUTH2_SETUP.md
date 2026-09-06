# Facebook & Google OAuth2 Login - Simple Server-Side Flow

## ✅ What Changed

Switched from client-side Facebook SDK (which requires HTTPS) to **Spring Security OAuth2** (server-side redirect flow) that works on HTTP localhost!

## 🎯 How It Works

1. User clicks "Continue with Facebook" button
2. Browser redirects to: `http://localhost:8081/oauth2/authorization/facebook`
3. Backend redirects to Facebook login page
4. User logs in on Facebook
5. Facebook redirects back to backend: `http://localhost:8081/login/oauth2/code/facebook`
6. Backend validates with Facebook, creates/logs in user, generates JWT
7. Backend redirects to frontend: `http://localhost:5173/oauth2/redirect?token=<jwt>`
8. Frontend OAuth2Redirect page extracts token and logs user in

**No HTTPS needed! No ngrok needed! Works on localhost!**

## 📋 Setup Steps

### Step 1: Update Maven Dependencies

Already done ✅ - Added `spring-boot-starter-oauth2-client` to `pom.xml`

### Step 2: Configure Facebook App

1. Go to [Facebook Developers Console](https://developers.facebook.com/apps/1352113810463033/)
2. Go to **Settings** → **Basic**
3. Add **App Domains**: `localhost`
4. Click **Save Changes**

5. Go to **Facebook Login** → **Settings** (left sidebar)
6. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:8081/login/oauth2/code/facebook
   ```
7. Click **Save Changes**

### Step 3: Configure Google App (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project with Client ID: `457341066065-0ja001e981hnhhe92uffiu7cbqpg6q1v`
3. Click on the OAuth 2.0 Client ID
4. Add **Authorized redirect URIs**:
   ```
   http://localhost:8081/login/oauth2/code/google
   ```
5. Click **Save**

⚠️ **Note**: You also need to set the `GOOGLE_CLIENT_SECRET` environment variable (not provided in your config)

### Step 4: Backend Configuration

Already done ✅ - Updated:
- `application.yml` with OAuth2 settings
- Created `CustomOAuth2User`, `CustomOAuth2UserService`
- Created `OAuth2LoginSuccessHandler`, `OAuth2LoginFailureHandler`
- Updated `SecurityConfig` to enable OAuth2 login

### Step 5: Frontend Changes

**Update your App routes** to include the OAuth2 redirect page:

```jsx
// In App.jsx or wherever you define routes
import OAuth2Redirect from './Pages/Auth/OAuth2Redirect'

// Add this route
<Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
```

**Update Login.jsx** - Replace the Facebook/Google sections with simple anchor tags:

```jsx
{/* Or continue with */}
<div className="auth-divider"><span>or continue with</span></div>

<div className="social-auth">
  {/* Google Login - Simple redirect */}
  <a 
    href="http://localhost:8081/oauth2/authorization/google"
    className="social-btn social-btn--gmail"
  >
    <GmailIcon />
    <span>Continue with <strong>Google</strong></span>
  </a>

  {/* Facebook Login - Simple redirect */}
  <a 
    href="http://localhost:8081/oauth2/authorization/facebook"
    className="social-btn social-btn--facebook"
  >
    <FacebookIcon />
    <span>Continue with <strong>Facebook</strong></span>
  </a>

  {/* Telegram - Keep existing useTelegramLogin hook */}
  <div className="social-btn social-btn--telegram social-btn--gis-wrap">
    {socialBusy === 'telegram' ? <SpinnerIcon /> : <TelegramIcon />}
    <span>Continue with <strong>Telegram</strong></span>
    <div ref={telegramButtonRef} className="social-btn--gis-overlay" />
  </div>
</div>
```

**Update Register.jsx** - Same as above:

```jsx
{/* Or register with */}
<div className="auth-divider"><span>or register with</span></div>

<div className="social-auth">
  <a 
    href="http://localhost:8081/oauth2/authorization/google"
    className="social-btn social-btn--gmail"
  >
    <GmailIcon />
    <span>Sign up with <strong>Google</strong></span>
  </a>

  <a 
    href="http://localhost:8081/oauth2/authorization/facebook"
    className="social-btn social-btn--facebook"
  >
    <FacebookIcon />
    <span>Sign up with <strong>Facebook</strong></span>
  </a>

  <div className="social-btn social-btn--telegram social-btn--gis-wrap">
    {socialBusy === 'telegram' ? <SpinnerIcon /> : <TelegramIcon />}
    <span>Sign up with <strong>Telegram</strong></span>
    <div ref={telegramButtonRef} className="social-btn--gis-overlay" />
  </div>
</div>
```

### Step 6: Create /api/users/me endpoint

The OAuth2Redirect page needs this endpoint to fetch user profile with the JWT token.

Create `UserController.java`:

```java
@GetMapping("/me")
public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
    String username = authentication.getName();
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new NotFoundException("User not found"));
    
    UserResponse userResponse = UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .phoneNumber(user.getPhoneNumber())
            .role(user.getRole())
            .build();
    
    return ResponseEntity.ok(ApiResponse.success("User profile retrieved", userResponse));
}
```

## 🚀 Testing

### Terminal 1 - Start Backend:
```bash
cd D:\1.B.Groceries\Backend\B-backend
mvn clean install
mvn spring-boot:run
```

### Terminal 2 - Start Frontend:
```bash
cd D:\1.B.Groceries\Frontend\B-Frontend
npm run dev
```

### Test Facebook Login:
1. Open `http://localhost:5173/login`
2. Click "Continue with Facebook"
3. You'll be redirected to Facebook login
4. Log in with Facebook
5. You'll be redirected back and logged in automatically!

## 🐛 Troubleshooting

### "redirect_uri_mismatch" error
- Check that `http://localhost:8081/login/oauth2/code/facebook` is in Facebook's Valid OAuth Redirect URIs
- Make sure there are no typos or extra spaces

### "App Not Set Up" error
- Your Facebook app is in Development mode
- You need to be added as a Test User or Developer
- Or switch the app to Live mode (for production only)

### "Failed to fetch user profile"
- Make sure `/api/users/me` endpoint exists in UserController
- Check that the JWT token is valid
- Check browser console for errors

### CORS errors
- Backend CORS is already configured for `http://localhost:5173` ✅
- Restart backend after changing CORS config

## 📝 Differences from Old Flow

**Old Project** (client-side SDK):
- ❌ Requires HTTPS
- ❌ Complex Facebook SDK initialization
- ❌ Client-side token exchange

**New Flow** (server-side OAuth2):
- ✅ Works on HTTP localhost
- ✅ Simple anchor tag redirects
- ✅ Backend handles everything
- ✅ More secure (tokens never exposed to frontend)

## 🎨 Button Styling

The CSS is already updated with beautiful hover effects:
- Smooth transitions
- Vibrant gradients on hover
- Shadow effects
- Clean, modern design

Same styling works for both `<a>` tags and `<div>` elements!

---

## Summary

You now have a **much simpler** Facebook/Google login that:
1. Works on HTTP localhost (no HTTPS/ngrok needed!)
2. Uses simple anchor tag redirects (no complex SDK)
3. Backend handles all OAuth2 validation
4. More secure (backend-to-backend token exchange)
5. Easier to maintain and debug

Just update your Login/Register components to use `<a href="http://localhost:8081/oauth2/authorization/facebook">` and you're done! 🎉
