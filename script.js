// --- 1. MOBILE MENU TOGGLE ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileDrawer = document.getElementById('mobile-drawer');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

mobileMenuBtn.addEventListener('click', () => {
  mobileDrawer.classList.toggle('hidden');
});

// Close mobile drawer when clicking navigation links
mobileNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileDrawer.classList.add('hidden');
  });
});

// --- 2. DYNAMIC INTERACTIVE AUDIO PLAYER ---
// Songs and associated metadata (using the generated album artworks)
const tracksList = [
  { name: "Duality", artist: "SLIPKNOT", duration: "4:12", art: "assets/album_vol3.png", file: "https://archive.org/download/soundcloud-203876288/203876288.mp3" },
  { name: "Psychosocial", artist: "SLIPKNOT", duration: "4:43", art: "assets/album_ahig.png", file: "https://archive.org/download/soundcloud-203876387/203876387.mp3" },
  { name: "Deutschland", artist: "RAMMSTEIN", duration: "5:22", art: "assets/album_rammstein.png", file: "https://archive.org/download/rammstein-deutschland-official-v-getmp-3.pro/Rammstein_-_Deutschland_Official_V_%28getmp3.pro%29.mp3" },
  { name: "Chop Suey!", artist: "SYSTEM OF A DOWN", duration: "3:30", art: "assets/album_toxicity.png", file: "https://archive.org/download/Random_Playlist/System%20of%20a%20Down%20-%20Chop%20Suey.mp3" }
];

let currentTrackIndex = 0;
let isPlaying = false;
let visualizerTimer = null;

// HTML5 Audio instance
const audio = new Audio();
audio.volume = 0.8; // Default 80% volume

const playBtn = document.getElementById('player-play-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('player-prev-btn');
const nextBtn = document.getElementById('player-next-btn');

const playerArt = document.getElementById('player-album-art');
const playerTitle = document.getElementById('player-track-title');
const playerArtist = document.getElementById('player-track-artist');
const currentTimeEl = document.getElementById('player-time-current');
const totalTimeEl = document.getElementById('player-time-total');
const seekbar = document.getElementById('player-seekbar');
const volumeSlider = document.getElementById('player-volume');
const selectTrackBtns = document.querySelectorAll('.track-select-btn');
const visualizerBars = document.querySelectorAll('.v-bar');
const playerStatus = document.getElementById('player-status');

// Utility formatting for display times
function formatTime(sec) {
  if (isNaN(sec) || !isFinite(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Audio State Event Listeners for Industrial LED Status Panel
audio.addEventListener('loadstart', () => {
  playerStatus.textContent = 'CONNECTING...';
  playerStatus.classList.add('animate-pulse');
});

audio.addEventListener('waiting', () => {
  playerStatus.textContent = 'BUFFERING...';
  playerStatus.classList.add('animate-pulse');
});

audio.addEventListener('playing', () => {
  playerStatus.textContent = 'BROADCASTING';
  playerStatus.classList.remove('animate-pulse');
});

audio.addEventListener('pause', () => {
  playerStatus.textContent = 'PAUSED';
  playerStatus.classList.remove('animate-pulse');
});

audio.addEventListener('error', (e) => {
  console.error("Audio error:", e);
  playerStatus.textContent = 'SIGNAL ERROR';
  playerStatus.classList.add('animate-pulse');
});

// Update Player UI with Active Track Meta
function updatePlayerTrack(autoPlay = false) {
  const track = tracksList[currentTrackIndex];
  playerArt.src = track.art;
  playerTitle.textContent = track.name;
  playerArtist.textContent = `${track.artist} // METAL SELECTION`;
  totalTimeEl.textContent = track.duration;
  currentTimeEl.textContent = formatTime(0);
  seekbar.value = 0;
  
  // Update selection styling on tracks list
  selectTrackBtns.forEach((btn, index) => {
    if (index === currentTrackIndex) {
      btn.classList.add('text-red-600', 'font-bold');
      btn.classList.remove('text-zinc-400');
      btn.parentElement.classList.add('border-red-600');
    } else {
      btn.classList.remove('text-red-600', 'font-bold');
      btn.classList.add('text-zinc-400');
      btn.parentElement.classList.remove('border-red-600');
    }
  });

  // Update source and play if autoplay triggered by action
  if (autoPlay) {
    audio.src = track.file;
    audio.load();
    if (isPlaying) {
      audio.play().catch(e => {
        console.log("Autoplay block / interaction error", e);
        isPlaying = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        playerStatus.textContent = 'INTERACT NEEDED';
      });
    }
  }
}

// Toggle Play/Pause Logic
function togglePlayback() {
  const track = tracksList[currentTrackIndex];
  
  // If audio element has no source set yet, set it on user gesture
  if (!audio.src || audio.src === "") {
    audio.src = track.file;
    audio.load();
  }
  
  if (isPlaying) {
    // Pause track
    isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    audio.pause();
    clearInterval(visualizerTimer);
    resetVisualizer();
  } else {
    // Play track
    isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    
    audio.play().catch(e => {
      console.error("Playback failed", e);
      isPlaying = false;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
      playerStatus.textContent = 'INTERACT NEEDED';
    });

    // Start simulated audio visualizer bars movement
    clearInterval(visualizerTimer);
    visualizerTimer = setInterval(animateVisualizer, 100);
  }
}

// Update progress seekbar as audio plays
audio.addEventListener('timeupdate', () => {
  if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
    currentTimeEl.textContent = formatTime(audio.currentTime);
    seekbar.value = (audio.currentTime / audio.duration) * 100;
  }
});

// Update total duration once metadata loads
audio.addEventListener('loadedmetadata', () => {
  totalTimeEl.textContent = formatTime(audio.duration);
});

// Auto-advance to next song on finish
audio.addEventListener('ended', () => {
  changeTrack(1);
});

// Slide/Scrub Player Seekbar
seekbar.addEventListener('input', () => {
  if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = (seekbar.value / 100) * audio.duration;
  }
});

// Update Volume
volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value / 100;
});

