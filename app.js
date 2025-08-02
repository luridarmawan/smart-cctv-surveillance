// Jakarta CCTV Map Application
class CCTVMap {
    constructor() {
        this.map = null;
        this.cctvData = [];
        this.markers = [];
        this.markerClusterGroup = null;
        this.apiUrl = 'https://cctv.carik.id/api/';
        
        // Map Center coordinates
        // this.mapCenter = [-6.2088, 106.8456]; // Jakarta
        this.mapCenter = [-7.4713042322058705, 110.92159402348967]; // Jawa Tengah
        this.mapCenter = [-1.4134430971549556, 117.76734201392946]; // Indonesia
        this.mapCenterZoom = 5;

        this.init();
    }
    
    async init() {
        try {
            // Initialize map
            this.initMap();

            // Load CCTV data
            await this.loadCCTVData();

            // Display markers
            this.displayMarkers();

            // Populate sidebar
            this.populateSidebar();

            // Update stats
            this.updateStats();

            // Hide loading
            this.hideLoading();

            // Setup city filter
            this.setupCityFilter();

        } catch (error) {
            console.error('Error initializing CCTV Map:', error);
            this.showError('Failed to load CCTV data. Please try again later.');
        }
    }

    initMap() {
        // Check if map is already initialized
        if (this.map) {
            console.log('Map already initialized, skipping...');
            return;
        }

        // Initialize Leaflet map centered on Jakarta
        this.map = L.map('map').setView(this.mapCenter, this.mapCenterZoom);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Initialize marker cluster group with custom options
        this.markerClusterGroup = L.markerClusterGroup({
            // Cluster options
            maxClusterRadius: 80,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            disableClusteringAtZoom: 16,

            // Custom icon creation function
            iconCreateFunction: function(cluster) {
                const childCount = cluster.getChildCount();
                let className = 'marker-cluster marker-cluster-';

                if (childCount < 10) {
                    className += 'small';
                } else if (childCount < 100) {
                    className += 'medium';
                } else {
                    className += 'large';
                }

                return new L.DivIcon({
                    html: '<div><span>' + childCount + '</span></div>',
                    className: className,
                    iconSize: new L.Point(40, 40)
                });
            }
        });

        // Add cluster group to map
        this.map.addLayer(this.markerClusterGroup);

        // Add custom control for map info
        const info = L.control({position: 'bottomleft'});
        info.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'info');
            div.innerHTML = '<h4>CCTV Monitoring System</h4>Click on markers to view camera details<br><small>Zoom in to see individual cameras</small>';
            div.style.background = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            div.style.fontSize = '12px';
            return div;
        };
        info.addTo(this.map);
    }
    
    async loadCCTVData() {
        try {
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.data && Array.isArray(data.data)) {
                this.cctvData = data.data;
                console.log(`Loaded ${this.cctvData.length} CCTV cameras`);
            } else {
                // Fallback to demo data if API fails
                console.warn('API data format unexpected, using demo data');
                this.cctvData = this.getDemoData();
            }
            
        } catch (error) {
            console.error('Error fetching CCTV data:', error);
            // Use demo data as fallback
            this.cctvData = this.getDemoData();
        }
    }
    
    getDemoData() {
        // Demo data for testing when API is not available
        return [
            {
                name: "[demo] Bundaran HI - North",
                type: "http",
                location: {
                    latitude: -6.1944,
                    longitude: 106.8229,
                    address: "Bundaran Hotel Indonesia, Jakarta Pusat"
                },
                url: "http://example.com/stream1",
                username: "",
                password: "",
                status: 0
            },
            {
                name: "[demo] Monas Area - East",
                type: "video",
                location: {
                    latitude: -6.1754,
                    longitude: 106.8272,
                    address: "Monumen Nasional, Jakarta Pusat"
                },
                url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
                username: "",
                password: "",
                status: 0
            },
            {
                name: "[demo] Senayan - Traffic Light",
                type: "rtmp",
                location: {
                    latitude: -6.2297,
                    longitude: 106.8075,
                    address: "Jl. Sudirman, Senayan, Jakarta Selatan"
                },
                url: "rtmp://example.com/stream3",
                username: "",
                password: "",
                status: 1
            },
            {
                name: "[demo] Thamrin - Central",
                type: "video",
                location: {
                    latitude: -6.1900,
                    longitude: 106.8200,
                    address: "Jl. MH Thamrin, Jakarta Pusat"
                },
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                username: "",
                password: "",
                status: 0
            },
            {
                name: "Kuningan - Junction",
                type: "rtsp",
                location: {
                    latitude: -6.2200,
                    longitude: 106.8307,
                    address: "Kuningan, Jakarta Selatan"
                },
                url: "rtsp://example.com/stream5",
                username: "user",
                password: "pass",
                status: 1
            }
        ];
    }
    
    displayMarkers() {
        // Clear existing markers from cluster group
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }
        this.markers = [];
        
        // Add markers for each CCTV
        this.cctvData.forEach((cctv, index) => {
            const lat = parseFloat(cctv.location.latitude);
            const lng = parseFloat(cctv.location.longitude);
            
            // Skip if coordinates are invalid
            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
                console.warn(`Invalid coordinates for CCTV: ${cctv.name}`);
                return;
            }

            // Create custom camera icon based on status
            const iconColor = cctv.status === 'active' ? '#28a745' : '#dc3545';
            // console.log(cctv.name, cctv.status, iconColor);
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${iconColor}; width: 30px; height: 25px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">📹</div>`,
                iconSize: [30, 25],
                iconAnchor: [15, 12]
            });
            
            // Create marker
            const marker = L.marker([lat, lng], { icon: icon })
                .bindPopup(this.createPopupContent(cctv, index));
            
            // Add marker to cluster group instead of directly to map
            this.markerClusterGroup.addLayer(marker);
            this.markers.push(marker);
        });
    }
    
    populateSidebar() {
        const cameraList = document.getElementById('camera-list');
        cameraList.innerHTML = '';
        
        this.cctvData.forEach((cctv, index) => {
            const lat = parseFloat(cctv.location.latitude);
            const lng = parseFloat(cctv.location.longitude);
            
            // Skip if coordinates are invalid
            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
                return;
            }
            
            const listItem = document.createElement('li');
            listItem.className = 'camera-item';
            listItem.setAttribute('data-index', index);
            
            const statusClass = cctv.status === 'active' ? 'active' : 'inactive';
            const statusText = cctv.status === 'active' ? 'Active' : 'Inactive';
            const cameraIcon = cctv.status === 'active' ? '📹' : '📹';
            
            listItem.innerHTML = `
                <div class="camera-icon">${cameraIcon}</div>
                <div class="camera-details">
                    <h4>${cctv.name}</h4>
                    <p>${cctv.location.address}</p>
                </div>
                <div class="camera-status ${statusClass}">${statusText}</div>
            `;
            
            // Add click event to focus on camera
            listItem.addEventListener('click', () => {
                this.focusOnCamera(index);
                this.highlightSidebarItem(index);
            });
            
            cameraList.appendChild(listItem);
        });
    }

    setupCityFilter() {
        const cityFilterInput = document.getElementById('city-filter');
        if (!cityFilterInput) return;

        // Add event listener for real-time filtering
        cityFilterInput.addEventListener('input', (e) => {
            const filterValue = e.target.value.toLowerCase().trim();
            this.filterCamerasByCity(filterValue);
        });

        // Add clear filter on ESC key
        cityFilterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                this.filterCamerasByCity('');
            }
        });
    }

    filterCamerasByCity(filterValue) {
        const cameraItems = document.querySelectorAll('.camera-item');
        let visibleCount = 0;

        cameraItems.forEach((item, index) => {
            const cctv = this.cctvData[index];
            if (!cctv) return;

            const cityName = (cctv.location.city || cctv.location.address || '').toLowerCase();
            const cameraName = cctv.name.toLowerCase();

            // Check if filter matches city name or camera name
            const matches = filterValue === '' ||
                           cityName.includes(filterValue) ||
                           cameraName.includes(filterValue);

            if (matches) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Update the locations label to show filtered count
        this.updateLocationLabel(visibleCount, filterValue);

        // Also filter map markers
        this.filterMapMarkers(filterValue);
    }

    updateLocationLabel(visibleCount, filterValue) {
        const locationsLabel = document.querySelector('.locations-label');
        if (!locationsLabel) return;

        const totalCount = this.cctvData.length;

        if (filterValue === '') {
            locationsLabel.textContent = `📹 Locations:`;
        } else {
            locationsLabel.textContent = `📹 Locations: (${visibleCount}/${totalCount})`;
        }
    }

    filterMapMarkers(filterValue) {
        // Clear existing markers from cluster group
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }

        // Add filtered markers
        this.cctvData.forEach((cctv, index) => {
            const lat = parseFloat(cctv.location.latitude);
            const lng = parseFloat(cctv.location.longitude);

            // Skip if coordinates are invalid
            if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
                return;
            }

            const cityName = (cctv.location.city || cctv.location.address || '').toLowerCase();
            const cameraName = cctv.name.toLowerCase();

            // Check if filter matches
            const matches = filterValue === '' ||
                           cityName.includes(filterValue) ||
                           cameraName.includes(filterValue);

            if (matches) {
                // Create custom camera icon based on status
                const iconColor = cctv.status === 'active' ? '#28a745' : '#dc3545';
                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color: ${iconColor}; width: 30px; height: 25px; border-radius: 4px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white;">📹</div>`,
                    iconSize: [30, 25],
                    iconAnchor: [15, 12]
                });

                // Create marker
                const marker = L.marker([lat, lng], { icon: icon })
                    .bindPopup(this.createPopupContent(cctv, index));

                // Add marker to cluster group
                this.markerClusterGroup.addLayer(marker);
            }
        });
    }

    focusOnCamera(index) {
        const cctv = this.cctvData[index];
        const lat = parseFloat(cctv.location.latitude);
        const lng = parseFloat(cctv.location.longitude);

        if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
            // Focus map on the selected camera with higher zoom to show individual marker
            this.map.setView([lat, lng], 17, {
                animate: true,
                duration: 1
            });

            // Find the correct marker in the cluster group
            const validMarkerIndex = this.getValidMarkerIndex(index);
            const marker = this.markers[validMarkerIndex];

            if (marker) {
                // Wait for zoom animation to complete, then open popup
                setTimeout(() => {
                    // Ensure the marker is visible (not clustered) before opening popup
                    if (this.markerClusterGroup.hasLayer(marker)) {
                        marker.openPopup();
                    }
                }, 800);
            }
        }
    }

    getValidMarkerIndex(originalIndex) {
        // Get the index in the markers array for cameras with valid coordinates
        let validIndex = 0;
        for (let i = 0; i < originalIndex; i++) {
            const cctv = this.cctvData[i];
            const lat = parseFloat(cctv.location.latitude);
            const lng = parseFloat(cctv.location.longitude);

            if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
                validIndex++;
            }
        }
        return validIndex;
    }
    
    highlightSidebarItem(index) {
        // Remove active class from all items
        const allItems = document.querySelectorAll('.camera-item');
        allItems.forEach(item => item.classList.remove('active'));

        // Add active class to selected item
        const selectedItem = document.querySelector(`[data-index="${index}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }
    
    createPopupContent(cctv, index) {
        const statusClass = cctv.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = cctv.status === 'active' ? 'Active' : 'Inactive';
        const buttonDisabled = cctv.status !== 'active' ? 'disabled' : '';

        return `
            <div class="cctv-popup">
                <h3>${cctv.name} <button>sd</button></h3>
                <div class="cctv-info">
                    <p><strong>Address:</strong> ${cctv.location.address}</p>
                    <p><strong>Type:</strong> ${cctv.type.toUpperCase()}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
                    <p><strong>Coordinates:</strong> ${cctv.location.latitude}, ${cctv.location.longitude}</p>
                    <p><strong>Notes:</strong> ${cctv.note}</p>
                </div>
                <button class="stream-button" ${buttonDisabled} onclick="cctvMap.openStream(${index})">
                    ${cctv.status === 'active' ? '📹 View Live Stream' : '❌ Camera Offline'}
                </button>
            </div>
        `;
    }
    
    openStream(index) {
        const cctv = this.cctvData[index];

        if (cctv.status !== 'active') {
            alert('This camera is currently offline.');
            return;
        }

        // Show modal and populate with stream data
        this.showStreamModal(cctv);
        
        // Handle different stream types
        switch (cctv.type.toLowerCase()) {
            case 'http':
                this.loadHttpStream(cctv);
                break;
            case 'video':
                this.loadVideoStream(cctv);
                break;
            case 'rtsp':
                this.loadRtspStream(cctv);
                break;
            case 'rtmp':
                this.loadRtmpStream(cctv);
                break;
            default:
                this.loadCustomStream(cctv);
        }
    }
    
    showStreamModal(cctv) {
        const modal = document.getElementById('streamModal');
        const modalTitle = document.getElementById('modalTitle');
        const streamLocation = document.getElementById('streamLocation');
        const streamType = document.getElementById('streamType');
        const streamContainer = document.getElementById('streamContainer');
        const streamError = document.getElementById('streamError');
        const videoControls = document.getElementById('videoControls');
        const streamNote= document.getElementById('stream-note');

        // Set modal content
        modalTitle.textContent = cctv.name;
        streamLocation.textContent = cctv.location.address;
        streamType.textContent = cctv.type.toUpperCase();
        streamNote.textContent = cctv.note;

        // Reset container
        streamContainer.innerHTML = '<div class="stream-loading">Loading stream...</div>';
        streamError.style.display = 'none';
        videoControls.classList.remove('show');

        // Show modal
        modal.classList.add('show');

        // Add event listeners for modal controls
        this.setupModalControls();
    }
    
    setupModalControls() {
        const modal = document.getElementById('streamModal');
        const closeBtn = document.getElementById('closeModalBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const modalContent = document.getElementById('modalContent');

        // Close modal event
        closeBtn.onclick = () => {
            this.closeStreamModal();
        };

        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeStreamModal();
            }
        };

        // Fullscreen toggle event
        fullscreenBtn.onclick = () => {
            this.toggleFullscreen();
        };

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                this.closeStreamModal();
            }
        });
    }

    closeStreamModal() {
        const modal = document.getElementById('streamModal');
        const streamContainer = document.getElementById('streamContainer');
        const modalContent = document.getElementById('modalContent');

        // Stop any playing video
        const video = streamContainer.querySelector('video');
        if (video) {
            video.pause();
            video.src = '';
        }

        // Remove fullscreen class
        modalContent.classList.remove('fullscreen');

        // Hide modal
        modal.classList.remove('show');

        // Clear container
        streamContainer.innerHTML = '';
    }
    
    toggleFullscreen() {
        const modalContent = document.getElementById('modalContent');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        if (modalContent.classList.contains('fullscreen')) {
            modalContent.classList.remove('fullscreen');
            fullscreenBtn.innerHTML = '🔳 Fullscreen';
        } else {
            modalContent.classList.add('fullscreen');
            fullscreenBtn.innerHTML = '🔲 Exit Fullscreen';
        }
    }
    
    loadHttpStream(cctv) {
        const streamContainer = document.getElementById('streamContainer');
        const streamError = document.getElementById('streamError');

        const iframe = document.createElement('iframe');
        iframe.src = cctv.url;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        iframe.onload = () => {
            streamError.style.display = 'none';
        };

        iframe.onerror = () => {
            streamError.style.display = 'block';
        };

        streamContainer.innerHTML = '';
        streamContainer.appendChild(iframe);
    }
    
    loadVideoStream(cctv) {
        const streamContainer = document.getElementById('streamContainer');
        const streamError = document.getElementById('streamError');
        const videoControls = document.getElementById('videoControls');

        const video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.id = `video_${Date.now()}`;

        // Add multiple source formats
        const sources = [
            { src: cctv.url, type: 'video/mp4' },
            { src: cctv.url, type: 'video/webm' },
            { src: cctv.url, type: 'video/ogg' }
        ];
        
        sources.forEach(source => {
            const sourceElement = document.createElement('source');
            sourceElement.src = source.src;
            sourceElement.type = source.type;
            video.appendChild(sourceElement);
        });

        // Add fallback text
        video.innerHTML += 'Your browser does not support the video tag.';

        // Event listeners
        video.addEventListener('error', () => {
            streamError.style.display = 'block';
        });

        video.addEventListener('loadstart', () => {
            console.log('Video loading started');
            streamError.style.display = 'none';
        });

        video.addEventListener('canplay', () => {
            console.log('Video can start playing');
            streamError.style.display = 'none';
            videoControls.classList.add('show');
        });

        streamContainer.innerHTML = '';
        streamContainer.appendChild(video);
        
        // Store current video reference for controls
        this.currentVideo = video;
    }

    loadRtspStream(cctv) {
        const streamContainer = document.getElementById('streamContainer');
        const streamError = document.getElementById('streamError');

        streamContainer.innerHTML = `
            <div style="color: white; text-align: center; padding: 40px;">
                <h3>RTSP Stream</h3>
                <p>RTSP URL: ${cctv.url}</p>
                <p>RTSP streams require a compatible media player like VLC.</p>
                <button class="video-control-btn" onclick="cctvMap.copyToClipboard('${cctv.url}')">
                    📋 Copy URL to Clipboard
                </button>
            </div>
        `;

        streamError.style.display = 'none';
    }

    loadRtmpStream(cctv) {
        const streamContainer = document.getElementById('streamContainer');
        const streamError = document.getElementById('streamError');

        streamContainer.innerHTML = `
            <div style="color: white; text-align: center; padding: 40px;">
                <h3>RTMP Stream</h3>
                <p>RTMP URL: ${cctv.url}</p>
                <p>RTMP streams require a compatible media player.</p>
                <button class="video-control-btn" onclick="cctvMap.copyToClipboard('${cctv.url}')">
                    📋 Copy URL to Clipboard
                </button>
            </div>
        `;

        streamError.style.display = 'none';
    }

    loadCustomStream(cctv) {
        const streamContainer = document.getElementById('streamContainer');
        const streamError = document.getElementById('streamError');

        const iframe = document.createElement('iframe');
        iframe.src = cctv.url;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        iframe.onload = () => {
            streamError.style.display = 'none';
        };

        iframe.onerror = () => {
            streamError.style.display = 'block';
        };

        streamContainer.innerHTML = '';
        streamContainer.appendChild(iframe);
    }

    controlVideo(action) {
        if (!this.currentVideo) return;

        switch (action) {
            case 'play':
                this.currentVideo.play();
                break;
            case 'pause':
                this.currentVideo.pause();
                break;
            case 'reload':
                this.currentVideo.load();
                break;
        }
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('URL copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                alert('Failed to copy URL to clipboard.');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                alert('URL copied to clipboard!');
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                alert('Failed to copy URL to clipboard.');
            }
            document.body.removeChild(textArea);
        }
    }

    updateStats() {
        const total = this.cctvData.length;
        const active = this.cctvData.filter(cctv => cctv.status === 'active').length;
        const inactive = total - active;
        
        document.getElementById('total-cctv').textContent = total;
        document.getElementById('active-cctv').textContent = active;
        document.getElementById('inactive-cctv').textContent = inactive;
        document.getElementById('stats').style.display = 'block';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="color: #dc3545; text-align: center;">
                    <strong>Error</strong><br>
                    ${message}
                </div>
            `;
        }
    }
    // Method to refresh data without reinitializing the map
    async refreshDataOnly() {
        try {
            // Show loading
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'flex';
                loading.innerHTML = '<div class="spinner"></div><span>Refreshing CCTV data...</span>';
            }

            // Load CCTV data
            await this.loadCCTVData();

            // Display markers
            this.displayMarkers();

            // Populate sidebar
            this.populateSidebar();

            // Update stats
            this.updateStats();

            // Hide loading
            this.hideLoading();

            console.log('Data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing CCTV data:', error);
            this.showError('Failed to refresh CCTV data. Please try again later.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.cctvMap = new CCTVMap();
});

// Add some utility functions
function refreshData() {
    if (window.cctvMap) {
        // Use the new refresh method instead of full init
        window.cctvMap.refreshDataOnly();
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Press 'R' to refresh data
    if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            refreshData();
        }
    }
});