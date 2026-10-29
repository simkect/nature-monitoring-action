# 🍃 Nature Monitoring Action

![Nature Monitoring Action Logo](public/images/logo.png) 
<!-- Replace the line above with your actual screenshot or logo path, e.g., ![App Screenshot](screenshot.png) -->

## 📖 Description

**Nature Monitoring Action** is a full-stack MEN (MongoDB, Express, EJS, Node.js) application built for the Environmental Protection Agency. It allows field agents and citizen scientists to capture photographic evidence of environmental observations, automatically tagging them with precise geolocation, compass heading, and timestamp data. 

The app features a browser-based camera that uses **TensorFlow.js and MobileNet** to run AI image recognition directly on the user's device, automatically identifying what is in the picture (e.g., "tree", "bird", "vehicle"). All captured data is securely stored and can be visualized on an interactive OpenLayers map.

### Why I built this
This project was built to fulfill the General Assembly Software Engineering Immersive requirements. I wanted to create an app that not only demonstrated full CRUD capabilities and session-based authentication but also solved a real-world problem by leveraging modern browser APIs (Geolocation, Device Orientation, MediaDevices) and client-side AI.

---

## 🚀 Getting Started

- **Live Deployed App:** [Insert your deployed Cloudflare Tunnel URL here (e.g., https://nature.yourdomain.com)]
- **Planning Materials:** [Insert link to your Trello board, Figma, or planning document here]

### How to use the app
1. **Register/Login:** Create an account. (By default, new accounts are given the `'user'` role).
2. **Take a Picture:** Click "Take Picture" in the navigation. Allow the browser to access your camera and location. Point at an object and click "Capture & Save". The AI will identify the object.
3. **View Contributions:** See your photos and metadata on the Home page.
4. **View the Map:** Navigate to the Map tab to see a visual representation of where all photos in the database were taken.
5. **Admin Panel:** Admins can access a special panel to view all users and delete accounts (which safely cascade-deletes all associated photo data).

---

## 🛠 Technologies Used

**Backend:**
- **Node.js & Express:** Server environment and routing.
- **MongoDB & Mongoose:** NoSQL Database and Object Data Modeling (ODM).
- **GridFS:** Used for storing image files directly in MongoDB (handling files larger than the 16MB BSON limit).
- **Express-Session & Connect-Mongo:** Session-based authentication and secure cookie management.
- **bcryptjs:** Password hashing.
- **Multer & Method-Override:** Handling multipart/form-data (image uploads) and RESTful PUT/DELETE requests from HTML forms.

**Frontend:**
- **EJS (Embedded JavaScript):** Server-side templating engine.
- **Vanilla CSS:** Custom styling, CSS Grid, Flexbox, and mobile responsiveness (No frameworks).
- **OpenLayers:** Interactive mapping library for visualizing geospatial data.
- **TensorFlow.js & MobileNet:** Client-side machine learning for real-time image classification.
- **Modern Browser APIs:** `MediaDevices` (Camera), `Geolocation` (GPS), `DeviceOrientation` (Compass).

---

## 🤝 Attributions

- **Environmental Protection Agency of Montenegro:** Color palette and branding inspiration.
- **TensorFlow.js & MobileNet:** Pre-trained AI models provided by Google.
- **OpenLayers:** Open-source mapping library.
- **OpenStreetMap:** Map tile data.
- **MDN Web Docs:** Extensive reference for Browser APIs (Geolocation, MediaDevices).
- **Icons & Emojis:** Native system emojis used for UI icons.

---

## 🔮 Next Steps (Future Enhancements)

While the app meets all MVP requirements, I plan to add the following features in the future:
1. **Offline Support:** Implement a Service Worker so agents can capture photos in the wilderness without internet, storing them in IndexedDB and syncing to MongoDB when a connection is restored.
2. **Image Compression:** Compress images on the client-side before uploading to save database space and speed up load times on the map.
3. **Advanced Filtering:** Allow users to filter the map and gallery by AI labels (e.g., "Show me all photos containing 'cars'").
4. **Cloud Storage:** Migrate image storage from GridFS to AWS S3 or Cloudinary for better scalability.
5. **Role Management UI:** Allow the Admin to promote regular users to other roles directly from the Admin Panel.