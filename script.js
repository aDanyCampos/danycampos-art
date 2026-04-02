document.addEventListener('DOMContentLoaded', () => {
    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const captionText = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.close-lightbox');
    const galleryItems = document.querySelectorAll('.gallery-item img');

    galleryItems.forEach(img => {
        img.addEventListener('click', () => {
            lightbox.style.display = 'flex';
            lightboxImg.src = img.src;

            const item = img.closest('.gallery-item');
            const title = item.dataset.title || item.querySelector('h3').innerText;
            const series = item.dataset.series ? `<p><strong>Série:</strong> ${item.dataset.series}</p>` : '';
            const date = item.dataset.date ? `<p><strong>Data:</strong> ${item.dataset.date}</p>` : '';
            const dimensions = item.dataset.dimensions ? `<p><strong>Dimensões:</strong> ${item.dataset.dimensions}</p>` : '';
            const technique = item.dataset.technique ? `<p><strong>Técnica:</strong> ${item.dataset.technique}</p>` : '';

            captionText.innerHTML = `
                <h3>${title}</h3>
                <div class="lightbox-details">
                    ${series}
                    ${dimensions}
                    ${technique}
                    ${date}
                </div>
            `;
            document.body.style.overflow = 'hidden'; // Disable scrolling
        });
    });

    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto'; // Enable scrolling
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.style.display === 'flex') {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Instagram-style Like Button Injection
    const galleryContainers = document.querySelectorAll('.gallery-item');
    
    galleryContainers.forEach((item) => {
        // Generate a stable key based on the title
        const originalTitle = item.dataset.title || item.querySelector('h3').innerText || 'unknown';
        const safeKey = originalTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const namespaceKey = `like_art_${safeKey}`;
        
        // Outline heart SVG and solid heart SVG
        const heartOutline = `<svg aria-label="Curtir" class="heart-icon outline" fill="currentColor" viewBox="0 0 24 24" width="24" height="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.543 1.117 1.543s.277-.368 1.117-1.543a4.21 4.21 0 0 1 3.675-1.941z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`;
        const heartSolid = `<svg aria-label="Descurtir" class="heart-icon solid" fill="#ed4956" viewBox="0 0 24 24" width="24" height="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.543 1.117 1.543s.277-.368 1.117-1.543a4.21 4.21 0 0 1 3.675-1.941z" fill="#ed4956" stroke="none"></path></svg>`;
        
        // Local preference tracking
        const isLikedLocal = localStorage.getItem(namespaceKey) === 'true';
        let currentLikes = isLikedLocal ? 1 : 0; // Starts at safe fallback
        
        const likeContainer = document.createElement('div');
        likeContainer.className = 'like-container';
        
        likeContainer.innerHTML = `
            <button class="like-btn ${isLikedLocal ? 'liked' : ''}">
                ${isLikedLocal ? heartSolid : heartOutline}
            </button>
            <span class="like-count">${currentLikes}</span>
        `;
        
        item.appendChild(likeContainer);
        
        const likeBtn = likeContainer.querySelector('.like-btn');
        const likeCount = likeContainer.querySelector('.like-count');

        // Fetch global state lazily when the painting is visible to avoid clogging network limits
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    fetch(`https://api.counterapi.dev/v1/danycamposart/${namespaceKey}`)
                        .then(res => res.json())
                        .then(data => {
                            if(data && data.count !== undefined) {
                                currentLikes = data.count;
                                likeCount.textContent = currentLikes;
                            }
                        })
                        .catch(err => {
                            // Silently ignore, keeping local fallback
                        });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        observer.observe(item);
        
        // Prevent click from triggering the lightbox
        likeContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const isCurrentlyLiked = likeBtn.classList.contains('liked');
            let action = isCurrentlyLiked ? 'down' : 'up';
            
            // Switch UI optimistically
            if (isCurrentlyLiked) {
                likeBtn.classList.remove('liked');
                likeBtn.innerHTML = heartOutline;
                currentLikes = Math.max(0, currentLikes - 1);
                localStorage.setItem(namespaceKey, 'false');
            } else {
                likeBtn.classList.add('liked');
                likeBtn.innerHTML = heartSolid;
                currentLikes++;
                localStorage.setItem(namespaceKey, 'true');
                
                // Add pop animation
                likeBtn.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    likeBtn.style.transform = '';
                }, 200);
            }
            likeCount.textContent = currentLikes;

            // Make API request without blocking
            fetch(`https://api.counterapi.dev/v1/danycamposart/${namespaceKey}/${action}`)
                .then(res => res.json())
                .then(data => {
                    if(data && data.count !== undefined) {
                        currentLikes = data.count; // sync true count
                        likeCount.textContent = currentLikes;
                    }
                })
                .catch(e => console.error("Erro curtindo", e));
                
            // Update Mestre / Global Counter silently
            fetch(`https://api.counterapi.dev/v1/danycamposart/global_likes_total/${action}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.count !== undefined) {
                        const globalEl = document.getElementById('public-likes');
                        if (globalEl) globalEl.textContent = data.count;
                    }
                }).catch(()=>{});
        });
    });
});

// Initialize Public Counters on Page Load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch Visits
    fetch('https://api.counterapi.dev/v1/danycamposart/visits/up')
        .then(r => r.json())
        .then(data => {
            if(data && data.count) {
                const visitEl = document.getElementById('public-visits');
                if (visitEl) visitEl.textContent = data.count;
            }
        })
        .catch(err => console.error("Erro visitas:", err));

    // 2. Fetch Global Likes
    fetch('https://api.counterapi.dev/v1/danycamposart/global_likes_total')
        .then(r => r.json())
        .then(data => {
            if(data && data.count !== undefined) {
                 const likeEl = document.getElementById('public-likes');
                 if (likeEl) likeEl.textContent = data.count;
            } else {
                 const likeEl = document.getElementById('public-likes');
                 if (likeEl) likeEl.textContent = '0';
            }
        })
        .catch(err => {
             const likeEl = document.getElementById('public-likes');
             if (likeEl) likeEl.textContent = '0';
        });
});
