# Common Read — Setup Guide

A complete step-by-step walkthrough. No developer experience needed.

---

## What You'll Be Doing

You're going to set up 4 free accounts/tools, then run about 10 commands in Terminal to get your app live on the internet. Total time: about 30-45 minutes.

Here's the overview:
1. Open Terminal (your command line tool)
2. Install Node.js (a tool that runs JavaScript)
3. Sign up for Cloudflare (free — this hosts your app)
4. Sign up for API.Bible (free — this provides the NIV scripture text)
5. Download the project and install it
6. Create your database
7. Set your secret keys
8. Deploy to the internet
9. Push to GitHub for safekeeping

---

## Step 1: Open Terminal

Terminal is already on your Mac. Here's how to open it:

1. Press **Command + Space** to open Spotlight search
2. Type **Terminal**
3. Press **Enter**

A window will open with a blinking cursor. This is where you'll type commands. Every time this guide says "run this command," you'll type (or paste) it here and press **Enter**.

**Tip:** To paste into Terminal, use **Command + V** just like anywhere else.

---

## Step 2: Check if Node.js is Installed

Run this command:

```
node --version
```

**If you see a version number** like `v18.17.0` or `v20.11.0` — you're good! Skip to Step 3.

**If you see "command not found"** — you need to install Node.js:

1. Open Safari (or any browser)
2. Go to **https://nodejs.org**
3. Click the big green button that says **LTS** (the "recommended" version)
4. A `.pkg` file will download — double-click it
5. Follow the installer (click Continue, Agree, Install — all the defaults are fine)
6. **Close Terminal completely** (Command + Q) and **reopen it** (Step 1 again)
7. Run `node --version` again — you should now see a version number

---

## Step 3: Sign Up for Cloudflare

1. Go to **https://dash.cloudflare.com/sign-up**
2. Create a free account with your email and a password
3. Verify your email if prompted
4. You don't need to add a website or domain — just having the account is enough

---

## Step 4: Sign Up for API.Bible

1. Go to **https://scripture.api.bible**
2. Click **Sign Up** (top right)
3. Create an account
4. Once logged in, go to **https://scripture.api.bible/admin/applications**
5. Click **Create New Application**
6. Fill in:
   - **Name:** Common Read
   - **Description:** Group devotional app
   - **Website URL:** You can put anything here for now, like `https://example.com`
7. Click **Create**
8. You'll see an **API Key** — **copy this and save it somewhere safe** (a note on your phone, a sticky note, whatever). You'll need it in Step 7.

---

## Step 5: Download and Set Up the Project

### 5a: Create a project folder

Run this command:

```
cd ~/Desktop
```

This moves you to your Desktop folder.

### 5b: Unzip the project

You should have downloaded the `common-read.zip` file from our conversation. Find it in your Downloads and unzip it by double-clicking it. Then move it to Desktop:

```
mv ~/Downloads/common-read ~/Desktop/common-read
```

If that gives an error, the zip might have extracted differently. Try:

```
mv ~/Downloads/daily-bread ~/Desktop/common-read
```

Or just drag the folder from Downloads to Desktop using Finder and rename it to `common-read`.

### 5c: Go into the project folder

```
cd ~/Desktop/common-read
```

### 5d: Install the project's dependencies

```
npm install
```

