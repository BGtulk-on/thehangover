# Hostinger Guide

Since Hostinger Shared Hosting only supports PHP (not Node.js), we use a swapped backend for production.

## 1. Environment Setup
- Go to **Hostinger File Manager**.
- Upload your `.env` file to the root `public_html` folder.
- Ensure it contains your database credentials (`DB_HOST`, `DB_USER`, etc.).

## 2. Backend Setup (`/api`)
1. Create a **New Folder** named `api` inside `public_html`.
2. Open the `public_html/api/` folder.
3. Upload the files from the local `php_backend/` folder:
   - `index.php`
   - `db.php`
   - `.htaccess`

**Note:** The `.htaccess` in the `api` folder handles the API routing, while the one in `public_html` handles the React app routing.
You will hoave to do this every time you push to the repository. Sorry, but that's the only way to make it work.