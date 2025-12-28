// TMDB API Configuration
const API_KEY = 'a98edb8178aa94ef7cd9a0bd2d107f76';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOThlZGI4MTc4YWE5NGVmN2NkOWEwYmQyZDEwN2Y3NiIsIm5iZiI6MTc2Njk1ODk2Ni44MTIsInN1YiI6IjY5NTFhNzc2MTQyMjhmNmQwNjg4ZGQ0NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ccMcing7m3iCeFjh58mSOrTNbnYCuS2hBa8TmIDTovE';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Global State
let currentPage = 1;
let currentSection = 'popular';
let currentView = 'grid';
let imageConfig = {};
let genres = [];
let selectedGenres = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Initialize App
async function initializeApp() {
    try {
        // Get API configuration
        await fetchConfiguration();
        // Load genres
        await fetchGenres();
        // Load initial movies
        await loadMovies('popular');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize. Please refresh the page.');
    }
}

// Fetch Genres
async function fetchGenres() {
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
        const data = await response.json();
        genres = data.genres;
        renderGenres();
    } catch (error) {
        console.error('Error fetching genres:', error);
    }
}

// Render Genres
function renderGenres() {
    const genresButtons = document.getElementById('genres-buttons');
    if (genresButtons) {
        genresButtons.innerHTML = genres.map(genre => `
            <button class="filter-btn genre-btn" data-genre-id="${genre.id}">${genre.name}</button>
        `).join('');
        
        // Add click handlers for genre buttons
        document.querySelectorAll('.genre-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const genreId = parseInt(btn.dataset.genreId);
                if (selectedGenres.includes(genreId)) {
                    selectedGenres = selectedGenres.filter(id => id !== genreId);
                    btn.classList.remove('active');
                } else {
                    selectedGenres.push(genreId);
                    btn.classList.add('active');
                }
                applyFilters();
            });
        });
    }
}

// Fetch API Configuration
async function fetchConfiguration() {
    try {
        const response = await fetch(`${BASE_URL}/configuration?api_key=${API_KEY}`);
        const data = await response.json();
        imageConfig = data.images;
    } catch (error) {
        console.error('Error fetching configuration:', error);
    }
}


// Setup Event Listeners
function setupEventListeners() {
    // Hamburger menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const hamburgerClose = document.getElementById('hamburger-close');
    
    if (hamburgerBtn && hamburgerMenu) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerMenu.classList.add('active');
        });
    }
    
    if (hamburgerClose && hamburgerMenu) {
        hamburgerClose.addEventListener('click', () => {
            hamburgerMenu.classList.remove('active');
        });
    }
    
    // Close hamburger menu when clicking outside
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', (e) => {
            if (e.target === hamburgerMenu) {
                hamburgerMenu.classList.remove('active');
            }
        });
    }
    
    // Category buttons (single selection)
    document.querySelectorAll('#categories-buttons .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all category buttons
            document.querySelectorAll('#categories-buttons .filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            btn.classList.add('active');
            
            const section = btn.dataset.section;
            if (section) {
                currentSection = section;
                currentPage = 1;
                selectedGenres = []; // Clear genres when category changes
                document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
                applyFilters();
            }
        });
    });
    
    // Search in menu
    const searchInputMenu = document.getElementById('search-input-menu');
    const searchBtnMenu = document.getElementById('search-btn-menu');
    if (searchBtnMenu) {
        searchBtnMenu.addEventListener('click', () => {
            const query = searchInputMenu ? searchInputMenu.value.trim() : '';
            if (query) {
                document.getElementById('search-input').value = query;
                handleSearch();
                hamburgerMenu.classList.remove('active');
            }
        });
    }
    if (searchInputMenu) {
        searchInputMenu.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInputMenu.value.trim();
                if (query) {
                    document.getElementById('search-input').value = query;
                    handleSearch();
                    hamburgerMenu.classList.remove('active');
                }
            }
        });
    }

    // Search icon button (mobile)
    const searchIconBtn = document.getElementById('search-icon-btn');
    const searchInputWrapper = document.getElementById('search-input-wrapper');
    if (searchIconBtn && searchInputWrapper) {
        searchIconBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInputWrapper.classList.toggle('active');
            if (searchInputWrapper.classList.contains('active')) {
                setTimeout(() => {
                    document.getElementById('search-input').focus();
                }, 100);
            }
        });

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInputWrapper.contains(e.target) && !searchIconBtn.contains(e.target)) {
                searchInputWrapper.classList.remove('active');
            }
        });
    }

    // Search
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentView = e.target.dataset.view;
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            toggleView();
        });
    });

    // Modal close
    document.querySelectorAll('.close-modal').forEach(close => {
        close.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}


// Toggle View
function toggleView() {
    const grid = document.getElementById('movies-grid');
    const cards = document.querySelectorAll('.movie-card');
    
    if (currentView === 'list') {
        grid.classList.add('list-view');
        cards.forEach(card => card.classList.add('list-view'));
    } else {
        grid.classList.remove('list-view');
        cards.forEach(card => card.classList.remove('list-view'));
    }
}

// Load Movies
async function loadMovies(section) {
    showLoading(true);
    const sectionTitle = document.getElementById('section-title');
    
    try {
        let endpoint = '';
        let title = '';
        
        switch(section) {
            case 'popular':
                endpoint = '/movie/popular';
                title = 'Popular Movies';
                break;
            case 'top-rated':
                endpoint = '/movie/top_rated';
                title = 'Top Rated Movies';
                break;
            case 'now-playing':
                endpoint = '/movie/now_playing';
                title = 'Now Playing';
                break;
            case 'upcoming':
                endpoint = '/movie/upcoming';
                title = 'Upcoming Movies';
                break;
            default:
                endpoint = '/movie/popular';
                title = 'Popular Movies';
        }
        
        sectionTitle.textContent = title;
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&page=${currentPage}`);
        const data = await response.json();
        
        renderMovies(data.results);
        renderPagination(data.page, data.total_pages);
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Failed to load movies. Please try again.');
    } finally {
        showLoading(false);
    }
}


// Handle Search
async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    showLoading(true);
    currentPage = 1;
    
    try {
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`);
        const data = await response.json();
        
        document.getElementById('section-title').textContent = `Search Results for "${query}"`;
        renderMovies(data.results);
        renderPagination(data.page, data.total_pages);
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    } catch (error) {
        console.error('Error searching movies:', error);
        showError('Failed to search movies. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Render Movies
function renderMovies(movies) {
    const grid = document.getElementById('movies-grid');
    
    if (!movies || movies.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-film"></i><p>No movies found</p></div>';
        return;
    }
    
    grid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    
    // Add click handlers
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const movieId = card.dataset.movieId;
            openMovieDetail(movieId);
        });
    });
    
    // Apply current view
    toggleView();
}

