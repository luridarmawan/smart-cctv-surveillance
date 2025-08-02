# Smart CCTV Surveillance

Welcome to Smart CCTV Surveillance, a real-time monitoring system for public CCTV cameras. This web application provides an interactive map to view and monitor live streams from various camera locations.

**Official Website:** [https://cctv.carik.id](https://cctv.carik.id)

## Features

- **Interactive Map:** Uses Leaflet.js to display camera locations on an interactive map.
- **Real-time Status:** Shows the real-time status of each CCTV camera (Active/Inactive).
- **Camera List & Filtering:** Easily browse through the list of available cameras and filter them by city.
- **Marker Clustering:** Groups nearby cameras into clusters for a cleaner map view, especially in dense areas.
- **Live Stream Modal:** View live CCTV streams in a clean, responsive modal window.
- **Fullscreen Mode:** Supports fullscreen viewing for an immersive monitoring experience.
- **Responsive Design:** The interface is fully responsive and works seamlessly on both desktop and mobile devices.
- **Statistics:** Displays statistics such as the total number of CCTV cameras and their active/inactive counts.

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Mapping Library:** [Leaflet.js](https://leafletjs.com/)
- **Marker Clustering:** [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- **Backend API:** PHP (for fetching CCTV data)

## Project Structure

```
/live
├── api/                # Backend PHP scripts for data fetching
│   ├── config-example.php
│   └── index.php
├── assets/             # CSS styles and JavaScript files
│   ├── styles/
│   │   └── styles.css
│   └── js/
├── app.js              # Main application JavaScript logic
├── index.html          # Main HTML file
├── README.md           # Project documentation
└── .gitignore          # Git ignore file
```

## Setup and Installation

To run this project locally, you need a local web server that supports PHP (like XAMPP, WAMP, or MAMP).

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Place the project files** in the `htdocs` or `www` directory of your local server.
3.  **Configure the API:**
    - Navigate to the `api/` directory.
    - Rename `config-example.php` to `config.php`.
    - Update `config.php` with your database credentials or API endpoints if necessary.
4.  **Run the application:**
    - Start your local web server.
    - Open your web browser and navigate to `http://localhost/path/to/project/`.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

---

*This project is powered by ErkAI.id.*