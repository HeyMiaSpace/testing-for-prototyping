# Publish To GitHub Pages

## Files to keep in the repo

- `index.html`
- `styles.css`
- `script.js`
- `.gitignore`

Optional:
- `README-share.md`

Do not include:
- `output/`
- `verify.js`

## Commands

Run these commands from:

`/Users/yzhang/Library/CloudStorage/OneDrive-athenahealth/Desktop/untitled folder`

```bash
git init
git add .
git commit -m "Add Sage EHR prototype"
git branch -M main
```

Then create a new empty GitHub repo in the browser, and run:

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Turn On GitHub Pages

In your GitHub repo:

1. Open `Settings`
2. Open `Pages`
3. Under `Build and deployment`
4. Set `Source` to `Deploy from a branch`
5. Set branch to `main`
6. Set folder to `/ (root)`
7. Save

GitHub will then give you a site URL like:

`https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

## Note About Microphone

The voice input flow works best in Chrome. Since GitHub Pages uses `https`, microphone permission can be requested normally.

