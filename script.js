/* ===== Wedding Invitation - Main Script ===== */

(function () {
    'use strict';

    // ===== CONFIG =====
    const WEDDING_DATE = new Date('2026-06-05T09:00:00+07:00');

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // ===== NAVIGATION SHOW ON SCROLL =====
    const nav = document.getElementById('nav');
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        nav.classList.toggle('visible', y > window.innerHeight * 0.5);
        lastScroll = y;
    });

    // ===== INTERSECTION OBSERVER - REVEAL ON SCROLL =====
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // ===== COUNTDOWN TIMER =====
    function updateCountdown() {
        const now = new Date();
        const diff = WEDDING_DATE - now;
        if (diff <= 0) {
            document.getElementById('cdDays').textContent = '0';
            document.getElementById('cdHours').textContent = '00';
            document.getElementById('cdMins').textContent = '00';
            document.getElementById('cdSecs').textContent = '00';
            return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('cdDays').textContent = String(d);
        document.getElementById('cdHours').textContent = String(h).padStart(2, '0');
        document.getElementById('cdMins').textContent = String(m).padStart(2, '0');
        document.getElementById('cdSecs').textContent = String(s).padStart(2, '0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ===== LIGHTBOX =====
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const galleryItems = document.querySelectorAll('.gallery__item');
    let currentImg = 0;

    galleryItems.forEach((item, i) => {
        item.addEventListener('click', () => {
            currentImg = i;
            lightboxImg.src = item.dataset.src;
            lightbox.classList.add('active');
        });
    });
    document.getElementById('lightboxClose').addEventListener('click', () => lightbox.classList.remove('active'));
    document.getElementById('lightboxPrev').addEventListener('click', () => {
        currentImg = (currentImg - 1 + galleryItems.length) % galleryItems.length;
        lightboxImg.src = galleryItems[currentImg].dataset.src;
    });
    document.getElementById('lightboxNext').addEventListener('click', () => {
        currentImg = (currentImg + 1) % galleryItems.length;
        lightboxImg.src = galleryItems[currentImg].dataset.src;
    });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('active'); });
    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') lightbox.classList.remove('active');
        if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
        if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
    });

    // ===== GOOGLE SHEETS CONFIG =====
    // Hướng dẫn: Tạo Google Apps Script Web App để nhận dữ liệu
    // 1. Mở Google Sheets → Extensions → Apps Script
    // 2. Paste đoạn code bên dưới vào Apps Script, Deploy as Web App
    // 3. Thay URL bên dưới bằng URL Web App của bạn
    /*
    // === Google Apps Script Code (paste vào Apps Script) ===
    function doPost(e) {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data;
      try {
        data = JSON.parse(e.postData.contents);
      } catch(err) {
        data = e.parameter;
      }
      sheet.appendRow([
        new Date(),
        data.type || '',
        data.name || '',
        data.attend || '',
        data.side || '',
        data.guests || '',
        data.message || ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({status:'ok'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    function doGet(e) {
      return doPost(e);
    }
    */
    const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxrSJyldPqtIqNWBIMHqBEnXdXIwqdg1kgB9KZ_Rq62QpLRfOaTDQFtmc5sGv0Iznhl/exec';

    function sendToSheet(data) {
        if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            console.log('[Sheet] Chưa cấu hình URL. Data:', data);
            return;
        }
        fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(data)
        }).catch(err => console.warn('Sheet error:', err));
    }

    // ===== RSVP FORM =====
    document.getElementById('rsvpForm').addEventListener('submit', e => {
        e.preventDefault();
        const form = e.target;
        const attend = form.querySelector('input[name="rsvpAttend"]:checked');
        const side = form.querySelector('input[name="rsvpSide"]:checked');
        sendToSheet({
            type: 'rsvp',
            name: document.getElementById('rsvpName').value.trim(),
            attend: attend ? attend.value : '',
            side: side ? side.value : '',
            guests: document.getElementById('rsvpGuests').value,
            message: document.getElementById('rsvpMessage').value.trim()
        });
        document.getElementById('rsvpForm').style.display = 'none';
        document.getElementById('rsvpSuccess').style.display = 'block';
    });

    // ===== GUESTBOOK =====
    const guestbookList = document.getElementById('guestbookList');
    function renderWishes() {
        const wishes = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
        guestbookList.innerHTML = wishes.map(w => `
            <div class="guestbook__wish">
                <p class="guestbook__wish-name">${escapeHtml(w.name)}</p>
                <p class="guestbook__wish-msg">${escapeHtml(w.msg)}</p>
                <p class="guestbook__wish-time">${w.time}</p>
            </div>
        `).join('');
    }
    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
    // Xoá hết lời chúc cũ (bỏ dòng này sau khi đã xoá xong)
    localStorage.removeItem('wedding_wishes');
    renderWishes();

    document.getElementById('guestbookForm').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('wishName').value.trim();
        const msg = document.getElementById('wishMessage').value.trim();
        if (!name || !msg) return;
        sendToSheet({ type: 'wish', name, message: msg, attend: '', side: '', guests: '' });
        const wishes = JSON.parse(localStorage.getItem('wedding_wishes') || '[]');
        wishes.unshift({ name, msg, time: new Date().toLocaleString('vi-VN') });
        localStorage.setItem('wedding_wishes', JSON.stringify(wishes));
        renderWishes();
        e.target.reset();
    });

    // ===== MUSIC PLAYLIST =====
    const music = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicToggle');
    let musicPlaying = false;
    let currentTrack = 0;

    // Playlist nhạc đám cưới
    const playlist = [
        'music/cuoithoi.mp3'
    ];

    function loadTrack(index) {
        music.src = playlist[index];
        music.load();
    }

    // Chọn bài tiếp theo ngẫu nhiên (khác bài đang phát)
    function nextRandomTrack() {
        if (playlist.length <= 1) return 0;
        let next;
        do {
            next = Math.floor(Math.random() * playlist.length);
        } while (next === currentTrack);
        return next;
    }

    // Khi bài hết, chuyển sang bài ngẫu nhiên khác
    music.addEventListener('ended', () => {
        currentTrack = nextRandomTrack();
        loadTrack(currentTrack);
        music.play().catch(() => {});
    });

    // Auto-play khi user tương tác lần đầu (browser yêu cầu)
    function autoPlayMusic() {
        if (musicPlaying) return;
        music.play().then(() => {
            musicPlaying = true;
            musicBtn.classList.add('playing');
        }).catch(() => {});
    }

    // Bài đầu tiên cũng ngẫu nhiên
    currentTrack = Math.floor(Math.random() * playlist.length);
    loadTrack(currentTrack);
    document.addEventListener('click', function firstClick() {
        autoPlayMusic();
        document.removeEventListener('click', firstClick);
    }, { once: true });
    document.addEventListener('touchstart', function firstTouch() {
        autoPlayMusic();
        document.removeEventListener('touchstart', firstTouch);
    }, { once: true });
    // Cũng thử play ngay (một số browser cho phép)
    music.play().then(() => {
        musicPlaying = true;
        musicBtn.classList.add('playing');
    }).catch(() => {});

    musicBtn.addEventListener('click', () => {
        if (musicPlaying) { music.pause(); musicBtn.classList.remove('playing'); }
        else { music.play().catch(() => {}); musicBtn.classList.add('playing'); }
        musicPlaying = !musicPlaying;
    });

    // ===== FALLING PETALS =====
    const canvas = document.getElementById('petalCanvas');
    const ctx = canvas.getContext('2d');
    let petals = [];
    const PETAL_COUNT = 25;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Petal {
        constructor() { this.reset(true); }
        reset(init) {
            this.x = Math.random() * canvas.width;
            this.y = init ? Math.random() * canvas.height * -1 : -20;
            this.size = Math.random() * 8 + 4;
            this.speedY = Math.random() * 1 + 0.5;
            this.speedX = Math.random() * 0.8 - 0.4;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 0.02;
            this.opacity = Math.random() * 0.4 + 0.2;
            this.color = ['#f4c2c2', '#e8b4b8', '#f7d6d0', '#fce4ec'][Math.floor(Math.random() * 4)];
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.3;
            this.rotation += this.rotSpeed;
            if (this.y > canvas.height + 20) this.reset(false);
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            // Simple petal shape
            ctx.ellipse(0, 0, this.size * 0.5, this.size, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < PETAL_COUNT; i++) petals.push(new Petal());

    function animatePetals() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        petals.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animatePetals);
    }
    animatePetals();

})();

