# Graph Report - LifeLine  (2026-08-25)

## Corpus Check
- 69 files · ~282,667 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 302 nodes · 458 edges · 46 communities (17 shown, 29 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Pages & Navigation
- IoT & Hardware Dispatch
- Core Subsystem 2
- Backend Server & Scripts
- Core Subsystem 4
- Core Subsystem 5
- App Pages & Navigation
- Core Subsystem 7
- Backend Server & Scripts
- UI Components & Styling
- UI Components & Styling
- IoT & Hardware Dispatch
- Backend Server & Scripts
- Core Subsystem 14
- UI Components & Styling
- Core Subsystem 16
- Backend Server & Scripts
- Core Subsystem 18
- Core Subsystem 19
- Core Subsystem 20
- Core Subsystem 21
- Core Subsystem 22
- Core Subsystem 23
- Core Subsystem 24
- Core Subsystem 25
- Core Subsystem 26
- UI Components & Styling
- Core Subsystem 28
- Core Subsystem 29
- Core Subsystem 30
- Core Subsystem 31
- Core Subsystem 32
- Core Subsystem 33
- Core Subsystem 34
- UI Components & Styling
- State Management & Storage
- Core Subsystem 37
- Core Subsystem 38
- Core Subsystem 39
- Core Subsystem 40
- Core Subsystem 41
- Core Subsystem 42

## God Nodes (most connected - your core abstractions)
1. `RF()` - 24 edges
2. `useTheme()` - 23 edges
3. `expo` - 15 edges
4. `useDispatch()` - 15 edges
5. `expo-router` - 11 edges
6. `scripts` - 11 edges
7. `NavigationHeader()` - 9 edges
8. `permissions` - 7 edges
9. `useAuth()` - 7 edges
10. `useTheme()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Collapsible()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/ui/collapsible.tsx → src/hooks/use-theme.ts
- `TabIcon()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/_layout.tsx → src/context/ThemeContext.tsx
- `TabIcon()` --calls--> `RF()`  [EXTRACTED]
  src/app/_layout.tsx → src/utils/Responsive.ts
- `DoctorFloatingBubble()` --calls--> `useDispatch()`  [EXTRACTED]
  src/app/_layout.tsx → src/context/DispatchContext.tsx
- `DoctorFloatingBubble()` --calls--> `useTheme()`  [EXTRACTED]
  src/app/_layout.tsx → src/context/ThemeContext.tsx

## Import Cycles
- None detected.

## Communities (46 total, 29 thin omitted)

### Community 0 - "App Pages & Navigation"
Cohesion: 0.07
Nodes (59): plugins, expo-router, DoctorScreen(), getStyles(), AMBULANCE_ROUTE, AnimatedTouchable, DESTINATION, EmergencyScreen() (+51 more)

### Community 1 - "IoT & Hardware Dispatch"
Cohesion: 0.11
Nodes (20): styles, ExternalLink(), Props, HintRowProps, styles, styles, ThemedText(), ThemedTextProps (+12 more)

### Community 2 - "Core Subsystem 2"
Cohesion: 0.08
Nodes (24): projectId, reactCompiler, typedRoutes, expo, experiments, extra, icon, ios (+16 more)

### Community 3 - "Backend Server & Scripts"
Cohesion: 0.10
Nodes (20): devDependencies, @types/react, typescript, main, name, private, scripts, android (+12 more)

### Community 4 - "Core Subsystem 4"
Cohesion: 0.12
Nodes (16): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+8 more)

### Community 5 - "Core Subsystem 5"
Cohesion: 0.15
Nodes (12): ./assets/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+4 more)

### Community 6 - "App Pages & Navigation"
Cohesion: 0.21
Nodes (10): AuthContext, AuthContextProps, AuthProvider(), DB, DOCTORS, HOSPITALS, MEDICINES, mockUsers (+2 more)

### Community 7 - "Core Subsystem 7"
Cohesion: 0.22
Nodes (9): expo, expo-image, express, dependencies, expo, expo-image, express, react-native-webview (+1 more)

### Community 8 - "Backend Server & Scripts"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 9 - "UI Components & Styling"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 10 - "UI Components & Styling"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 11 - "IoT & Hardware Dispatch"
Cohesion: 0.83
Nodes (3): blink_led(), main(), send_alert()

### Community 12 - "Backend Server & Scripts"
Cohesion: 0.50
Nodes (3): app, express, lastSeenDevices

## Knowledge Gaps
- **147 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `App Pages & Navigation` to `IoT & Hardware Dispatch`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `expo` connect `Core Subsystem 2` to `App Pages & Navigation`, `Core Subsystem 4`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `plugins` connect `App Pages & Navigation` to `Core Subsystem 2`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Pages & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.06997408367271381 - nodes in this community are weakly interconnected._
- **Should `IoT & Hardware Dispatch` be split into smaller, more focused modules?**
  _Cohesion score 0.10960960960960961 - nodes in this community are weakly interconnected._
- **Should `Core Subsystem 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._