This will take 30-60 seconds. You'll see a progress bar and lots of text. That's normal. Wait for it to finish (you'll see your cursor blinking on a new line again).

---

## Step 6: Set Up Cloudflare and the Database

### 6a: Log in to Cloudflare from Terminal

```
npx wrangler login
```

This will open a browser window asking you to authorize Wrangler (Cloudflare's command line tool). Click **Allow**. Then come back to Terminal.

### 6b: Create the database

```
npx wrangler d1 create common-read-db
```

This will print something like:

```
✅ Successfully created DB 'common-read-db'

[[d1_databases]]
binding = "DB"
database_name = "common-read-db"
database_id = "abc12345-def6-7890-ghij-klmnopqrstuv"
```

**Copy that `database_id` value** (the long string of letters, numbers, and dashes).

### 6c: Paste the database ID into the config file

Open the file `wrangler.toml` in a text editor. You can do this from Terminal:

```
open -a TextEdit wrangler.toml
```

Find the line that says:

```
database_id = "YOUR_DATABASE_ID_HERE"
```

Replace `YOUR_DATABASE_ID_HERE` with the ID you just copied. Keep the quotes. It should look something like:

```
database_id = "abc12345-def6-7890-ghij-klmnopqrstuv"
```

**Save the file** (Command + S) and close TextEdit.

### 6d: Create the database tables

Run this command to set up the database structure:

```
npx wrangler d1 execute common-read-db --remote --file=./schema.sql
```

You should see a success message.

---

## Step 7: Set Your Secret Keys

You need to set two secrets that your app will use. These are stored securely on Cloudflare — they never go in your code.

### 7a: Set the Bible API key

```
npx wrangler pages secret put BIBLE_API_KEY
```

It will ask you to type or paste a value. **Paste the API key you saved from Step 4.** Press Enter. (Note: you won't see the text as you paste it — that's a security feature. Just paste and press Enter.)

### 7b: Create and set a JWT secret

This is a random string used to keep user sessions secure. Run this to generate one:

```
openssl rand -hex 32
```

This will print a long random string. **Copy it.** Then run:

```
npx wrangler pages secret put JWT_SECRET
```

Paste the random string and press Enter.

---

## Step 8: Deploy!

This is the big moment. Run:

```
npm run deploy
```

Wrangler will build your app and upload it to Cloudflare. The first time, it may ask you a couple questions:

- **"What is the name of your project?"** — type `common-read` and press Enter
- **"What is your production branch?"** — just press Enter to accept the default (`main`)

When it's done, you'll see a URL like:

```
✨ Deployment complete! https://common-read.pages.dev
```

**That's your app!** Open that URL in a browser. You should see the Common Read login screen.

---

## Step 9: Push to GitHub

Now let's save your code to GitHub so you don't lose it and can make changes later.

### 9a: Go to GitHub and create a new repository

1. Go to **https://github.com/new**
2. **Repository name:** `common-read`
3. **Description:** Group devotional app
4. Leave it as **Public** (or choose Private if you prefer)
5. Do NOT check "Add a README" (we already have one)
6. Click **Create repository**

GitHub will show you a page with setup commands. You'll use the "push an existing repository" option.

### 9b: Set up Git locally and push

Back in Terminal (make sure you're still in the `common-read` folder), run these commands one at a time:

```
git init
```

```
git add .
```

```
git commit -m "Initial commit - Common Read devotional app"
```

```
git branch -M main
```

```
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/common-read.git
```

**Important:** Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username in that last command.

```
git push -u origin main
```

If this is your first time using Git from Terminal, it may ask you to log in. Follow the prompts — it may open a browser window for GitHub authentication.

---

## Step 10: Try It Out!

1. Go to your app URL (the one from Step 8, like `https://common-read.pages.dev`)
2. Click **"Don't have an account? Create one"**
3. Pick a username, display name, and password
4. Click **New Group**
5. Name your group, pick a book of the Bible (maybe start with James — short and practical), and set today as the start date
6. You'll get an invite code — **text this to your friends**
7. They go to the same URL, create an account, click **Join**, and enter the code

**Your daily flow:**
- Open the app → see today's centering prompt → take a moment to center yourself
- Click "I'm ready to read" → read the chapter
- Switch to the Reflect tab → answer the day's rotating question
- See what your friends wrote
- Check the Community tab to see streaks and progress
- Browse the Journal tab to scroll through your group's shared history

---

## Troubleshooting

### "command not found" when running npm or node
Close Terminal completely and reopen it. If that doesn't work, reinstall Node.js from https://nodejs.org.

### The deploy command asks for a project name
Type `common-read` and press Enter. If it says the name is taken, try `common-read-app` or add your initials.

### "Error: unauthorized" or login issues
Run `npx wrangler login` again and re-authorize in the browser.

### The Bible text doesn't load
Double-check that you set the `BIBLE_API_KEY` secret correctly in Step 7a. You can re-run the command to overwrite it.

### The page loads but nothing works
Open your browser's developer tools (right-click → Inspect → Console tab) and look for red error messages. Share those with Claude for help debugging.

### I want to make changes later
Edit the files, then run:
```
npm run deploy
```
And to save to GitHub:
```
git add .
git commit -m "Description of what you changed"
git push
```

---

## What's Running Where

| Thing | Where | Cost |
|-------|-------|------|
| Your app's website | Cloudflare Pages | Free |
| Your app's API (backend logic) | Cloudflare Workers | Free |
| Your database (users, groups, reflections) | Cloudflare D1 | Free |
| Bible text | API.Bible | Free (5,000 calls/day) |
| Your code backup | GitHub | Free |

Everything is on free tiers. For a small group of friends, you won't come close to any limits.