// Create Movie Card
function createMovieCard(movie) {
    const posterPath = movie.poster_path 
        ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image';
    
    const releaseDate = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${releaseDate}</span>
                    <span class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${rating}
                    </span>
                </div>
                ${movie.overview ? `<p class="movie-overview">${movie.overview}</p>` : ''}
            </div>
        </div>
    `;
}

// Render Pagination
function renderPagination(current, total) {
    const pagination = document.getElementById('pagination');
    
    if (total <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button ${current === 1 ? 'disabled' : ''} onclick="changePage(${current - 1})">
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(total, current + 2);
    
    if (startPage > 1) {
        html += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span style="padding: 0.5rem;">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === current ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    
    if (endPage < total) {
        if (endPage < total - 1) {
            html += `<span style="padding: 0.5rem;">...</span>`;
        }
        html += `<button onclick="changePage(${total})">${total}</button>`;
    }
    
    // Next button
    html += `<button ${current === total ? 'disabled' : ''} onclick="changePage(${current + 1})">
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    pagination.innerHTML = html;
}

// Apply Filters
function applyFilters() {
    currentPage = 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (selectedGenres.length > 0) {
        loadMoviesByGenres();
    } else {
        loadMovies(currentSection);
    }
}

// Load Movies by Genres
async function loadMoviesByGenres() {
    showLoading(true);
    
    try {
        const genreIds = selectedGenres.join(',');
        const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreIds}&page=${currentPage}&sort_by=popularity.desc`);
        const data = await response.json();
        
        document.getElementById('section-title').textContent = 'Movies by Genre';
        renderMovies(data.results);
        renderPagination(data.page, data.total_pages);
    } catch (error) {
        console.error('Error loading movies by genre:', error);
        showError('Failed to load movies. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Change Page
function changePage(page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (document.getElementById('search-input').value.trim()) {
        handleSearch();
    } else if (selectedGenres.length > 0) {
        loadMoviesByGenres();
    } else {
        loadMovies(currentSection);
    }
}

// Open Movie Detail
async function openMovieDetail(movieId) {
    const modal = document.getElementById('movie-modal');
    const modalBody = document.getElementById('modal-body');
    
    modal.classList.add('active');
    modalBody.innerHTML = '<div class="loading active"><div class="spinner"></div><p>Loading movie details...</p></div>';
    
    try {
        // Fetch all movie data in parallel
        const [movie, credits, videos, reviews, similar, recommendations, images] = await Promise.all([
            fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/reviews?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/recommendations?api_key=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/movie/${movieId}/images?api_key=${API_KEY}`).then(r => r.json())
        ]);
        
        renderMovieDetail(movie, credits, videos, reviews, similar, recommendations, images);
    } catch (error) {
        console.error('Error loading movie details:', error);
        modalBody.innerHTML = '<div class="empty-state"><p>Failed to load movie details. Please try again.</p></div>';
    }
}

