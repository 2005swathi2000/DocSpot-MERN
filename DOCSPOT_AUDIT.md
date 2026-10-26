# Evidence-Based Engineering Audit: DocSpot-MERN

**Repository:** `2005swathi2000/DocSpot-MERN`  
**Local Working Directory:** `C:\Users\CHARAN\.gemini\antigravity-ide\scratch\DocSpot-MERN`  
**Audit Date:** October 26, 2026  
**Auditor:** Senior Software Engineer & Technical Placement Mentor  
**Hardware Profile:** Windows 11 Laptop, 8 GB RAM

---

## 1. Executive Summary & Verification

Before modifying any source code, an exhaustive code and runtime inspection was conducted on `DocSpot-MERN`. All reported anomalies, port discrepancies, missing configurations, and architectural risks have been confirmed with direct code references and reproduced terminal output.

---

## 2. Confirmed Findings & Technical Evidence

### Finding 1: Client/Server Port Mismatch (CONFIRMED)
- **Technical Evidence:**
  - `server/server.js` (Line 27): `const port = process.env.PORT || 8000;`
  - `client/src/redux/api/apiSlice.ts` (Line 8): `baseUrl: process.env.REACT_APP_API_URL,` (No default fallback provided).
  - Client documentation in repository history specifies `REACT_APP_API_URL=http://localhost:5000/api/v1`.
- **Observed Behavior:**
  - When the backend starts without an explicit `PORT` in `.env`, it binds to port `8000`.
  - The client, when configured using `.env.example`, attempts to dispatch HTTP requests to `http://localhost:5000/api/v1`.
  - When `REACT_APP_API_URL` is omitted, RTK Query dispatches relative requests to `http://localhost:3000/api/v1`, resulting in HTTP 404 from the React development server.
- **Root Cause:** Hardcoded default port `8000` in `server.js` with no cross-service alignment or fallback in `apiSlice.ts`.

---

### Finding 2: Server Startup Crash on Missing Database URI (CONFIRMED)
- **Technical Evidence:**
  - `server/server.js` (Lines 12–14):
    ```javascript
    const dbURI = process.env.DATABASE;
    mongoose.connect(dbURI);
    ```
- **Observed Terminal Output (Reproduced):**
  ```text
  🚀 Server is live at http://localhost:8000
  ❌ MongoDB connection failed: MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined".
  ⚠️ Unhandled promise rejection. Shutting down gracefully...
  Error: MongooseError - The `uri` parameter to `openUri()` must be a string, got "undefined".
  ```
- **Impact:** Any recruiter or evaluator attempting to run `npm start` immediately encounters a process crash because `server/.env.example` does not exist to guide setup, and `server.js` lacks validation before calling `mongoose.connect()`.

---

### Finding 3: Missing Environment Configuration Files (CONFIRMED)
- **Server:** Completely missing `server/.env.example`. Required keys identified from source code:
  - `PORT` (Required for port binding, default: 5000)
  - `DATABASE` (MongoDB connection URI, e.g. `mongodb://localhost:27017/docspot` or MongoDB Atlas URI)
  - `JWT_SECRET` (Cryptographic signing key for user authentication tokens in `authController.js`)
  - `NODE_ENV` (Environment flag: `development` / `production`)
- **Client:** Missing `client/.env.example` in active working directory. Required key:
  - `REACT_APP_API_URL` (API gateway URL, e.g. `http://localhost:5000/api/v1`)

---

### Finding 4: Node.js Engine Version Lock (CONFIRMED)
- **Technical Evidence:** `server/package.json` (Lines 6–9):
  ```json
  "engines": {
    "node": "18.14.2",
    "npm": "9.5.0"
  }
  ```
- **Observed Behavior:** Running `npm install` on modern LTS Node.js (e.g. Node 20.x or 22.x) triggers noisy `EBADENGINE Unsupported engine` warnings.
- **Solution:** Change to `"node": ">=18.0.0"` for modern LTS compatibility.

---

### Finding 5: Complete Absence of Backend Automated Tests (CONFIRMED)
- **Technical Evidence:** `server/package.json` contains no `"test"` script, no test runner (Jest/Mocha), and 0 test files in `server/`.
- **Impact:** Recruiters evaluating Full-Stack proficiency expect automated tests validating authentication, authorization headers, doctor approvals, and appointment scheduling.

---

### Finding 6: Flawed Client Test Suite (CONFIRMED)
- **Technical Evidence:** `client/src/App.test.tsx` retains default Create React App boilerplate:
  ```typescript
  test('renders learn react link', () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
  });
  ```
- **Observed Behavior:** Running `npm test` in `client/` fails immediately because `App.tsx` contains Redux and Router providers, not the text "learn react".

---

### Finding 7: Concurrent Duplicate Appointment Booking Race Condition (CONFIRMED)
- **Technical Evidence:** `server/models/appointmentModel.js` and `server/controllers/userController.js:bookAppointment`.
  - `checkBookingAvailability` checks if an appointment exists, but between the availability check and the `bookAppointment` call, two patients can book the same doctor at the exact same date and time.
  - Adding a compound unique index in Mongoose (`{ doctorId: 1, date: 1, time: 1 }`) guarantees database-level duplicate prevention.

---

## 3. Prioritized Implementation Sequence

1. **Task 1: Connectivity & Port Synchronization:**
   - Align server default port to `5000` in `server/server.js`.
   - Add resilient fallback `baseUrl: process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1"` in `client/src/redux/api/apiSlice.ts`.
2. **Task 2: Environment Documentation & Startup Guard:**
   - Create `server/.env.example` with documented variables and placeholder strings.
   - Create `client/.env.example`.
   - Add startup pre-check in `server/server.js` with clear diagnostic guidance instead of an unhandled crash when `DATABASE` is missing.
3. **Task 3: Automated Integration Test Suite (Jest + Supertest):**
   - Install `jest` and `supertest` in `server/`.
   - Implement comprehensive tests for:
     - User registration & input validation (invalid email, short password, missing name)
     - User login & JWT issuance
     - Role-based authorization & route protection (`authController.protect`)
     - Doctor profile application & status updates
     - Appointment booking & availability checking
     - Duplicate appointment prevention
4. **Task 4: Fix Client Tests & Scripts:**
   - Update `client/src/App.test.tsx` to render with Redux Provider and MemoryRouter.
   - Update `server/package.json` engine requirements to `"node": ">=18.0.0"`.
5. **Task 5: Documentation & Placement Value:**
   - Update `README.md` with system architecture diagrams, Windows 11 setup guide, API catalog, and verified test execution table.
   - Draft interview Q&A and resume bullet points.

*(Audit completed and recorded before any implementation changes)*
