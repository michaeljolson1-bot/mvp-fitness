# MVP Fitness

Personal workout app (Expo / React Native) built from `MVP - Michael Olson.xlsx`.

## Run it on your iPhone (no laptop needed)

GitHub builds the app in the cloud and Expo hosts it; Expo Go opens it from there.
Every push to `main` publishes a new version automatically.

One-time setup:
1. **Expo account:** sign up free at expo.dev. Sign into Expo Go on your phone with it.
2. **Expo project:** expo.dev > Projects > Create project, slug `mvp-fitness`. Copy the **Project ID**.
3. **Expo token:** expo.dev > Account settings > Access tokens > Create. Copy it.
4. **GitHub repo:** on your personal account, new **private** repo `mvp-fitness`.
   Upload the unzipped files (drag the folder contents onto "uploading an existing file").
5. **Workflow file:** Finder hides `.github`, so create it in the browser: Add file > Create new file,
   name `.github/workflows/publish.yml`, paste in the contents of `publish-workflow.yml`, commit.
6. **Repo settings** > Secrets and variables > Actions > Secrets tab: `EXPO_TOKEN` = the token from step 3
   (Project ID is already in app.json.)
7. Actions tab > publish > Run workflow. Takes ~3 min.
8. expo.dev > your project > Updates > open the latest update > scan the QR with your iPhone camera.
   It opens in Expo Go and stays in Expo Go's recent projects list.

Data is stored on the phone (SQLite). Deleting Expo Go deletes it.

## Run locally instead (any machine with public npm)

```bash
npm install
npx expo start   # scan the QR with your iPhone camera, same Wi-Fi
```

## Updating from the spreadsheet

```bash
pip install openpyxl
python3 scripts/parse_xlsx.py "MVP - Michael Olson.xlsx"   # rewrites src/data/seed.json
```
Then in the app: Workout tab > bottom > **Re-import sheet data**. Targets refresh; your tips, history, and questions stay.

## Sheet rules the parser applies
- Excel-mangled rep ranges (Aug 10) convert back to ranges (8-10). "10-8" reads as 8-10.
- Rows under a slot with no slot of their own (low row: 2 arm / single arm / half kneeling) are separate exercises, 3 sets each unless the sheet says otherwise.
- Same number, different letter = superset (1a/1b). 6a/6b/6c and 7a/7b/7c = tri-sets. Back 5c skull crushers = standalone.
- Blank sets = 3. "25ea" = 25 lb per dumbbell (volume counts both). "130, 110, 90" = drop set.
- Column A = exercise tips. Columns I-L = a logged session on the day's header date (Aug 13).
- Muscle group and Push/Pull are auto-tagged from the exercise name; fix any in the app (long-press an exercise).

## Layout
- `src/app/(tabs)/index.tsx` builder (prompt, sheet quick start, manual pick)
- `src/app/workout.tsx` active workout carousel
- `src/app/(tabs)/questions.tsx` Questions for James
- `src/app/(tabs)/history.tsx` calendar + progression
- `src/app/exercise/[id].tsx` edit exercise (tips, targets, tags)
- `src/store.tsx` state + persistence, `src/lib/planner.ts` offline prompt parser