// Render Movie Detail
function renderMovieDetail(movie, credits, videos, reviews, similar, recommendations, images) {
    const modalBody = document.getElementById('modal-body');
    
    const posterPath = movie.poster_path 
        ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image';
    
    const backdropPath = movie.backdrop_path 
        ? `${IMAGE_BASE_URL}/original${movie.backdrop_path}`
        : '';
    
    const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
    const budget = movie.budget ? `$${movie.budget.toLocaleString()}` : 'N/A';
    const revenue = movie.revenue ? `$${movie.revenue.toLocaleString()}` : 'N/A';
    const releaseDate = movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'N/A';
    
    const movieGenres = movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A';
    const productionCompanies = movie.production_companies 
        ? movie.production_companies.map(c => c.name).join(', ')
        : 'N/A';
    
    const cast = credits.cast ? credits.cast.slice(0, 12) : [];
    const crew = credits.crew ? credits.crew.filter(c => ['Director', 'Producer', 'Screenplay', 'Writer'].includes(c.job)).slice(0, 10) : [];
    
    const trailerVideos = videos.results ? videos.results.filter(v => v.type === 'Trailer' && v.site === 'YouTube').slice(0, 6) : [];
    const otherVideos = videos.results ? videos.results.filter(v => v.type !== 'Trailer' && v.site === 'YouTube').slice(0, 6) : [];
    const allVideos = [...trailerVideos, ...otherVideos].slice(0, 6);
    
    const movieReviews = reviews.results ? reviews.results.slice(0, 5) : [];
    const similarMovies = similar.results ? similar.results.slice(0, 12) : [];
    const recommendedMovies = recommendations.results ? recommendations.results.slice(0, 12) : [];
    
    modalBody.innerHTML = `
        <div class="movie-detail-header" style="${backdropPath ? `background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('${backdropPath}'); background-size: cover; background-position: center; padding: 2rem; border-radius: 10px;` : ''}">
            <img src="${posterPath}" alt="${movie.title}" class="movie-detail-poster">
            <div class="movie-detail-info">
                <h1 class="movie-detail-title">${movie.title}</h1>
                ${movie.tagline ? `<p class="movie-detail-tagline">"${movie.tagline}"</p>` : ''}
                <div class="movie-detail-meta">
                    <span><i class="fas fa-calendar"></i> ${releaseDate}</span>
                    <span><i class="fas fa-clock"></i> ${runtime}</span>
                    <span class="movie-rating"><i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                    <span><i class="fas fa-users"></i> ${movie.vote_count ? movie.vote_count.toLocaleString() : 0} votes</span>
                </div>
                <div class="movie-detail-overview">
                    <h3>Overview</h3>
                    <p>${movie.overview || 'No overview available.'}</p>
                </div>
                <div class="movie-detail-stats">
                    <div class="stat-item">
                        <div class="stat-label">Genres</div>
                        <div class="stat-value" style="font-size: 0.9rem;">${movieGenres}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Budget</div>
                        <div class="stat-value">${budget}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Revenue</div>
                        <div class="stat-value">${revenue}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Status</div>
                        <div class="stat-value" style="font-size: 0.9rem;">${movie.status || 'N/A'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Production</div>
                        <div class="stat-value" style="font-size: 0.85rem;">${productionCompanies}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="detail-tabs">
            <button class="tab-btn active" data-tab="cast">Cast & Crew</button>
            <button class="tab-btn" data-tab="videos">Videos</button>
            <button class="tab-btn" data-tab="reviews">Reviews</button>
            <button class="tab-btn" data-tab="similar">Similar Movies</button>
            <button class="tab-btn" data-tab="recommendations">Recommendations</button>
        </div>
        
        <div class="tab-content active" id="cast-tab">
            <h3 style="margin-bottom: 1rem;">Cast</h3>
            <div class="cast-grid">
                ${cast.map(actor => `
                    <div class="cast-card">
                        <img src="${actor.profile_path ? `${IMAGE_BASE_URL}/w300${actor.profile_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                             alt="${actor.name}" 
                             class="cast-photo"
                             loading="lazy">
                        <div class="cast-name">${actor.name}</div>
                        <div class="cast-character">${actor.character}</div>
                    </div>
                `).join('')}
            </div>
            ${crew.length > 0 ? `
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Crew</h3>
                <div class="cast-grid">
                    ${crew.map(member => `
                        <div class="cast-card">
                            <img src="${member.profile_path ? `${IMAGE_BASE_URL}/w300${member.profile_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                                 alt="${member.name}" 
                                 class="cast-photo"
                                 loading="lazy">
                            <div class="cast-name">${member.name}</div>
                            <div class="cast-character">${member.job}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
        
        <div class="tab-content" id="videos-tab">
            ${allVideos.length > 0 ? `
                <div class="videos-list">
                    ${allVideos.map(video => {
                        if (!video.key || !video.site || video.site !== 'YouTube') return '';
                        const videoKey = String(video.key).trim();
                        const cleanKey = videoKey.replace(/[^a-zA-Z0-9_-]/g, '');
                        if (!cleanKey) return '';
                        const youtubeUrl = `https://www.youtube.com/watch?v=${cleanKey}`;
                        const videoName = video.name || video.type || 'Video';
                        const videoType = video.type || 'Video';
                        return `
                        <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="video-list-item">
                            <div class="video-list-icon">
                                <i class="fab fa-youtube"></i>
                            </div>
                            <div class="video-list-info">
                                <div class="video-list-name">${videoName}</div>
                                <div class="video-list-type">${videoType}</div>
                            </div>
                            <div class="video-list-arrow">
                                <i class="fas fa-external-link-alt"></i>
                            </div>
                        </a>
                        `;
                    }).filter(v => v !== '').join('')}
                </div>
            ` : '<div class="empty-state"><p>No videos available</p></div>'}
        </div>
        
        <div class="tab-content" id="reviews-tab">
            ${movieReviews.length > 0 ? `
                ${movieReviews.map(review => `
                    <div class="review-item">
                        <div class="review-header">
                            <div class="review-author">${review.author}</div>
                            ${review.author_details.rating ? `<div class="review-rating"><i class="fas fa-star"></i> ${review.author_details.rating}/10</div>` : ''}
                        </div>
                        <div class="review-content">${review.content}</div>
                    </div>
                `).join('')}
            ` : '<div class="empty-state"><p>No reviews available</p></div>'}
        </div>
        
        <div class="tab-content" id="similar-tab">
            ${similarMovies.length > 0 ? `
                <div class="similar-movies-grid">
                    ${similarMovies.map(m => `
                        <div class="similar-movie-card" onclick="openMovieDetail(${m.id})">
                            <img src="${m.poster_path ? `${IMAGE_BASE_URL}/w300${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                                 alt="${m.title}" 
                                 class="similar-movie-poster"
                                 loading="lazy">
                            <div style="margin-top: 0.5rem; text-align: center;">
                                <div style="font-weight: bold; margin-bottom: 0.3rem;">${m.title}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">
                                    <i class="fas fa-star" style="color: #ffd700;"></i> ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="empty-state"><p>No similar movies available</p></div>'}
        </div>
        
        <div class="tab-content" id="recommendations-tab">
            ${recommendedMovies.length > 0 ? `
                <div class="similar-movies-grid">
                    ${recommendedMovies.map(m => `
                        <div class="similar-movie-card" onclick="openMovieDetail(${m.id})">
                            <img src="${m.poster_path ? `${IMAGE_BASE_URL}/w300${m.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                                 alt="${m.title}" 
                                 class="similar-movie-poster"
                                 loading="lazy">
                            <div style="margin-top: 0.5rem; text-align: center;">
                                <div style="font-weight: bold; margin-bottom: 0.3rem;">${m.title}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">
                                    <i class="fas fa-star" style="color: #ffd700;"></i> ${m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<div class="empty-state"><p>No recommendations available</p></div>'}
        </div>
    `;
    
    // Setup tab switching
    setupTabs();
}

// Setup Tabs
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Open Genre Modal

// Show Loading
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

// Show Error
function showError(message) {
    const grid = document.getElementById('movies-grid');
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>${message}</p></div>`;
}

// Make functions globally available
window.changePage = changePage;
window.openMovieDetail = openMovieDetail;

