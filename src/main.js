import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="page">

    <section class="hero">
      <div class="overlay"></div>

      <div class="hero-content">
        <p class="eyebrow">WELCOME TO</p>
        <h1>GLAMNIVERSE</h1>
        <p class="subtitle">A cinematic AI-assisted music universe.</p>

        <div class="main-buttons">
          <a href="#music" class="btn primary">🎵 Listen Now</a>
          <a href="#vibes" class="btn">✨ Check the Glamniverse Vibes</a>
          <a href="#neon-city" class="btn">🌆 Enter Neon City Beta</a>
        </div>
      </div>
    </section>

    <section id="music" class="section">
      <h2>Listen to Glamniverse</h2>

      <p class="section-text">
        Stream Glamniverse on your favorite platform.
      </p>

      <div class="platform-grid">
        <a class="platform-card" href="https://open.spotify.com/artist/2jGmlSRyCYy06OOtvn9cEf?si=_1H8oS9fTm6035qMZx2oew" target="_blank">
          🎵 Listen on Spotify
        </a>

        <a class="platform-card" href="https://music.apple.com/ro/artist/glamniverse/6771870759?l=ro" target="_blank">
          🍎 Listen on Apple Music
        </a>

        <a class="platform-card" href="https://youtube.com/@glamniverse?si=hhJgxYC5AsBKEqMR" target="_blank">
          ▶ Watch on YouTube
        </a>
      </div>
    </section>

    <section id="vibes" class="section dark">
      <h2>Check the Glamniverse Vibes</h2>

      <p class="section-text">
        Choose a song and enter its mood.
      </p>

      <div class="song-grid">
        <article class="song-card pink">
          <h3>Neon Therapy</h3>
          <p>Healing through lights, rhythm and escape.</p>
          <button class="play-song-btn" onclick="openSongExperience('neonTherapy')">
            Play song
          </button>
        </article>

        <article class="song-card neon">
          <h3>In His Mind</h3>
          <p>Obsession, fantasy and neon thoughts.</p>
          <button class="play-song-btn" onclick="openSongExperience('inHisMind')">
            Play song
          </button>
        </article>

        <article class="song-card violet">
          <h3>Almost Love</h3>
          <p>A story that almost became forever.</p>
          <button class="play-song-btn" onclick="openSongExperience('almostLove')">
            Play song
          </button>
        </article>

        <article class="song-card orange">
          <h3>Late Night Drives</h3>
          <p>Fast roads, city lights and emotional freedom.</p>
          <button class="play-song-btn" onclick="openSongExperience('lateNightDrives')">
            Play song
          </button>
        </article>
      </div>
    </section>

    <section id="neon-city" class="section neon-city">
      <h2>Neon City Beta</h2>

      <p class="section-text">
        The interactive Glamniverse world is currently under construction.
        360 navigation and VR access are coming later.
      </p>

      <div class="city-box">
        <h3>🌆 Enter the Glamniverse</h3>
        <p>
          Future districts: Neon Therapy, In His Mind, Late Night Drives and Almost Love.
        </p>
        <button onclick="alert('Neon City Beta is coming soon ✨')">
          Preview Coming Soon
        </button>
      </div>
    </section>

    <section class="section socials">
      <h2>Connect with Glamniverse</h2>

      <div class="platform-grid">
        <a class="platform-card" href="https://www.tiktok.com/@glamniverse?_r=1&_t=ZN-970rsKo1U4E" target="_blank">
          🎬 TikTok
        </a>

        <a class="platform-card" href="https://www.instagram.com/glamniverse?igsh=MTRyN2NsNWk5Z2J2Nw%3D%3D&utm_source=qr" target="_blank">
          📸 Instagram
        </a>

        <a class="platform-card" href="https://www.youtube.com/@Glamniverse" target="_blank">
          ▶ YouTube Channel
        </a>
      </div>
    </section>

    <div id="song-modal" class="song-modal hidden">
      <video id="song-video" loop playsinline muted preload="auto"></video>

      <div class="song-modal-overlay"></div>

      <div class="song-modal-content">
        <h2 id="song-title">Neon Therapy</h2>
        <p id="song-description">Healing through neon lights.</p>

        <div class="song-controls">
          <button onclick="toggleSong()">Play / Stop</button>
          <button onclick="closeSongExperience()">Back</button>
        </div>
      </div>

      <audio id="song-audio" loop preload="auto"></audio>
    </div>

  </main>
`

const songs = {
  neonTherapy: {
    title: 'Neon Therapy',
    description: 'Healing through neon lights, futuristic roads and cinematic escape.',
    video: '/neon-therapy.mp4',
    image: '',
    audio: '/neon-therapy.mp3'
  },

  inHisMind: {
    title: 'In His Mind',
    description: 'Obsession, memory and neon thoughts inside a restless mind.',
    video: '',
    image: '/in-his-mind.png',
    audio: '/in-his-mind.mp3'
  },

  almostLove: {
    title: 'Almost Love',
    description: 'A story that almost became forever.',
    video: '',
    image: '/almost-love.png',
    audio: '/almost-love.mp3'
  },

  lateNightDrives: {
    title: 'Late Night Drives',
    description: 'Fast roads, city lights and emotional freedom.',
    video: '',
    image: '/late-night-drives.png',
    audio: '/late-night-drives.mp3'
  }
}

window.openSongExperience = function (songId) {
  const song = songs[songId]

  const modal = document.querySelector('#song-modal')
  const video = document.querySelector('#song-video')
  const audio = document.querySelector('#song-audio')
  const title = document.querySelector('#song-title')
  const description = document.querySelector('#song-description')

  title.textContent = song.title
  description.textContent = song.description

  audio.pause()
  audio.currentTime = 0
  audio.src = song.audio
  audio.load()

  if (song.video) {
    video.style.display = 'block'
    video.src = song.video
    video.poster = ''
    video.load()
    video.play()
  } else {
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.poster = song.image
    video.style.display = 'block'
  }

  modal.classList.remove('hidden')
  audio.play()
}

window.toggleSong = function () {
  const audio = document.querySelector('#song-audio')

  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

window.closeSongExperience = function () {
  const modal = document.querySelector('#song-modal')
  const video = document.querySelector('#song-video')
  const audio = document.querySelector('#song-audio')

  video.pause()
  audio.pause()

  video.currentTime = 0
  audio.currentTime = 0

  modal.classList.add('hidden')
}