# העלאת sea-click ל-GitHub

המשבצת כבר מאותחלת עם commit ראשון. כדי להעלות ל-GitHub:

## אפשרות 1: GitHub CLI (אם מותקן)
```bash
cd /Users/noamshafran/Projects/sunset-game
gh repo create sea-click --public --source=. --remote=origin --push
```

## אפשרות 2: יצירה ידנית ב-GitHub
1. גלוש ל־https://github.com/new
2. שם הריפו: **sea-click**
3. בחר Public
4. **אל תוסיף** README, .gitignore או license (הם כבר קיימים)
5. לחץ על Create repository

ואז הרץ:
```bash
cd /Users/noamshafran/Projects/sunset-game
git remote add origin https://github.com/YOUR_USERNAME/sea-click.git
git branch -M main
git push -u origin main
```
(החלף YOUR_USERNAME בשם המשתמש שלך ב-GitHub)
