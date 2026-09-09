# INSA Learning Management System — Frontend Application

Modern, responsive Next.js 15 web application powering the **INSA Cybersecurity & Awareness Learning Management System**. Built with TypeScript, React 19, Tailwind CSS, Lucide Icons, and full-featured Role-Based Access Control (RBAC).

---

## 🌟 Key Features

### 🎓 Learner Experience
- **Interactive Course Player**: Dynamic course module viewer supporting rich text, video streams, audio, interactive slides, and downloadable resources.
- **8-Type Assessment Engine**: Complete test-taking interface with instant autosave (800ms debounce), countdown timers, question navigation, and real-time state persistence:
  - Single Choice (`multiple_choice`)
  - Multiple Select (`multiple_select`)
  - True / False (`true_false`)
  - Fill in the Blank (`fill_blank`)
  - Matching Pairs (`matching`)
  - Sequence Ordering (`ordering`)
  - Short Answer (`short_answer`)
  - Long Essay (`essay`)
- **Exam Results & Feedback**: Detailed score cards, passing threshold indicators, and instructor review feedback per question.
- **Verifiable Digital Certificates**: Cryptographically verifiable PDF certificates with QR codes, downloadable upon completing courses and passing exams ($\ge 70\%$).
- **Public Certificate Verification Portal**: Direct verification interface (`/verify-certificate/[code]`) allowing third parties to validate credentials instantly.
- **Engagement & Gamification**: Streak tracking, leaderboards, achievement badges, and learning analytics.

### 🛡️ Administration & Instructor Hub
- **Executive Analytics Dashboard**: Real-time metrics for total enrollments, completion rates, active learners, and campaign engagements.
- **Manual Grading Hub (`/admin/grading`)**:
  - Filter attempts by status (`needs_review`, `graded`, `all`), search by learner name/email, and dynamic course-scoped filtering.
  - Interactive Grading Modal (`GradingModal.tsx`): Review learner submissions across subjective questions, input numerical scores ($0 \le \text{score} \le \text{max\_points}$), provide structured instructor feedback notes, and trigger atomic score recalculation.
- **Course & Lesson Authoring**: Rich CMS supporting multilingual lesson content, multimedia uploads, prerequisite chains, and syllabus structuring.
- **Assessment Builder**: Dynamic drag-and-drop question builder configuring points, passing scores, time limits, and question banks.
- **User & Role Management**: Granular permission control for Superadmins, Course Providers, Instructors, and Trainees.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server & Client Components) |
| **Language** | TypeScript (Strict mode enabled) |
| **Styling** | Tailwind CSS with responsive dark/light theme tokens |
| **Icons** | Lucide React |
| **Charts** | Chart.js & React-Chartjs-2 |
| **State & Fetching** | Native Fetch API with custom interceptors (`src/lib/api.ts`) |
| **Authentication** | JWT (JSON Web Tokens) with refresh flow stored in secure cookies/localStorage |

---

## 📂 Project Structure

```
INSA_Learning_Management/
├── src/
│   ├── app/                               # Next.js App Router routes
│   │   ├── (auth)/                        # Authentication (login, register, forgot-password)
│   │   ├── admin/                         # Administrative & Instructor portals
│   │   │   ├── courses/                   # Course management & authoring
│   │   │   ├── grading/                   # Manual Grading Hub & attempts review
│   │   │   ├── users/                     # User management & role assignment
│   │   │   ├── campaigns/                 # Awareness campaign tracking
│   │   │   └── settings/                  # Platform configuration
│   │   ├── courses/                       # Learner course catalog & classroom player
│   │   │   └── [id]/exam/                 # Assessment test-taking runner
│   │   ├── certificates/                  # Learner certificate wallet
│   │   ├── verify-certificate/[code]/     # Public certificate verification
│   │   ├── dashboard/                     # Learner personalized dashboard
│   │   ├── profile/                       # User profile & preferences
│   │   └── page.tsx                       # Public landing page
│   ├── components/                        # Reusable UI component library
│   │   ├── AssessmentViewer.tsx           # Multi-type test engine runner
│   │   ├── GradingModal.tsx               # Instructor subjective evaluation modal
│   │   ├── CourseCard.tsx                 # Responsive course catalog card
│   │   ├── Navbar.tsx / Footer.tsx        # Navigation layouts
│   │   └── ...
│   ├── lib/                               # Core libraries & utilities
│   │   ├── api.ts                         # Complete typed API client for backend REST endpoints
│   │   ├── auth.ts                        # Client-side session and auth state helpers
│   │   └── utils.ts                       # Formatting, dates, score calculations
│   └── types/                             # TypeScript interface definitions
│       └── index.ts                       # Shared domain models
├── public/                                # Static assets (logos, illustrations, icons)
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x LTS
- `npm` or `yarn` / `pnpm`
- Running Django backend instance (`InsaAwaranessBackEnd` on port 8000)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd INSA_Learning_Management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root of `INSA_Learning_Management`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Run Development Server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Build & Type Checking

To validate type integrity and production builds:

```bash
# Type check without emitting files
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm run start
```

---

## 🔗 Key API Integrations

The frontend communicates with the Django REST backend via `src/lib/api.ts`:
- **Assessments**: `getAssessment()`, `startAssessment()`, `saveAssessmentProgress()`, `submitAssessment()`, `getAssessmentResults()`
- **Grading Engine**: `getAssessmentAttempts()`, `getAssessmentAttemptDetails()`, `manualGradeAttempt()`
- **Certificates**: `getCertificates()`, `verifyCertificate()`, `downloadCertificatePDF()`
- **Courses & Progress**: `getCourses()`, `getCourseModules()`, `markLessonComplete()`
