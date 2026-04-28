# Share This Prototype

This prototype is a static site. The main file is `index.html`, with `styles.css` and `script.js` next to it.

## Fastest Option: Netlify Drop

1. Open [Netlify Drop](https://app.netlify.com/drop).
2. Drag the whole folder into the browser:
   `/Users/yzhang/Library/CloudStorage/OneDrive-athenahealth/Desktop/untitled folder`
3. Netlify will generate a live URL in a few seconds.
4. Share that URL with others.

Notes:
- The microphone flow works best in Chrome.
- Hosted over `https`, the browser can request microphone permission normally.

## Better Reusable Option: GitHub + Netlify

1. Create a new GitHub repository.
2. Upload these files from the folder root:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `netlify.toml`
3. In Netlify, choose `Add new site` -> `Import an existing project`.
4. Connect the GitHub repo.
5. Netlify should detect this as a static site automatically.
6. Publish and share the generated URL.

## GitHub Pages Option

1. Create a GitHub repository and upload:
   - `index.html`
   - `styles.css`
   - `script.js`
2. In GitHub, open `Settings` -> `Pages`.
3. Under `Build and deployment`, choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` and `/ (root)`
4. Save and wait for the site URL.

Notes:
- GitHub Pages is fine for the demo, but Netlify is usually smoother for quick sharing.
- The browser microphone prompt may behave slightly differently across browsers, so Chrome is still the safest choice for demos.

## What To Share

If you are sending files directly instead of hosting, zip and send the full folder:

`/Users/yzhang/Library/CloudStorage/OneDrive-athenahealth/Desktop/untitled folder`