// Animate Visualizer Bars with random metal fluctuations
function animateVisualizer() {
  visualizerBars.forEach(bar => {
    // High fluctuations for heavy metal profile (heavy bass/drums)
    const randomHeight = Math.floor(Math.random() * 85) + 15;
    bar.style.height = `${randomHeight}%`;
  });
}

// Reset Visualizer Bars to flat baseline
function resetVisualizer() {
  visualizerBars.forEach((bar, index) => {
    // Flat baseline
    const heights = [10, 25, 45, 60, 80, 90, 70, 50, 35, 55, 75, 85, 95, 65, 40, 15];
    bar.style.height = `${heights[index]}%`;
  });
}

// Shift Tracks Up or Down
function changeTrack(direction) {
  clearInterval(visualizerTimer);
  
  currentTrackIndex += direction;
  if (currentTrackIndex >= tracksList.length) currentTrackIndex = 0;
  if (currentTrackIndex < 0) currentTrackIndex = tracksList.length - 1;

  // Keep playing state if it was playing
  const wasPlaying = isPlaying;
  
  // Force change source and load
  updatePlayerTrack(true);
  
  if (wasPlaying) {
    isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    visualizerTimer = setInterval(animateVisualizer, 100);
  } else {
    isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    resetVisualizer();
  }
}

// Listen to explicit index selection
function playTargetTrack(index) {
  if (index >= 0 && index < tracksList.length) {
    clearInterval(visualizerTimer);
    currentTrackIndex = index;
    
    // Auto-play the track
    isPlaying = true;
    updatePlayerTrack(true);
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    visualizerTimer = setInterval(animateVisualizer, 100);
    
    // Smooth scroll to player widget
    document.getElementById('player-section').scrollIntoView({ behavior: 'smooth' });
  }
}

// Button Events
playBtn.addEventListener('click', togglePlayback);
prevBtn.addEventListener('click', () => changeTrack(-1));
nextBtn.addEventListener('click', () => changeTrack(1));

// Handle track click selection directly
selectTrackBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const index = parseInt(btn.getAttribute('data-index'));
    playTargetTrack(index);
  });
});

// Initialize player state
updatePlayerTrack();


// --- 3. LIVE PHOTO GALLERY LIGHTBOX ---
const galleryPhotos = [
  { src: "assets/album_vol3.png", caption: "SLIPKNOT - VOL. 3: (THE SUBLIMINAL VERSES) ALBUM COVER // 2004" },
  { src: "assets/album_ahig.png", caption: "SLIPKNOT - ALL HOPE IS GONE ALBUM COVER // 2008" },
  { src: "assets/album_rammstein.png", caption: "RAMMSTEIN - UNTITLED ALBUM COVER // 2019" },
  { src: "assets/album_toxicity.png", caption: "SYSTEM OF A DOWN - TOXICITY ALBUM COVER // 2001" }
];

let activeLightboxIndex = 0;
const lightboxModal = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');

function openLightbox(index) {
  activeLightboxIndex = index;
  const photo = galleryPhotos[activeLightboxIndex];
  lightboxImg.src = photo.src;
  lightboxCaption.textContent = photo.caption;
  lightboxCounter.textContent = `${activeLightboxIndex + 1} / ${galleryPhotos.length}`;
  
  lightboxModal.classList.remove('hidden');
  lightboxModal.classList.add('flex');
  
  // Stop body scrolling while lightbox is active
  document.body.classList.add('overflow-hidden');
}

function closeLightbox() {
  lightboxModal.classList.add('hidden');
  lightboxModal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
}

function changeLightboxImage(direction) {
  activeLightboxIndex += direction;
  if (activeLightboxIndex >= galleryPhotos.length) activeLightboxIndex = 0;
  if (activeLightboxIndex < 0) activeLightboxIndex = galleryPhotos.length - 1;
  
  const photo = galleryPhotos[activeLightboxIndex];
  lightboxImg.src = photo.src;
  lightboxCaption.textContent = photo.caption;
  lightboxCounter.textContent = `${activeLightboxIndex + 1} / ${galleryPhotos.length}`;
}

// Keyboard controls for Lightbox (Esc, Left Arrow, Right Arrow)
window.addEventListener('keydown', (e) => {
  if (!lightboxModal.classList.contains('hidden')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') changeLightboxImage(-1);
    if (e.key === 'ArrowRight') changeLightboxImage(1);
  }
});


// --- 5. NEWSLETTER REGISTER SIMULATION ---
const newsletterForm = document.getElementById('newsletter-form');
const signupSuccess = document.getElementById('signup-success');
const registeredEmailSpan = document.getElementById('registered-email');

function handleSignup(event) {
  event.preventDefault();
  const emailInput = document.getElementById('email');
  const locationSelect = document.getElementById('location');

  registeredEmailSpan.textContent = emailInput.value.toUpperCase();
  
  // Hide form and show success state
  newsletterForm.classList.add('hidden');
  signupSuccess.classList.remove('hidden');
}

function resetSignupForm() {
  newsletterForm.reset();
  newsletterForm.classList.remove('hidden');
  signupSuccess.classList.add('hidden');
}
