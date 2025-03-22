# 📄 Collaborative Editor

A real-time collaborative text editor built with **Next.js, Quill, Yjs, MongoDB, and Redis**. Create, edit, and export documents with unique IDs while collaborating with others seamlessly.

## 🚀 Demo
🔗 **Live Demo:** [Coming soon!]

## ✨ Features
✅ **Real-Time Collaboration** - Edit documents with others in real-time using **Yjs** and **Quill**.
✅ **Unique Document IDs** - Each document has a **unique ID** for easy management and retrieval.
✅ **Persistent Storage** - Save documents to **MongoDB** with **Redis** caching.
✅ **Export Options** - Download documents as **Word (.docx) or PDF** with document ID in filenames.
✅ **Modern UI** - Responsive design with **Tailwind CSS**, gradient headers, and smooth animations.
✅ **Rich Text Editing** - Supports fonts, bold, italic, lists, links, and more.

## 🛠️ Tech Stack
- **Frontend:** Next.js 13+, React, TypeScript, Tailwind CSS, Quill
- **Real-Time:** Yjs, y-quill
- **Backend:** Next.js API Routes, MongoDB, Redis
- **Export:** docx, jspdf, file-saver
- **Utilities:** uuid

## 📌 Prerequisites
Ensure you have the following installed:
- **Node.js 18+** (recommended: 20)
- **MongoDB Atlas** account
- **Redis** instance (local or cloud-hosted)
- **npm 8+**

## 📥 Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/digvijaysingh703/collaborative-editor.git
cd collaborative-editor
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env.local` file and add the following:
```sh
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/editorDB?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379
```
Replace `<username>`, `<password>`, and `<cluster>` with your **MongoDB Atlas** details.
Update `REDIS_URL` for your **Redis setup**.

### 4️⃣ Run Locally
```sh
npm run dev
```
Visit 👉 **[collaborative-editor-dj10.vercel.app](collaborative-editor-dj10.vercel.app)**

### 5️⃣ Build for Production
```sh
npm run build
npm start
```

## 📝 Usage
1️⃣ **Create a Document:** Click "New Document" to generate a unique ID.
2️⃣ **Switch Documents:** Enter a document ID in the input field to load it.
3️⃣ **Collaborate:** Open multiple tabs to see real-time updates.
4️⃣ **Save:** Auto-saves every second, or click "Save Now" manually.
5️⃣ **Export:** Use "Save as Word" or "Save as PDF" to download files (e.g., `document-<id>.docx`).

## 📂 Project Structure
```bash
collaborative-editor/
├── src/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utility functions (DB, Redis, Yjs)
│   ├── styles/             # CSS with Tailwind
│   └── types/              # Custom TypeScript declarations
├── .env.local              # Environment variables
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript config
└── README.md               # Project documentation
```

## 🌍 API Endpoints
- **Save a document:**
  ```http
  POST /api/document
  Body: { id: string, content: string }
  ```
- **Fetch a document by ID:**
  ```http
  GET /api/document?id=<id>
  ```

## 🛠 Troubleshooting
- **MongoDB Errors:** Ensure `MONGO_URI` is correct, whitelist your **IP in Atlas**, and ensure **TLS 1.2+** support.
- **Redis Issues:** Verify `REDIS_URL` and **Redis server status**.
- **TypeScript Issues:** Run `npm install` to sync dependencies; check `src/types/declarations.d.ts`.

## 🤝 Contributing
Contributions are welcome! To contribute:
1️⃣ **Fork** the repository.
2️⃣ Create a **feature branch**: `git checkout -b feature/your-feature`.
3️⃣ **Commit** changes: `git commit -m "Add your feature"`.
4️⃣ **Push** to the branch: `git push origin feature/your-feature`.
5️⃣ Open a **Pull Request**.

## 📜 License
This project is licensed under the **MIT License**.

## 📞 Contact
👤 **Author:** Digvijay Singh  
🔗 **GitHub:** [@digvijaysingh10](https://github.com/digvijaysingh10)

