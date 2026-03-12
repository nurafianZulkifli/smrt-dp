// Transit Station Display UI - Interactive Script

class TransitDisplay {
    constructor() {
        this.currentStation = 'Bukit Batok';
        this.currentLine = ['CC 4', 'DT 15'];
        this.destination = 'HarbourFront';
        this.doorStatus = true;
        this.currentCategory = 'alert';
        
        // Station data with associated videos and announcements
        this.stations = [
            { name: 'Bukit Batok', cddVideo: 'video/toMSP/bukit-batok_cdd.mp4', cldVideo: 'video/toMSP/bukit-batok_cld.mp4', audio: 'announcements/bukit-batok-ann.wav', loop: true },
            { name: 'Bukit Gombak', cddVideo: 'video/toMSP/bukit-gombak_cdd.mp4', cldVideo: 'video/bukit-gombak_cld.mp4', audio: 'announcements/bukit-gombak-ann.wav', loop: true },
            { name: 'Choa Chu Kang', cddVideo: 'video/toMSP/choa-chu-kang_cdd.mp4', cldVideo: 'video/choa-chu-kang_cld.mp4', audio: 'announcements/choa-chu-kang-ann.wav', loop: true },
            { name: 'Yew Tee', cddVideo: 'video/toMSP/yew-tee_cdd.mp4', cldVideo: 'video/yew-tee_cld.mp4', audio: 'announcements/yew-tee-ann.wav', loop: true }
        ];
        
        // Message data with associated videos and announcements
        this.messages = {
            alert: [
                { id: 1, title: 'Emergency Evacuation', cddVideo: 'video/alert-cdd.mp4', cldVideo: 'video/alert-cld.mp4', audio: 'announcements/alert-evacuation-ann.wav', loop: false },
                { id: 2, title: 'Door Obstruction', cddVideo: '../video/Msg_DoorObstruct_CDD.mp4', cldVideo: '../video/Msg_DoorObstruct_CLD.mp4', audio: 'announcements/door-obstruct-ann.wav', loop: false }
            ],
            safety: [
                { id: 1, title: 'Mind the Gap', cddVideo: 'video/gap-cdd.mp4', cldVideo: 'video/gap-cld.mp4', audio: 'announcements/safety-gap-ann.wav', loop: false },
                { id: 2, title: 'Hold the Handrail', cddVideo: 'video/handrail-cdd.mp4', cldVideo: 'video/handrail-cld.mp4', audio: 'announcements/safety-handrail-ann.wav', loop: false }
            ],
            service: [
                { id: 1, title: 'Maintenance Scheduled', cddVideo: 'video/maint-cdd.mp4', cldVideo: 'video/maint-cld.mp4', audio: 'announcements/service-maintenance-ann.wav', loop: false },
                { id: 2, title: 'System Update', cddVideo: 'video/update-cdd.mp4', cldVideo: 'video/update-cld.mp4', audio: 'announcements/service-update-ann.wav', loop: false }
            ],
            info: [
                { id: 1, title: 'Welcome Message', cddVideo: 'video/welcome-cdd.mp4', cldVideo: 'video/welcome-cld.mp4', audio: 'announcements/info-welcome-ann.wav', loop: false },
                { id: 2, title: 'Station Info', cddVideo: 'video/info-cdd.mp4', cldVideo: 'video/info-cld.mp4', audio: 'announcements/info-station-ann.wav', loop: false }
            ]
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeStation();
    }

    setupEventListeners() {
        // Control buttons
        const controlButtons = document.querySelectorAll('.control-button');
        controlButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleControlClick(e));
        });

        // Navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleNavigation());
        });

        // Modal close buttons
        const modalCloseButtons = document.querySelectorAll('.modal-close');
        modalCloseButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Close modal on background click
        const messagesModal = document.getElementById('messagesModal');
        if (messagesModal) {
            messagesModal.addEventListener('click', (e) => {
                if (e.target === messagesModal) this.closeModal();
            });
        }

        // Close stations modal on background click
        const stationsModal = document.getElementById('stationsModal');
        if (stationsModal) {
            stationsModal.addEventListener('click', (e) => {
                if (e.target === stationsModal) this.closeModal();
            });
        }

        // Category buttons
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchCategory(e.target.getAttribute('data-category')));
        });
    }

    handleControlClick(event) {
        const button = event.currentTarget;
        const action = button.getAttribute('data-action');

        switch(action) {
            case 'doors':
                this.toggleDoors();
                break;
            case 'prev':
                this.showCurrentStation();
                break;
            case 'next':
                this.showNextStation();
                break;
            case 'messages':
                this.showMessages();
                break;
        }
    }

    playAudio(audioPath) {
        const audio = document.getElementById('doorsAudio');
        if (!audio) return;
        
        // Stop any currently playing audio
        audio.pause();
        audio.currentTime = 0;
        
        // Update source
        const source = audio.querySelector('source');
        if (source) {
            source.src = audioPath;
        }
        
        // Load and play
        audio.load();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => console.log('Audio play error:', err));
        }
    }

    toggleDoors() {
        this.doorStatus = !this.doorStatus;
        const videoContainer = document.querySelector('.video-container');
        let video = videoContainer.querySelector('.station-video-temp');
        const videoCld = document.querySelector('.station-video-cld');
        const audio = document.getElementById('doorsAudio');
        
        if (this.doorStatus) {
            // Hide video and show blank image
            if (video) {
                video.style.display = 'none';
                video.pause();
            }
            const blankImg = videoContainer.querySelector('img');
            if (blankImg) blankImg.style.display = 'block';
            if (videoCld) {
                videoCld.pause();
                videoCld.currentTime = 0;
            }
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        } else {
            // Hide blank image and show video
            const blankImg = videoContainer.querySelector('img');
            if (blankImg) blankImg.style.display = 'none';
            if (video) {
                // Reset to doors closing video
                video.querySelector('source').src = 'video/DC-CDD.mp4';
                video.style.display = 'block';
                video.loop = false;
                video.currentTime = 0;
                video.load();
                video.play().catch(err => console.log('Video play error:', err));
            }
            if (videoCld) {
                // Reset to doors closing video
                videoCld.querySelector('source').src = 'video/DC-CLD.mp4';
                videoCld.loop = false;
                videoCld.currentTime = 0;
                videoCld.load();
                videoCld.play().catch(err => console.log('Video play error:', err));
            }
            // Play doors closing announcement
            this.playAudio('announcements/dc-ann.wav');
        }

        this.showToast('Door status changed');
    }

    showCurrentStation() {
        this.currentMessagePrefix = 'Now at:';
        const modal = document.getElementById('stationsModal');
        if (modal) {
            this.displayStations();
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    showNextStation() {
        this.currentMessagePrefix = 'Next:';
        const modal = document.getElementById('stationsModal');
        if (modal) {
            this.displayStations();
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    displayStations() {
        const stationsList = document.getElementById('stationsList');
        stationsList.innerHTML = '';
        
        this.stations.forEach(station => {
            const stationBtn = document.createElement('button');
            stationBtn.className = 'station-item';
            stationBtn.innerHTML = `<span>${station.name}</span>`;
            stationBtn.addEventListener('click', () => {
                const messagePrefix = this.currentMessagePrefix || 'Now at:';
                this.playStation(station, messagePrefix);
            });
            stationsList.appendChild(stationBtn);
        });
    }

    playStation(station, messagePrefix = 'Now at:') {
        this.currentStation = station.name;
        this.closeModal();
        
        const videoContainer = document.querySelector('.video-container');
        let video = videoContainer.querySelector('.station-video-temp');
        const videoCld = document.querySelector('.station-video-cld');
        const audio = document.getElementById('doorsAudio');
        
        // Update video sources and play
        if (video && station.cddVideo) {
            video.querySelector('source').src = station.cddVideo;
            video.style.display = 'block';
            video.loop = station.loop !== undefined ? station.loop : true;
            const blankImg = videoContainer.querySelector('img');
            if (blankImg) blankImg.style.display = 'none';
            video.load();
            video.play().catch(err => console.log('CDD Video play error:', err));
        }
        
        if (videoCld && station.cldVideo) {
            videoCld.querySelector('source').src = station.cldVideo;
            videoCld.loop = station.loop !== undefined ? station.loop : true;
            videoCld.load();
            videoCld.play().catch(err => console.log('CLD Video play error:', err));
        }
        
        // Play announcement audio
        if (station.audio) {
            this.playAudio(station.audio);
        }
        
        // Update station name display
        const stationNameElement = document.querySelector('.station-name');
        if (stationNameElement) {
            stationNameElement.textContent = this.currentStation;
            stationNameElement.style.animation = 'none';
            setTimeout(() => {
                stationNameElement.style.animation = 'fadeInOut 0.5s ease';
            }, 10);
        }
        
        this.showToast(`${messagePrefix} ${station.name}`);
    }

    showMessages() {
        const modal = document.getElementById('messagesModal');
        if (modal) {
            this.displayMessages(this.currentCategory);
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    switchCategory(category) {
        this.currentCategory = category;
        // Update active button
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-category') === category) {
                btn.classList.add('active');
            }
        });
        this.displayMessages(category);
    }

    displayMessages(category) {
        const messagesList = document.getElementById('messagesList');
        const categoryMessages = this.messages[category] || [];
        
        messagesList.innerHTML = '';
        categoryMessages.forEach(msg => {
            const msgBtn = document.createElement('button');
            msgBtn.className = 'message-item';
            msgBtn.innerHTML = `<span>${msg.title}</span>`;
            msgBtn.addEventListener('click', () => this.playMessage(msg));
            messagesList.appendChild(msgBtn);
        });
    }

    playMessage(message) {
        this.closeModal();
        
        const videoContainer = document.querySelector('.video-container');
        let video = videoContainer.querySelector('.station-video-temp');
        const videoCld = document.querySelector('.station-video-cld');
        const audio = document.getElementById('doorsAudio');
        
        // Update video sources and play
        if (video && message.cddVideo) {
            video.querySelector('source').src = message.cddVideo;
            video.style.display = 'block';
            video.loop = message.loop !== undefined ? message.loop : false;
            const blankImg = videoContainer.querySelector('img');
            if (blankImg) blankImg.style.display = 'none';
            video.load();
            video.play().catch(err => console.log('CDD Video play error:', err));
        }
        
        if (videoCld && message.cldVideo) {
            videoCld.querySelector('source').src = message.cldVideo;
            videoCld.loop = message.loop !== undefined ? message.loop : false;
            videoCld.load();
            videoCld.play().catch(err => console.log('CLD Video play error:', err));
        }
        
        // Play announcement audio
        if (message.audio) {
            this.playAudio(message.audio);
        }
        
        this.showToast(`Playing: ${message.title}`);
    }

    closeModal() {
        const messagesModal = document.getElementById('messagesModal');
        const stationsModal = document.getElementById('stationsModal');
        
        if (messagesModal && !messagesModal.classList.contains('hidden')) {
            messagesModal.classList.add('hidden');
        }
        
        if (stationsModal && !stationsModal.classList.contains('hidden')) {
            stationsModal.classList.add('hidden');
        }
        
        document.body.style.overflow = 'auto';
    }

    handleNavigation() {
        this.showToast('Navigation pressed');
    }

    showToast(message) {
        const toast = document.getElementById('statusToast');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }

    initializeStation() {
        console.log(`Transit Display initialized for ${this.currentStation}`);
        console.log(`Lines: ${this.currentLine.join(', ')}`);
        console.log(`Destination: ${this.destination}`);
    }
}

// Initialize the display when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TransitDisplay();
});

// Add fade animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);
