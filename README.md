# HemoGo

HemoGo is a blood donor–recipient matching and emergency blood request app. This first version includes only the splash, onboarding, login, sign-up, and dashboard screens, plus backend authentication with MongoDB.

Later features such as donor matching, emergency requests, maps, QR codes, and notifications are not implemented yet.

## Project structure

```text
HemoGo/
├── mobile/
│   ├── App.js
│   ├── package.json
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── Button.js
│       │   ├── Card.js
│       │   ├── DonationIllustration.js
│       │   ├── Input.js
│       │   ├── LoadingIndicator.js
│       │   └── Logo.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── navigation/
│       │   └── AppNavigator.js
│       ├── screens/
│       │   ├── ComingSoonScreen.js
│       │   ├── DashboardScreen.js
│       │   ├── LoginScreen.js
│       │   ├── OnboardingScreen.js
│       │   ├── SignUpScreen.js
│       │   └── SplashScreen.js
│       ├── services/
│       │   ├── api.js
│       │   └── authService.js
│       └── utils/
│           ├── colors.js
│           ├── storage.js
│           └── validation.js
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── README.md
└── .gitignore
```

## Install dependencies

From the project root:

```bash
cd backend
npm install

cd ../mobile
npm install
npx expo install --fix
```

## Required environment variables

Create `backend/.env` (do not commit this file):

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER_HOST/hemogo_db?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
```

`MONGO_URI` must come from MongoDB Atlas. Never put this value in the mobile app.

## MongoDB Atlas setup

1. Open [MongoDB Atlas](https://www.mongodb.com/atlas) and create a cluster if you do not have one.
2. Create a database user and password.
3. In **Network Access**, allow your current IP (or `0.0.0.0/0` for development only).
4. Click **Connect** → **Drivers** and copy the SRV connection string.
5. Replace `<password>` and add the database name `hemogo_db` before the query string.
6. Paste the full string into `backend/.env` as `MONGO_URI`.

A typical Atlas URI looks like:

```text
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hemogo_db?retryWrites=true&w=majority
```

If the backend prints `querySrv ENOTFOUND`, the host is incomplete. `cluster0` alone is not valid. Copy the full host from Atlas, including the random characters and `.mongodb.net`.

## Run the backend

```bash
cd backend
npm run dev
```

The API starts at [http://localhost:5000](http://localhost:5000).

Health check:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{ "success": true, "message": "HemoGo API is running" }
```

## Run the React Native app

```bash
cd mobile
npx expo start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.

### API URL for your device

Edit `mobile/src/services/api.js` and set `API_BASE_URL`:

| Environment | URL |
|---|---|
| Android emulator | `http://10.0.2.2:5000/api` |
| iOS simulator | `http://localhost:5000/api` |
| Physical phone | `http://YOUR_COMPUTER_LAN_IP:5000/api` |

Do not use `localhost` on a physical Android device.

## How to test registration

1. Start the backend and confirm `/api/health` works.
2. Open the app. After the splash and onboarding screens, tap **Sign Up**.
3. Fill in name, email, phone, password, and confirm password.
4. Tick the Terms checkbox and tap **Create Account**.
5. A successful signup stores the user in MongoDB (password hashed), saves a JWT in AsyncStorage, and opens the dashboard.

You can also test with curl:

```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Amal Silva\",\"email\":\"amal@test.com\",\"phone\":\"0771234567\",\"password\":\"secret123\",\"role\":\"PATIENT_FAMILY\"}"
```

## How to test login

1. On the Login screen, enter the registered email (or phone) and password.
2. Tap **Login**.
3. A valid login returns a JWT, stores it in AsyncStorage, and opens the dashboard.
4. Invalid email shows a “user not found” message. Wrong password shows an “incorrect password” message.

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"amal@test.com\",\"password\":\"secret123\"}"
```

## How to test dashboard navigation and session

1. After login or signup you should land on **Home**.
2. **Requests**, **Notifications**, and **Profile** show a Coming Soon screen.
3. Use **Log Out** on the Profile tab, then reopen the app: splash should go to onboarding/login.
4. Log in again, close the app, and reopen it. A valid stored JWT should skip login and go to the dashboard after splash.

Protected user endpoint:

```bash
curl http://localhost:5000/api/auth/me ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Auth API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Default registration role is `DONOR` (donor dashboard after signup/login). Supported roles in the user model: `DONOR`, `PATIENT_FAMILY`, `BLOOD_BANK_OFFICER`, `ADMIN`.

## Current scope

Implemented now:

- Splash, Onboarding, Login, Create Account, Dashboard
- MongoDB connection
- JWT login/registration
- AsyncStorage session

Not implemented yet:

- Donor matching, emergency requests, blood banks, appointments, AI, maps, QR, notifications
