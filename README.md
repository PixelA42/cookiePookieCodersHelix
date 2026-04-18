# Project Setup & Git Workflow Guide

This guide is for team members who are not familiar with Git/GitHub.  
Follow these steps properly to avoid breaking the repository.

---

## 1. Clone the Repository

Run this only once:

    git clone https://github.com/PixelA42/cookiePookieCodersHelix.git
    npm i

---

## 2. Create Your Own Branch

⚠️ Do NOT work on `main`

    git checkout -b your-name-feature

Example:

    git checkout -b pavneet-auth

---

## 3. Make Changes

Edit the code using your editor (VS Code recommended).

---

## 4. Commit Your Changes

    git add .
    git commit -m "Short meaningful message"

Example:

    git commit -m "Added login API"

---

## 5. Push Your Branch

    git push origin your-name-feature

---

## 6. Create Pull Request (PR)

1. Go to GitHub repo
2. Click **Compare & pull request**
3. Add description
4. Click **Create pull request**

---

## 7. Sync with Latest Code (IMPORTANT)

Before starting work every time:

    git checkout main
    git pull origin main
    git checkout your-name-feature
    git merge main

---

## 8. Handling Conflicts

If conflicts appear:

- Open files
- Fix manually
- Then run:

    git add .
    git commit -m "Resolved merge conflict"

---

## 9. Rollback / Undo Changes

Undo last commit (keep changes):

    git reset --soft HEAD~1

Undo last commit (delete changes):

    git reset --hard HEAD~1

Go to previous commit:

    git log
    git checkout <commit-id>

---

## 10. Switch Branches

    git checkout branch-name

---

## 11. Delete Branch After Merge

    git branch -d branch-name

---

## Rules (IMPORTANT)

- Do NOT push directly to `main`
- Always create a branch
- Pull latest changes before starting
- Keep commits clean and meaningful
- Avoid committing unnecessary files

---

## Workflow Summary

    clone → branch → code → commit → push → PR → merge

---

## If Something Breaks

Try:

    git pull origin main

If still stuck, ask before doing random fixes.
