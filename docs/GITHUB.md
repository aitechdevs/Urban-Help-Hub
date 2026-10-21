# Upload to GitHub

1. Extract the outer ZIP on your PC.
2. Open the extracted UrbanHelpHub-GitHub-Source folder. README.md, .gitignore,
   backend-api and frontend should be directly inside this folder.
3. Create an empty PRIVATE GitHub repository, for example urbanhelphub.
   Do not initialize it with a README or .gitignore because these are included.
4. With Git installed, open a terminal in the extracted folder and run:

```bash
git init
git add .
git status
git commit -m "Import UrbanHelpHub source and maintained static frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/urbanhelphub.git
git push -u origin main
```

Replace YOUR_USERNAME and repository name with your actual repository details.
Authenticate using GitHub's supported sign-in flow; do not put tokens in files.
Before committing, inspect git status: no .env, customer database, document uploads,
vendor or node_modules should appear. Environment EXAMPLE files are included.

GitHub Desktop alternative: add this folder as a local repository, create the
repository when prompted, commit the files, and publish it as PRIVATE.

Upload the extracted contents, not only the ZIP itself. Your production .env,
database and private uploads belong in a separate private backup, not this repo.
GitHub stores source; it does not automatically deploy this PHP API or update cPanel.
